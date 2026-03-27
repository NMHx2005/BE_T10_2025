import mongoose from "mongoose";

const searchAnalyticsSchema = new mongoose.Schema(
    {
        keyword: { type: String, required: true, index: true }, // Từ khóa user nhập
        normalizedKeyword: { type: String, required: true, index: true }, // Chuẩn hóa để gom nhóm
        resultCount: { type: Number, default: 0 }, // Số kết quả trả về
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        ip: { type: String, default: "" },
        userAgent: { type: String, default: "" },
    },
    { timestamps: true }
);

searchAnalyticsSchema.index({ normalizedKeyword: 1, createdAt: -1 });

export default mongoose.model("SearchAnalytics", searchAnalyticsSchema);