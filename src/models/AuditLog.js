import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
    {
        action: { type: String, required: true, index: true }, // VD: PRODUCT_UPDATE
        entity: { type: String, required: true, index: true }, // VD: Product
        entityId: { type: String, required: true, index: true },

        actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

        changedFields: { type: [String], default: [] },

        before: { type: Object, default: {} },
        after: { type: Object, default: {} },

        ip: { type: String, default: "" },
        userAgent: { type: String, default: "" },
    },
    { timestamps: true }
);

export default mongoose.model("AuditLog", auditLogSchema);