// ============================================
// BRAND MODEL
// Model cho thương hiệu sản phẩm
// ============================================

import mongoose from 'mongoose';

/**
 * BRAND SCHEMA
 * Schema cho brand
 */
const brandSchema = new mongoose.Schema({
    /**
     * NAME
     * Tên thương hiệu
     */
    name: {
        type: String,
        required: [true, 'Tên thương hiệu là bắt buộc'],
        trim: true,
        unique: true,
        index: true
    },
    
    /**
     * SLUG
     * URL-friendly name
     * Ví dụ: "nike" từ "Nike"
     */
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        index: true
    },
    
    /**
     * DESCRIPTION
     * Mô tả thương hiệu
     */
    description: {
        type: String,
        trim: true
    },
    
    /**
     * SHORT DESCRIPTION
     * Mô tả ngắn (cho preview)
     */
    shortDescription: {
        type: String,
        trim: true,
        maxLength: [200, 'Short description không được quá 200 ký tự']
    },
    
    /**
     * LOGO
     * Logo của thương hiệu
     * URL từ Cloudinary
     */
    logo: {
        type: String,
        trim: true
    },
    
    /**
     * BANNER
     * Banner image cho brand page
     */
    banner: {
        type: String,
        trim: true
    },
    
    /**
     * WEBSITE
     * Website chính thức của thương hiệu
     */
    website: {
        type: String,
        trim: true,
        validate: {
            validator: function(value) {
                if (!value) return true; // Optional
                // Basic URL validation
                return /^https?:\/\/.+/.test(value);
            },
            message: 'Website phải là URL hợp lệ'
        }
    },
    
    /**
     * COUNTRY
     * Quốc gia của thương hiệu
     */
    country: {
        type: String,
        trim: true
    },
    
    /**
     * FOUNDED YEAR
     * Năm thành lập
     */
    foundedYear: {
        type: Number,
        min: [1800, 'Năm thành lập phải từ 1800 trở đi'],
        max: [new Date().getFullYear(), 'Năm thành lập không thể lớn hơn năm hiện tại']
    },
    
    /**
     * CONTACT EMAIL
     * Email liên hệ
     */
    contactEmail: {
        type: String,
        trim: true,
        lowercase: true,
        validate: {
            validator: function(value) {
                if (!value) return true; // Optional
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            },
            message: 'Email không hợp lệ'
        }
    },
    
    /**
     * SOCIAL MEDIA
     * Các mạng xã hội của brand
     */
    socialMedia: {
        facebook: {
            type: String,
            trim: true
        },
        instagram: {
            type: String,
            trim: true
        },
        twitter: {
            type: String,
            trim: true
        },
        youtube: {
            type: String,
            trim: true
        }
    },
    
    /**
     * STATUS
     * Trạng thái brand
     */
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active',
        index: true
    },
    
    /**
     * FEATURED
     * Brand nổi bật
     */
    featured: {
        type: Boolean,
        default: false,
        index: true
    },
    
    /**
     * PRODUCT COUNT
     * Số lượng sản phẩm của brand
     * Được cập nhật tự động
     */
    productCount: {
        type: Number,
        default: 0,
        min: 0
    },
    
    /**
     * SEO
     * Thông tin SEO
     */
    seo: {
        title: {
            type: String,
            trim: true
        },
        description: {
            type: String,
            trim: true
        },
        keywords: [{
            type: String,
            trim: true
        }]
    },
    
    /**
     * ORDER
     * Thứ tự hiển thị (số càng nhỏ hiển thị trước)
     */
    order: {
        type: Number,
        default: 0,
        index: true
    },
    
    /**
     * CREATED BY
     * User tạo brand
     */
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    /**
     * UPDATED BY
     * User cập nhật brand lần cuối
     */
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});


/**
 * INDEXES
 * Tạo indexes để tối ưu queries
 */

// Index cho text search
brandSchema.index({ name: 'text', description: 'text' });

// Index cho filter
brandSchema.index({ status: 1, featured: 1 });
brandSchema.index({ status: 1, order: 1 });
brandSchema.index({ country: 1, status: 1 });

// Compound index cho common queries
brandSchema.index({ status: 1, featured: 1, order: 1 });


/**
 * VIRTUAL FIELDS
 * Các field được tính toán từ data có sẵn
 */

/**
 * VIRTUAL: PRODUCTS
 * Lấy tất cả products của brand này
 */
brandSchema.virtual('products', {
    ref: 'Product',
    localField: '_id',
    foreignField: 'brand',
    justOne: false
});

/**
 * VIRTUAL: ACTIVE PRODUCTS COUNT
 * Số lượng products đang active của brand
 */
brandSchema.virtual('activeProductsCount').get(async function() {
    const Product = mongoose.model('Product');
    return await Product.countDocuments({
        brand: this._id,
        status: 'active'
    });
});

/**
 * VIRTUAL: BRAND AGE
 * Tuổi của brand (tính từ năm thành lập)
 */
brandSchema.virtual('brandAge').get(function() {
    if (!this.foundedYear) {
        return null;
    }
    return new Date().getFullYear() - this.foundedYear;
});


/**
 * PRE-SAVE MIDDLEWARE
 * Chạy trước khi lưu document
 */

/**
 * PRE-SAVE: GENERATE SLUG
 * Tự động tạo slug từ name nếu chưa có
 */
