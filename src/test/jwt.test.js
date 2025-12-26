import dotenv from 'dotenv';

import {
    generateAccessToken,
    generateRefreshToken,
    generateTokens,
    verifyAccessToken,
    verifyRefreshToken,
    decodeToken
} from "../config/jwt.js";

dotenv.config();


console.log(">>> Bắt đầu chạy JWT tests...");

const testUser = {
    _id: '507f1f77bcf86cd799439011',
    email: "test@gmail.com",
    role: "user"
};


try {
    // Test generateAccessToken
    console.log(">>> Test generateAccessToken: ");
    const accessToken = generateAccessToken(testUser);
    console.log("Access Token generated:", accessToken);

    // refresh token


    // generateTokens


    // Decode Token 
    console.log(">>> Test decodeToken: ");
    const decoded = decodeToken(accessToken);
    console.log("Giải má hóa Access Token:", decoded);


    // verify AccessToken


} catch (error) {
    console.error("Lỗi trong quá trình chạy JWT tests:", error);
    process.exit(1);
}