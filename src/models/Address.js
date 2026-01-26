// modal cho địa chỉ giao hàng của user
import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    fullName: String,
    phone: String,
    address: String,
    addressNew: Boolean,
    ward: String,
    district: String,
    city: String,
    isDefault: Boolean,
    note: String
}, {
    timestamps: true
})

// index
addressSchema.index({ userId: 1, isDefault: 1 });

// set default address
addressSchema.statics.setDefaultAddress = async function (addressId, userId) {
    // bỏ mặc định của user
    await this.updateMany(
        { userId, isDefault: true },
        { isDefault: false }
    )
    // đặt địa chỉ mặc định
    return this.findByIdAndUpdate(
        addressId,
        { isDefault: true },
        { new: true }
    )
}




const Address = mongoose.model('Address', addressSchema);

export default Address;
