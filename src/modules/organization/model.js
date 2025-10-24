


import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    primary: { type: Boolean, default: false },
    type: { type: String, minlength: 1, trim: true },
    street: { type: String, required: true, trim: true },
    street2: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zip: { type: String, trim: true },
    country: { type: String, trim: true },
    notes: { type: String, trim: true },
});

const organizationSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true, trim: true },
        code: { type: String, trim: true },
        size: { type: String, trim: true },
        emails: [{ type: String, required: true, trim: true }],
        phone: { type: String, trim: true },
        website: { type: String, trim: true },
        description: { type: String, trim: true },
        tags: [{ type: String, trim: true }],
        avatar: { type: mongoose.Schema.Types.ObjectId, ref: "Media" },
        addresses: [addressSchema],
    },
    { timestamps: true, versionKey: false }
);

const Organization = mongoose.model("Organization", organizationSchema);
export default Organization;
