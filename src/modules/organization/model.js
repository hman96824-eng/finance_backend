import mongoose from "mongoose";
import { trim } from "zod";

const addressSchema = new mongoose.Schema({
    name: { type: String, required: true },
    primary: { type: Boolean, default: false },
    type: { type: String, minlength: 1, trim: true, required: true },
    street: { type: String, required: true },
    street2: { type: String },
    city: { type: String },
    state: { type: String },
    zip: { type: String },
    notes: { type: String },
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
