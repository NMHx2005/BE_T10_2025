// Cấu hình upload file với Multer

import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'node:url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// file filer: chỉ cho phép upload file ảnh
const fileFilter = (req, file, cb) => {
    // kiểm tra file type
    const allowedTypes = /jpeg|ipg|png|webp|gif/;

    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Chỉ cho phép upload file ảnh (jpeg,...)'))
    }

}


// Cấu hình multer để xử lý file upload
const storage = multer.memoryStorage(); // Lưu file vào memory



// cấu hình middleware để xử lý file
export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
})



export const uploadAvatar = upload.single('avatar');