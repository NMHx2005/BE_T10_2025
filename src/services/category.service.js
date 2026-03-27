/**
 * Category Service
 * Các hàm xử lý category tree, breadcrumb, và statistics
 */

import Category from "../models/Category.js";
import Product from "../models/Product.js";
import mongoose from "mongoose";

/**
 * Lấy tất cả category con (descendants) của một category
 * Bao gồm children, grandchildren, v.v.
 * 
 * @param {String} categoryId - ID của category cha
 * @param {Boolean} includeParent - Có bao gồm category cha không
 * @returns {Promise<Array>} - Mảng các category IDs
 */
export const getCategoryDescendants = async (categoryId, includeParent = false) => {
    if (!categoryId) return [];

    try {
        const objectId = new mongoose.Types.ObjectId(categoryId);
        const descendants = [];

        if (includeParent) {
            descendants.push(objectId);
        }

        // Recursive function để lấy tất cả con cháu
        const getChildren = async (parentId) => {
            const children = await Category.find(
                { parent: parentId, status: 'active' },
                '_id'
            );

            for (const child of children) {
                descendants.push(child._id);
                await getChildren(child._id);
            }
        };

        await getChildren(objectId);
        return descendants;
    } catch (error) {
        throw new Error(`Lỗi khi lấy category descendants: ${error.message}`);
    }
};

/**
 * Lấy breadcrumb navigation cho category
 * Ví dụ: [{ id, name, slug }, ...]
 * 
 * @param {String} categoryId - ID của category
 * @returns {Promise<Array>} - Mảng breadcrumb từ root đến category hiện tại
 */
export const getCategoryBreadcrumb = async (categoryId) => {
    if (!categoryId) return [];

    try {
        const breadcrumb = [];
        let current = await Category.findById(categoryId).select('_id name slug parent');

        if (!current) {
            return breadcrumb;
        }

        // Đi ngược từ category hiện tại lên root
        while (current) {
            breadcrumb.unshift({
                id: current._id,
                name: current.name,
                slug: current.slug,
            });

            if (!current.parent) break;

            // Lấy parent
            current = await Category.findById(current.parent).select('_id name slug parent');
        }

        return breadcrumb;
    } catch (error) {
        throw new Error(`Lỗi khi lấy breadcrumb: ${error.message}`);
    }
};

/**
 * Lấy số lượng sản phẩm trong category (bao gồm subcategories)
 * 
 * @param {String} categoryId - ID của category
 * @returns {Promise<Number>} - Số lượng sản phẩm
 */
export const getCategoryProductCount = async (categoryId) => {
    if (!categoryId) return 0;

    try {
        const categoryIds = await getCategoryDescendants(categoryId, true);
        const count = await Product.countDocuments({
            category: { $in: categoryIds },
            deleted: { $ne: true }
        });
        return count;
    } catch (error) {
        throw new Error(`Lỗi khi lấy product count: ${error.message}`);
    }
};

/**
 * Lấy số lượng sản phẩm cho từng subcategory
 * Kết quả: { categoryId: count, ... }
 * 
 * @param {String} parentCategoryId - ID của category cha
 * @returns {Promise<Object>} - Object với categoryId -> product count
 */
export const getCategoryProductCountMap = async (parentCategoryId) => {
    if (!parentCategoryId) return {};

    try {
        // Lấy tất cả children của parentCategory
        const children = await Category.find(
            { parent: parentCategoryId, status: 'active' },
            '_id'
        );

        const result = {};

        // Tính product count cho mỗi child (bao gồm descendants của child)
        for (const child of children) {
            result[child._id.toString()] = await getCategoryProductCount(child._id);
        }

        return result;
    } catch (error) {
        throw new Error(`Lỗi khi lấy category product count map: ${error.message}`);
    }
};

/**
 * Lấy toàn bộ category tree với product count
 * 
 * @param {String} parentCategoryId - ID của category cha (null = root)
 * @param {Number} depth - Độ sâu cần lấy (0 = unlimited)
 * @returns {Promise<Array>} - Mảng categories với children
 */
export const getCategoryTree = async (parentCategoryId = null, depth = 0) => {
    try {
        const categories = await Category.find(
            {
                parent: parentCategoryId || null,
                status: 'active'
            },
            '_id name slug description image icon order productCount'
        ).sort({ order: 1 });

        // Nếu depth = 0 (unlimited), hoặc depth > 0 (có giới hạn)
        if (depth === 0 || depth > 1) {
            for (const category of categories) {
                const children = await getCategoryTree(
                    category._id,
                    depth > 0 ? depth - 1 : 0
                );
                category.children = children;

                // Tính product count nếu chưa có
                if (!category.productCount) {
                    category.productCount = await getCategoryProductCount(category._id);
                }
            }
        }

        return categories;
    } catch (error) {
        throw new Error(`Lỗi khi lấy category tree: ${error.message}`);
    }
};

/**
 * Lấy thống kê chi tiết cho category
 * Bao gồm breadcrumb, product count, children list
 * 
 * @param {String} categoryId - ID của category
 * @returns {Promise<Object>} - Category stats object
 */
export const getCategoryStats = async (categoryId) => {
    if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
        return null;
    }

    try {
        // Lấy thông tin category
        const category = await Category.findById(categoryId).select(
            'name slug description image icon featured'
        );

        if (!category) {
            return null;
        }

        // Lấy breadcrumb
        const breadcrumb = await getCategoryBreadcrumb(categoryId);

        // Lấy số lượng sản phẩm
        const productCount = await getCategoryProductCount(categoryId);

        // Lấy children categories với product count
        const children = await Category.find(
            { parent: categoryId, status: 'active' },
            '_id name slug productCount'
        ).sort({ order: 1 });

        // Tính product count cho mỗi child
        const childrenWithCount = await Promise.all(
            children.map(async (child) => ({
                id: child._id,
                name: child.name,
                slug: child.slug,
                productCount: await getCategoryProductCount(child._id)
            }))
        );

        return {
            id: category._id,
            name: category.name,
            slug: category.slug,
            description: category.description,
            image: category.image,
            icon: category.icon,
            featured: category.featured,
            breadcrumb,
            productCount,
            children: childrenWithCount
        };
    } catch (error) {
        throw new Error(`Lỗi khi lấy category stats: ${error.message}`);
    }
};

/**
 * Kiểm tra category có tồn tại không (và active)
 * 
 * @param {String} categoryId - ID hoặc slug của category
 * @returns {Promise<Boolean>}
 */
export const categoryExists = async (categoryId) => {
    try {
        const query = mongoose.Types.ObjectId.isValid(categoryId)
            ? { _id: categoryId }
            : { slug: categoryId };

        const exists = await Category.exists({
            ...query,
            status: 'active'
        });

        return !!exists;
    } catch (error) {
        return false;
    }
};

/**
 * Lấy category by ID hoặc slug
 * 
 * @param {String} identifier - ID hoặc slug
 * @returns {Promise<Object>}
 */
export const getCategory = async (identifier) => {
    try {
        const query = mongoose.Types.ObjectId.isValid(identifier)
            ? { _id: identifier }
            : { slug: identifier };

        return await Category.findOne({
            ...query,
            status: 'active'
        });
    } catch (error) {
        throw new Error(`Lỗi khi lấy category: ${error.message}`);
    }
};