brandSchema.pre('save', function(next) {
    if (!this.slug && this.name) {
        // Convert name to slug
        this.slug = this.name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
            .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with single
            .trim();
    }
    next();
});

/**
 * PRE-SAVE: VALIDATE UNIQUE NAME
 * Kiểm tra name không trùng (nếu đổi name)
 */
brandSchema.pre('save', async function(next) {
    // Chỉ kiểm tra khi tạo mới hoặc đổi name
    if (this.isNew || this.isModified('name')) {
        const existingBrand = await mongoose.model('Brand').findOne({
            name: this.name,
            _id: { $ne: this._id }
        });
        
        if (existingBrand) {
            return next(new Error('Tên thương hiệu đã tồn tại'));
        }
    }
    next();
});


/**
 * POST-SAVE MIDDLEWARE
 * Chạy sau khi lưu document
 */

/**
 * POST-SAVE: UPDATE PRODUCT COUNT
 * Cập nhật productCount tự động
 */
brandSchema.post('save', async function() {
    const Product = mongoose.model('Product');
    const count = await Product.countDocuments({
        brand: this._id,
        status: 'active'
    });
    
    // Chỉ update nếu khác nhau để tránh infinite loop
    if (this.productCount !== count) {
        this.productCount = count;
        await this.save();
    }
});

/**
 * STATIC METHODS
 * Methods gọi trên Model (Brand.method())
 */

/**
 * STATIC: FIND BY SLUG
 * Tìm brand theo slug
 */
brandSchema.statics.findBySlug = function(slug) {
    return this.findOne({ slug, status: 'active' })
        .populate('createdBy', 'username email');
};

/**
 * STATIC: FIND ACTIVE BRANDS
 * Tìm tất cả brands đang active
 */
brandSchema.statics.findActiveBrands = function(options = {}) {
    const query = { status: 'active' };
    
    if (options.featured !== undefined) {
        query.featured = options.featured;
    }
    
    return this.find(query)
        .sort({ order: 1, name: 1 })
        .limit(options.limit || 50)
        .skip(options.skip || 0);
};

/**
 * STATIC: FIND FEATURED BRANDS
 * Tìm tất cả brands nổi bật
 */
brandSchema.statics.findFeaturedBrands = function(limit = 10) {
    return this.find({
        status: 'active',
        featured: true
    })
    .sort({ order: 1, name: 1 })
    .limit(limit);
};

/**
 * STATIC: SEARCH BRANDS
 * Tìm kiếm brands bằng text search
 */
brandSchema.statics.search = function(keyword, options = {}) {
    const query = {
        $text: { $search: keyword },
        status: 'active'
    };
    
    if (options.country) {
        query.country = options.country;
    }
    
    return this.find(query, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .limit(options.limit || 20)
        .skip(options.skip || 0);
};

/**
 * STATIC: FIND BY COUNTRY
 * Tìm brands theo quốc gia
 */
brandSchema.statics.findByCountry = function(country, options = {}) {
    const query = {
        country: country,
        status: 'active'
    };
    
    return this.find(query)
        .sort({ order: 1, name: 1 })
        .limit(options.limit || 50)
        .skip(options.skip || 0);
};

/**
 * STATIC: GET BRANDS WITH PRODUCT COUNT
 * Lấy brands kèm số lượng products
 */
brandSchema.statics.getBrandsWithProductCount = function(options = {}) {
    const query = { status: 'active' };
    
    if (options.featured !== undefined) {
        query.featured = options.featured;
    }
    
    return this.find(query)
        .sort({ productCount: -1, name: 1 })
        .limit(options.limit || 50)
        .skip(options.skip || 0);
};


/**
 * INSTANCE METHODS
 * Methods gọi trên document (brand.method())
 */

/**
 * METHOD: GET PRODUCTS
 * Lấy tất cả products của brand
 */
brandSchema.methods.getProducts = async function(options = {}) {
    const Product = mongoose.model('Product');
    const query = {
        brand: this._id,
        status: 'active'
    };
    
    if (options.category) {
        query.category = options.category;
    }
    
    return Product.find(query)
        .sort(options.sort || { createdAt: -1 })
        .limit(options.limit || 20)
        .skip(options.skip || 0)
        .populate('category', 'name slug');
};

/**
 * METHOD: GET PRODUCT COUNT
 * Lấy số lượng products (tính lại)
 */
brandSchema.methods.getProductCount = async function() {
    const Product = mongoose.model('Product');
    return await Product.countDocuments({
        brand: this._id,
        status: 'active'
    });
};

/**
 * METHOD: UPDATE PRODUCT COUNT
 * Cập nhật productCount
 */
brandSchema.methods.updateProductCount = async function() {
    this.productCount = await this.getProductCount();
    return this.save();
};

/**
 * METHOD: HAS PRODUCTS
 * Kiểm tra brand có products không
 */
brandSchema.methods.hasProducts = async function() {
    return this.productCount > 0;
};

/**
 * METHOD: IS ACTIVE
 * Kiểm tra brand có đang active không
 */
brandSchema.methods.isActive = function() {
    return this.status === 'active';
};


/**
 * CREATE MODEL
 * Tạo Brand model từ schema
 */
const Brand = mongoose.model('Brand', brandSchema);

export default Brand;