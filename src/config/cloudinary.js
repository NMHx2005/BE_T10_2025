import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


export const uploadImageToCloudinary = async (fileBuffer, folder = 'avatars') => {
    return new Promise((resolve, rejects) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                resource_type: 'image',
                transformation: [
                    { width: 500, height: 500, crop: 'fill' },
                    { quality: 'auto' },
                    { fetch_format: 'auto' }
                ]
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    console.log(result);
                    resolve({
                        url: result.secure_url,
                        public_id: result.public_id
                    })
                }
            }
        )
        uploadStream.end(fileBuffer);
    })
}



export const deleteImageFromCloudinary = async (public_id) => {
    return cloudinary.uploader.destroy(publicId);
}
export default cloudinary;


