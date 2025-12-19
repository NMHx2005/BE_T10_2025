// Định nghĩa cấu trúc dữ liệu và các phương thức cho user
import mongoose from "mongoose";
import bcrypt from "bcryptjs";


// Định nghĩa schema cho user
const userSchema = new mongoose.Schema(
    {
        // Thông tin cơ bản
        // user name

        username: {
            type: String,
            required: [true, "Username là bắt buộc"],
            trim: true,
            minLength: [3, "Username phải có ít nhất 3 ký tự"],
            // Có thể bổ sung thêm các ràng buộc khác như unique, maxLength, match (regex)...
        },



        // email
        email: {
            type: String,
            required: [true, "Email là bắt buộc"],
            trim: true,
            unique: true,
            lowercase: true,
        },


        // password
        password: {
            type: String,
            required: [true, "Password là bắt buộc"],
            minLength: [6, "Password phải có ít nhất 6 ký tự"],
            select: false, // Mặc định không trả về password khi truy vấn
        },

        // password hashing trước khi lưu vào database
        passwordComfirm: {
            type: String,
            // Validate chỉ chạy khi tạo mới hoặc cập nhật
            validate: {
                validator: function (value) {
                    // trỏ đến document đang được tạo hay cập nhật
                    return !this.isNew || value === this.password;
                }
            }
        },


        // avatar
        avatar: {
            type: String,
            default: "https://i.pravatar.cc/150?u=",
        },

        // role
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },



        // status
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
        },

        // phone
        phone: {
            type: String,
            trim: true,
            validate: {
                validator: function (value) {
                    // Kiểm tra định dạng số điện thoại 
                    return /^(0|\+84)[0-9]{9,10}$/.test(value);
                },
                message: "Số điện thoại không hợp lệ"
            }
        },





    }, {
    timestamps: true, // Tự động tạo createdAt và updatedAt
    toObject: {
        virtuals: true,
    }
}
)

// Virtual Field

// indexes
userSchema.index({ email: 1 });


userSchema.index({
    email: "text",
})




// Pre-save middleware: chạy trước khi lưu document, dùng để hash password
userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        return next();
    }

    try {
        const hashedPassword = await bcrypt.hash(this.password, 12);
        this.password = hashedPassword;


        this.passwordComfirm = undefined; // Xoá trường passwordComfirm trước khi lưu

        next();
    } catch (error) {
        next(error);
    }
})



/** 
 * Middleware để hash password trước khi lưu vào database
 * 
 * 
 * 
 * @param {String} candidatatePassword - Mật khẩu người dùng nhập vào
 * @param {String} userPassword - Mật khẩu đã được hash lưu trong database
 * @returns {Boolean} - Trả về true nếu mật khẩu khớp, ngược lại trả về false
 * 
 * 
 */


userSchema.method.comparePassword = async function (candidatatePassword, userPassword) {
    return await bcrypt.compare(candidatatePassword, userPassword);
}


// tạo token khi rết mật khẩu

// Tăng số lần đăng nhạp sai



// reset số lần đăng nhập về 0





// TÌm kiếm theo email
/** 
 * 
 * tìm kiếm theo email
 * @param {String} email - email của user cần tìm
 * @returns {Document|null} - Trả về user nếu tìm thấy, ngược lại trả về null
 * 
 */
userSchema.statics.findByEmail = function (email) {
    return this.findOne({ email: email.toLowerCase().trim() })
        .select("+password"); // Bao gồm trường password trong kết quả
}

// Tìm kiếm theo username


// TÌm kiếm theo user active
userSchema.static.findActiveUsers = function () {
    return this.find({ status: "active" });
}


// tìm kiếm theo role





const User = mongoose.model("User", userSchema);
export default User;