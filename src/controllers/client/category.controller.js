import Category from "../../models/Category.js";
import { NotFoundError, ValidationError } from "../../utils/errors.js";
import slugify from "slugify";
import { getCategoryTree, getCategoryProductCount } from "../../services/category.service.js";

/**
 * GET /api/categories
 * Lấy danh sách tất cả categories (tree structure)
 */
export const getAllCategories = async (req, res, next) => {
    try {
        const categories = await getCategoryTree(null, 0);

        res.status(200).json({
            success: true,
            message: 'Lấy danh sách categories thành công',
            data: categories,
            total: categories.length
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/categories/:id
 * Lấy chi tiết một category
 */
export const getCategoryDetail = async (req, res, next) => {
    try {
        const { id } = req.params;

        const category = await Category.findById(id)
            .populate('parent', 'name slug')
            .lean();

        if (!category) {
            throw new NotFoundError('Danh mục không tồn tại');
        }

        // Lấy số lượng sản phẩm
        const productCount = await getCategoryProductCount(id);

        res.status(200).json({
            success: true,
            data: {
                ...category,
                productCount
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/categories
 * Tạo danh mục mới (Admin)
 */
export const createCategory = async (req, res, next) => {
    try {
        const {
            name,
            description = '',
            parent = null,
            image = '',
            icon = '',
            order = 0,
            status: bodyStatus,
        } = req.body;

        if (!name || !name.trim()) {
            throw new ValidationError('Tên danh mục là bắt buộc');
        }

        // Tạo slug từ tên
        const baseSlug = slugify(name, {
            lower: true,
            strict: true,
            trim: true
        });

        let slug = baseSlug;
        let counter = 1;
        while (await Category.exists({ slug })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        // Nếu có parent, kiểm tra xem parent có tồn tại không
        if (parent) {
            const parentExists = await Category.exists({ _id: parent });
            if (!parentExists) {
                throw new NotFoundError('Danh mục cha không tồn tại');
            }
        }

        const orderNum = Number(order);
        const statusVal =
            bodyStatus && ['active', 'inactive'].includes(bodyStatus) ? bodyStatus : 'active';

        const newCategory = await Category.create({
            name: name.trim(),
            slug,
            description,
            parent: parent || null,
            image,
            icon,
            order: Number.isFinite(orderNum) ? orderNum : 0,
            status: statusVal,
        });

        res.status(201).json({
            success: true,
            message: 'Tạo danh mục thành công',
            data: newCategory
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/categories/:id
 * Cập nhật danh mục (Admin)
 */
export const updateCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, parent, image, icon, order, status } = req.body;

        const category = await Category.findById(id);
        if (!category) {
            throw new NotFoundError('Danh mục không tồn tại');
        }

        // Nếu cập nhật name => regenerate slug
        if (name && name.trim() && name !== category.name) {
            const baseSlug = slugify(name, { lower: true, strict: true, trim: true });
            let slug = baseSlug;
            let counter = 1;
            while (await Category.exists({ _id: { $ne: id }, slug })) {
                slug = `${baseSlug}-${counter}`;
                counter++;
            }
            category.slug = slug;
            category.name = name.trim();
        }

        // Cập nhật các field khác
        if (description !== undefined) category.description = description;
        if (parent !== undefined) {
            if (parent && String(parent) === String(id)) {
                throw new ValidationError('Danh mục không thể là cha của chính nó');
            }
            if (parent) {
                const parentExists = await Category.exists({ _id: parent });
                if (!parentExists) {
                    throw new NotFoundError('Danh mục cha không tồn tại');
                }
                let walk = parent;
                while (walk) {
                    if (String(walk) === String(id)) {
                        throw new ValidationError(
                            'Không thể đặt danh mục cha thuộc nhánh con của chính danh mục này',
                        );
                    }
                    const up = await Category.findById(walk).select('parent').lean();
                    if (!up) break;
                    walk = up.parent;
                }
            }
            category.parent = parent || null;
        }
        if (image !== undefined) category.image = image;
        if (icon !== undefined) category.icon = icon;
        if (order !== undefined) {
            const orderNum = Number(order);
            category.order = Number.isFinite(orderNum) ? orderNum : 0;
        }
        if (status !== undefined && ['active', 'inactive'].includes(status)) {
            category.status = status;
        }

        await category.save();

        res.status(200).json({
            success: true,
            message: 'Cập nhật danh mục thành công',
            data: category
        });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/categories/:id
 * Xóa danh mục (Admin)
 */
export const deleteCategory = async (req, res, next) => {
    try {
        const { id } = req.params;

        const category = await Category.findById(id);
        if (!category) {
            throw new NotFoundError('Danh mục không tồn tại');
        }

        // Kiểm tra xem có category con không
        const childCount = await Category.countDocuments({ parent: id });
        if (childCount > 0) {
            throw new ValidationError('Không thể xóa danh mục có danh mục con. Vui lòng xóa danh mục con trước.');
        }

        // Kiểm tra xem có sản phẩm không
        const { Product } = await import('../../models/Product.js');
        const productCount = await Product.countDocuments({ category: id });
        if (productCount > 0) {
            throw new ValidationError(`Không thể xóa danh mục có ${productCount} sản phẩm. Vui lòng di chuyển sản phẩm ra danh mục khác trước.`);
        }

        await Category.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Xóa danh mục thành công'
        });
    } catch (error) {
        next(error);
    }
};
