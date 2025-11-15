import { optional, z } from "zod";
import { messages } from "../constants/messages.js";
import { RoleModel } from "../modules/role/model.js";
import Repository from "../utils/repository.js";
import organization from "../modules/organization/model.js";

const roleRepo = new Repository(RoleModel);
const orgRepo = new Repository(organization);

// ===============================
// 📦 COMMON SCHEMAS
// ===============================
const emailSchema = z.string().email({ message: messages.EMAIL_CHECK });
const passwordSchema = z.string().min(6, { message: messages.PASSWORD_CHECK });

const idParam = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, { message: messages.INVALID_USER_ID }),
});

// ===============================
// 👤 AUTH VALIDATIONS
// ===============================
export const registerValidation = z
  .object({
    name: z.string().trim().min(3, { message: messages.NAME_CHECK }),
    phone: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/, { message: messages.PHONE_CHECK })
      .optional(),
    role: z.string().trim().nonempty({ message: messages.ROLE_REQUIRED }),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string({ message: messages.CONFIRM_PASSWORD_REQUIRED }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: messages.CONFIRM_PASSWORD,
  });

export const loginValidation = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const requestOTP = z.object({ email: emailSchema });

export const verifyOTP = z.object({
  email: emailSchema,
  code: z.string().min(4, { message: messages.OTP_CHECK }),
});

export const resetPassword = z
  .object({
    email: emailSchema,
    newPassword: passwordSchema,
    confirmPassword: z.string({ message: messages.CONFIRM_PASSWORD_REQUIRED }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: messages.CONFIRM_PASSWORD,
  });

// ===============================
// 👥 USER VALIDATIONS
// ===============================

// ✅ Dynamic Role Validation — checks from DB
export const inviteUserValidation = z.object({
  name: z.string().trim().nonempty({ message: "Name is required" }),
  email: z.string().email({ message: "Valid email is required" }),
  role_id: z
    .string()
    .trim()
    .nonempty({ message: "Role name is required" })
    .refine(
      async (roleName) => {
        const role = await roleRepo.findOne({ name: roleName });
        return !!role;
      },
      { message: "Role not found" }
    ),
});

export const completeRegistrationValidation = z
  .object({
    phone: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/, { message: messages.PHONE_CHECK })
      .optional(),
    password: passwordSchema,
    confirmPassword: z.string({ message: messages.CONFIRM_PASSWORD_REQUIRED }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: messages.CONFIRM_PASSWORD,
  });

export const toggleUserStatusValidation = z.object({
  status: z.enum(["active", "inactive"], { message: messages.STATUS_CHECK }),
});

export const updateProfileValidation = z.object({
  name: z.string().min(3, { message: messages.NAME_CHECK }).optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, { message: messages.PHONE_CHECK })
    .optional(),
  address: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  nationality: z.string().optional(),
  maritalStatus: z.enum(["single", "married"]).optional(),
  department: z.string().optional(),
  salary: z.number().nonnegative().optional(),
  description: z.string().optional(),
  avatar: z.string().url({ message: "Invalid image URL" }).optional(),
});

export const passwordChange = z
  .object({
    currentPassword: passwordSchema,
    newPassword: passwordSchema,
    confirmNewPassword: z.string({
      required_error: messages.CONFIRM_PASSWORD_REQUIRED,
    }),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    path: ["confirmNewPassword"],
    message: messages.CONFIRM_PASSWORD,
  });

// ===============================
// 🧱 ROLE VALIDATIONS
// ===============================
export const addRoleValidation = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: messages.ROLE_NAME_REQUIRED })
    .max(50, { message: messages.ROLE_NAME_TOO_LONG }),

  description: z
    .string()
    .trim()
    .max(200, { message: messages.ROLE_DESCRIPTION_TOO_LONG })
    .optional(),

  permissions: z
    .array(z.string())
    .optional()
    .refine(
      (permissions) =>
        !permissions || permissions.every((p) => typeof p === "string"),
      { message: messages.PERMISSION_TYPE_ERROR }
    )
    .optional(),
});

