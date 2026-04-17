import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


/**
 * @param {Buffer} fileBuffer
 * @param {string} folder - ví dụ 'avatars' | 'products'
 * Sản phẩm: giữ tỉ lệ, chỉ giới hạn cạnh dài tối đa (không crop vuông như avatar).
 */
export const uploadImageToCloudinary = async (fileBuffer, folder = 'avatars') => {
    const isProduct =
        folder === 'products' || (typeof folder === 'string' && folder.startsWith('products'));
    const transformation = isProduct
        ? [
              { width: 1920, height: 1920, crop: 'limit' },
              { quality: 'auto' },
              { fetch_format: 'auto' },
          ]
        : [
              { width: 500, height: 500, crop: 'fill' },
              { quality: 'auto' },
              { fetch_format: 'auto' },
          ];

    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                resource_type: 'image',
                transformation,
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve({
                        url: result.secure_url,
                        public_id: result.public_id,
                    });
                }
            }
        );
        uploadStream.end(fileBuffer);
    });
};



export const deleteImageFromCloudinary = async (public_id) => {
    return cloudinary.uploader.destroy(public_id);
};
export default cloudinary;


