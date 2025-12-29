import bcrypt from "bcryptjs";


const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;


export const hashPassword = async (password) => {
    if (!password) {
        throw new Error('Password không được để trống');
    }


    if (typeof password !== 'string') {
        throw new Error("Password phải là chuỗi");
    }

    try {
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        return hashedPassword;
    } catch (error) {
        throw new Error(`Lỗi khi hash password: ${error.message}`);
    }


}


//so sánh mật khẩu
export const comparePassword = async (candidatePassword, hashedPassword) => {
    if (!candidatePassword || !hashedPassword) {
        return false;
    }

    if (typeof candidatePassword !== 'string' || typeof hashedPassword !== 'string') {
        return false;
    }
    try {
        const isMatch = await bcrypt.compare(candidatePassword, hashedPassword);
        return isMatch;
    } catch (error) {
        return false;
    }


}


// Lấy thông tin từ hash string
export const getHashInfo = (hash) => {
    if (!hash || typeof hash !== 'string') {
        return null;
    }

    const parts = hash.split('$');

    if (parts.length !== 4) {
        return null;
    }

    return {
        algorithm: parts[1],
        rounds: parseInt(parts[2]),
        salt: parts[3].substring(0, 22),
        hash: parts[3].substring(22)
    }

}


// Kiểm tra format hash có đúng không
export const verifyHashFormat = (hash) => {
    if (!hash || typeof hash !== 'string') {
        return false;
    }

    const bcryptRegex = /^[$]2[abxy]?[$](?:0[4-9]|[12][0-9]|3[01])[$][./0-9a-zA-Z]{53}$/;
    return bcryptRegex.test(hash);
}

export default {
    hashPassword,
    comparePassword,
    getHashInfo,
    verifyHashFormat,
    SALT_ROUNDS
}
















