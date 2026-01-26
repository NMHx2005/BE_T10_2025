import Address from "../../models/Address.js";
import { NotFoundError } from "../../utils/errors.js";

export const getAddresses = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const addresses = await Address.find({ userId });

        res.status(200).json({
            success: true,
            data: {
                addresses
            }
        })
    } catch (error) {
        next(error);
    }
}



export const createAddress = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const {
            fullName, phone, address, addressNew, ward, district, city, isDefault, note
        } = req.body;

        if (isDefault) {
            await Address.updateMany(
                { userId, isDefault: true },
                { isDefault: false }
            )
        }

        const newAddress = await Address.create({
            userId,
            fullName,
            phone,
            address,
            addressNew,
            ward,
            district,
            city,
            isDefault: isDefault || false,
            note
        })

        res.status(201).json({
            success: true,
            message: 'Thêm địa chỉ thành công',
            data: {
                address: newAddress
            }
        })


    } catch (error) {
        next(error);
    }
}



export const deleteAddresses = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const { id } = req.params;

        const address = await Address.findOneAndDelete({ _id: id, userId });
        if (!address) {
            throw new NotFoundError('Địa chỉ không tồn tại');
        }

        res.status(200).json({
            success: true,
            message: 'Xóa địa chỉ thành công'
        });


    } catch (error) {
        next(error);
    }
}




