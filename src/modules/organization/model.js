import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
    name: { type: String, required: true },
    primary: { type: Boolean, default: false },
    type: {
        type: String,
        enum: ["mailing", "billing", "shipping", "factory", "office"],
        required: true,
    },
    street: String,
    street2: String,
    city: String,
    state: String,
    zip: String,
    notes: String,
});

const organizationSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true },
        code: { type: String },
        size: { type: String },
        emails: [{ type: String, required: true }],
        phone: String,
        website: String,
        description: String,
        tags: [String],
        avatar: { type: mongoose.Schema.Types.ObjectId, ref: "Media" },
        addresses: [addressSchema],
    },
    { timestamps: true, versionKey: false }
);

const Organization = mongoose.model("Organization", organizationSchema);
export default Organization;