// ===============================
// 🏢 ORGANIZATION VALIDATIONS
// ===============================
const addressSchema = z.object({
  name: z.string().trim().min(1, { message: messages.NAME_CHECK }),
  primary: z.boolean().optional(),
  type: z.string().trim().min(1, { message: messages.TYPE_CHECK }),

  street: z.string().optional(),
  street2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  notes: z.string().optional(),
});

export const organizationValidation = z
  .object({
    name: z.string().trim().min(3, { message: messages.NAME_CHECK }),
    code: z.string().optional(),
    size: z.string().optional(),
    emails: z
      .union([z.array(emailSchema), emailSchema])
      .transform((val) => (Array.isArray(val) ? val : [val]))
      .refine((arr) => arr.length > 0, { message: messages.EMAIL_CHECK }),
    phone: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/, { message: messages.PHONE_CHECK })
      .optional(),
    website: z.string().url({ message: messages.INVALID_INPUT }).optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    avatar: z
      .string()
      .regex(/^[a-f\d]{24}$/i, { message: messages.INVALID_USER_ID })
      .optional(),
    addresses: z.array(addressSchema).optional(),
  })
  .refine(
    async (data) => {
      // ensure organization name uniqueness when creating
      const exists = await orgRepo.findOne({ name: data.name });
      return !exists;
    },
    { message: messages.ORG_ALREADY_EXISTS }
  );

// Bank validation schema
export const bankSchema = z.object({
  bankName: z.string().trim().min(1, { message: "Bank name is required" }),
  accountTitle: z.string().trim().min(1, { message: "Account title is required" }),
  accountNumber: z.string().trim().min(1, { message: "Account number is required" }),
  branchCode: z.string().trim().optional(),
  ibanNumber: z.string().trim().optional(),
  accountType: z.enum(["Current", "Saving"], {
    message: "Account type must be either Current or Saving"
  }),
  currency: z.string().default("PKR"),
  openingDate: z.string().optional(),
  balance: z.number().nonnegative().optional(),
  status: z.enum(["Active", "Closed"], {
    message: "Status must be either Active or Closed"
  }).default("Active"),
});

// Business Expense validation schema
export const businessExpenseSchema = z.object({
  title: z.string().trim().min(1, { message: "Expense title is required" }),
  description: z.string().trim().optional(),
  amount: z.number().positive({ message: "Amount must be a positive number" }),
  paidBy: z.string().trim().min(1, { message: "Paid by field is required" }),
  bankName: z.string().regex(/^[a-f\d]{24}$/i, { message: "Invalid bank ID" }),
});

// Business Expense update validation (all fields optional)
export const businessExpenseUpdateSchema = z.object({
  title: z.string().trim().min(1, { message: "Expense title is required" }).optional(),
  description: z.string().trim().optional(),
  amount: z.number().positive({ message: "Amount must be a positive number" }).optional(),
  paidBy: z.string().trim().min(1, { message: "Paid by field is required" }).optional(),
  bankName: z.string().regex(/^[a-f\d]{24}$/i, { message: "Invalid bank ID" }).optional(),
});

// Delete many validation
export const deleteManySchema = z.object({
  ids: z.array(z.string().regex(/^[a-f\d]{24}$/i, { message: "Invalid ID format" })).min(1, { message: "At least one ID is required" }),
});

// Delete attachments validation
export const deleteAttachmentsSchema = z.object({
  ids: z.array(z.string().regex(/^[a-f\d]{24}$/i, { message: "Invalid attachment ID" })).min(1, { message: "At least one attachment ID is required" }),
}).or(z.object({
  attachmentIds: z.array(z.string().regex(/^[a-f\d]{24}$/i, { message: "Invalid attachment ID" })).min(1, { message: "At least one attachment ID is required" }),
}));

// Upload attachments validation (checks if files are present)
export const uploadAttachmentsSchema = z.object({
  // This will be checked in controller middleware
});

// Asset Expense validation schema
export const assetExpenseSchema = z.object({
  title: z.string().trim().min(1, { message: "Asset title is required" }),
  description: z.string().trim().optional(),
  amount: z.number().positive({ message: "Amount must be a positive number" }),
  purchaseBy: z.string().trim().min(1, { message: "Purchase by field is required" }),
  purchaseDate: z.string().min(1, { message: "Purchase date is required" }),
  bank: z.string().regex(/^[a-f\d]{24}$/i, { message: "Invalid bank ID" }),
});

