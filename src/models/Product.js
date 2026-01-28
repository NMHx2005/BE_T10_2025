import mongoose, { mongo } from "mongoose";

const productVariantSchema = new mongoose.Schema({
    // SKU: stock keeping unit
    // TSHIRT-S-RED-001
    sku: {
        type: String,
        require: [true, 'SKU là bắt buộc'],
        trim: true,
        unique: true,
        index: true
    },

    attributes: {
        type: Map,
        of: String,
        require: [true, 'Attributes là bắt buộc']
    },

    price: {
        type: Number,
        require: [true, 'Giá là bắt buộc'],
        min: [0, 'Giá phải lớn hơn hoặc bằng 0']
    },

    compareAtPrice: {
        type: Number,
        min: [0, 'Giá trị so sánh phải lớn hơn hoặc bằng 0'],
        validate: {
            validator: function (value) {
                return !value || value > this.price;
            },
            message: 'Giá trị so sánh phải lớn hơn price'
        }
    },

    stock: {
        type: Number,
        require: [true, 'Stock là bắt buộc'],
        default: 0,
        min: [0, 'Stock phải lớn hoặc hoặc bằng 0']
    },

    image: [
        {
            type: String,
            trim: true
        }
    ],

    weight: {
        type: Number,
        min: [0, 'Trọng lượng phải lớn hơn']
    },

    barcode: {
        type: String,
        trim: true
    },

    isActive: {
        type: Boolean,
        default: true
    }



}, {
    timestamps: true,
    _id: true
})



productVariantSchema.virtual('discountPercentage').get(function () {
    if (this.compareAtPrice && this.compareAtPrice > this.price) {
        return Math.round(((this.compareAtPrice - this.price) / this.compareAtPrice) * 100);
    }
    return 0;
})


productVariantSchema.virtual('isInStock').get(function () {
    return this.stock > 0 && this.isActive;
})



productVariantSchema.methods.decreaseStock = function (quantity) {
    if (this.stock < quantity) {
        throw new Error('Không đủ hàng trong kho');
    }

    this.stock -= quantity;
    return this.save();
}



productVariantSchema.methods.increaseStock = function (quantity) {
    this.stock += quantity;
    return this.save();
}





// Product Schema
const productSchema = new mongoose.Schema({
    name: String,
    slug: String,
    description: String,
    shortDescription: String,
    brand: String,
    category: mongoose.Schema.Types.ObjectId,
    variants: [productVariantSchema],
    images: [String],
    tags: String,
    status: String,
    featured: Boolean,
    // rating: 
    // SEO
    // createdBy: mongoose.Schema.Types.ObjectId,
    // updatedBy: mongoose.Schema.Types.ObjectId
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})












const Product = mongoose.model('Product', productSchema);

export default Product;


