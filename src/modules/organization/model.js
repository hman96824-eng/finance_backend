import mongoose from 'mongoose';

const AddressSchema = new mongoose.Schema(
    {
        name: { type: String, trim: true, maxlength: 100 },
        primary: { type: Boolean, default: false },
        type: {
            type: String,
            enum: ["mailing", "billing", "shipping", "factory", "office"],
            default: 'mailing',
        },
        street: { type: String, trim: true, maxlength: 150 },
        street2: { type: String, trim: true, maxlength: 150 },
        city: { type: String, trim: true, maxlength: 100 },
        state: { type: String, trim: true, maxlength: 100 },
        zip: { type: String, trim: true, maxlength: 20 },
        country: { type: String, trim: true, maxlength: 100 },
        notes: { type: String, trim: true, maxlength: 500 },
    },
    { _id: false }
);

const OrganizationSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Organization name is required'],
            trim: true,
            maxlength: 100,
            index: true,
        },
        code: { type: String, trim: true, maxlength: 50, unique: true, sparse: true },
        size: { type: String, trim: true, maxlength: 50 },
        emails: {
            type: [String],
            validate: {
                validator: function (emails) {
                    return emails.every((email) =>
                        /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)
                    );
                },
                message: 'One or more email addresses are invalid',
            },
            default: [],
        },
        phone: { type: String, trim: true, maxlength: 20 },
        website: { type: String, trim: true },
        description: { type: String, trim: true, maxlength: 1000 },
        tags: {
            type: [String],
            default: [],
            validate: {
                validator: function (tags) {
                    return tags.length <= 50;
                },
                message: 'Too many tags (max 50)',
            },
        },
        avatar: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Media',
            default: null,
        },
        addresses: { type: [AddressSchema], default: [] },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

OrganizationSchema.index({ name: 1, code: 1 }, { unique: true, sparse: true });

const Organization = mongoose.model('Organization', OrganizationSchema);
export default Organization;