// Asset Expense update validation (all fields optional)
export const assetExpenseUpdateSchema = z.object({
  title: z.string().trim().min(1, { message: "Asset title is required" }).optional(),
  description: z.string().trim().optional(),
  amount: z.number().positive({ message: "Amount must be a positive number" }).optional(),
  purchaseBy: z.string().trim().min(1, { message: "Purchase by field is required" }).optional(),
  purchaseDate: z.string().min(1, { message: "Purchase date is required" }).optional(),
  bank: z.string().regex(/^[a-f\d]{24}$/i, { message: "Invalid bank ID" }).optional(),
});

// Billing Expense validation schema
export const billingExpenseSchema = z.object({
  title: z.string().trim().min(1, { message: "Bill title is required" }),
  description: z.string().trim().optional(),
  amount: z.number().positive({ message: "Amount must be a positive number" }),
  paidBy: z.string().trim().min(1, { message: "Paid by field is required" }),
  billDate: z.string().min(1, { message: "Bill date is required" }),
  bankName: z.string().regex(/^[a-f\d]{24}$/i, { message: "Invalid bank ID" }),
});

// Billing Expense update validation (all fields optional)
export const billingExpenseUpdateSchema = z.object({
  title: z.string().trim().min(1, { message: "Bill title is required" }).optional(),
  description: z.string().trim().optional(),
  amount: z.number().positive({ message: "Amount must be a positive number" }).optional(),
  paidBy: z.string().trim().min(1, { message: "Paid by field is required" }).optional(),
  billDate: z.string().min(1, { message: "Bill date is required" }).optional(),
  bankName: z.string().regex(/^[a-f\d]{24}$/i, { message: "Invalid bank ID" }).optional(),
});

// Donation Expense validation
export const donationExpenseSchema = z.object({
  title: z.string().trim().min(1, { message: "Donation title is required" }),
  description: z.string().trim().optional(),
  amount: z.number().positive({ message: "Amount must be positive" }),
  donatedBy: z.string().trim().min(1, { message: "Donated by field is required" }),
  donationDate: z.string().min(1, { message: "Donation date is required" }),
  bankName: z.string().regex(/^[a-f\d]{24}$/i, { message: "Invalid bank ID" }),
});

// Donation Expense update
export const donationExpenseUpdateSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().optional(),
  amount: z.number().positive().optional(),
  donatedBy: z.string().trim().min(1).optional(),
  donationDate: z.string().min(1).optional(),
  bankName: z.string().regex(/^[a-f\d]{24}$/i).optional(),
});

// Validation middleware
const validateRequest = (schema) => async (req, res, next) => {
  try {
    // ✅ Validate body, params, or query
    if (req.body && Object.keys(req.body).length > 0) {
      await schema.parseAsync(req.body);
    } else if (req.params && Object.keys(req.params).length > 0) {
      await schema.parseAsync(req.params);
    } else if (req.query && Object.keys(req.query).length > 0) {
      await schema.parseAsync(req.query);
    }

    next();
  } catch (error) {
    if (error.errors && error.errors.length > 0) {
      // Return only the first error message for better UX
      return res.status(400).json({
        success: false,
        message: error.errors[0].message,
      });
    }

    next(error);
  }
};


// ===============================
// 📤 EXPORT ALL
// ===============================
export default {
  // Auth
  loginValidation,
  registerValidation,
  requestOTP,
  verifyOTP,
  resetPassword,

  // User
  idParam,
  inviteUserValidation,
  completeRegistrationValidation,
  toggleUserStatusValidation,
  updateProfileValidation,
  passwordChange,

  // Role
  addRoleValidation,
  // Organization validation
  organizationValidation,
  validateRequest,
  bankSchema,
  // Business Expense
  businessExpenseSchema,
  businessExpenseUpdateSchema,
  deleteManySchema,
  deleteAttachmentsSchema,
  uploadAttachmentsSchema,
  // Asset Expense
  assetExpenseSchema,
  assetExpenseUpdateSchema,
  // Billing Expense
  billingExpenseSchema,
  billingExpenseUpdateSchema,
  // Donation Expense
  donationExpenseSchema,
  donationExpenseUpdateSchema,
};
