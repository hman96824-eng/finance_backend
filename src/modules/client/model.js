import mongoose from "mongoose";

const ClientSchema = new mongoose.Schema(
    {
        clientName: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true },
        phone: { type: String, trim: true },
        companyName: { type: String, trim: true },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active"
        },
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project"
        },
        isDeleted: { type: Boolean, default: false }
    },
    { timestamps: true }
);

ClientSchema.set("toJSON", {
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

export default mongoose.models.Client || mongoose.model("Client", ClientSchema);
