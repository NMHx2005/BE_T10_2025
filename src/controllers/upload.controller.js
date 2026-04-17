import { uploadImageToCloudinary } from '../config/cloudinary.js';

/**
 * POST multipart field "image" — upload lên Cloudinary (folder products).
 */
export const uploadProductImageController = async (req, res, next) => {
    try {
        if (!req.file?.buffer) {
            return res.status(400).json({
                success: false,
                message: 'Không có file ảnh (field: image)',
            });
        }

        const result = await uploadImageToCloudinary(req.file.buffer, 'products');

        return res.status(200).json({
            success: true,
            message: 'Upload ảnh thành công',
            data: {
                url: result.url,
                public_id: result.public_id,
            },
        });
    } catch (error) {
        next(error);
    }
};
