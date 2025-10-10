import { z } from "zod";
import { messages } from "../constants/messages.js";
import { RoleModel } from "../modules/role/model.js";
import Repository from "../utils/repository.js";

const roleRepo = new Repository(RoleModel)

// ===============================
// 📦 COMMON SCHEMAS
// ===============================
const emailSchema = z.string().email({ message: messages.EMAIL_CHECK });
const passwordSchema = z.string().min(6, { message: messages.PASSWORD_CHECK });

const idParam = z.object({
  id: z
    .string()
    .regex(/^[a-f\d]{24}$/i, { message: messages.INVALID_USER_ID }),
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
  role_id: z.string().trim().nonempty({ message: "Role name is required" }).refine(async (roleName) => {
    const role = await roleRepo.findOne({ name: roleName });
    return !!role;
  }, { message: "Role not found" }),
});


export const completeRegistrationValidation = z
  .object({
    name: z.string().trim().min(3, { message: messages.NAME_CHECK }),
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
    .min(5, { message: messages.ROLE_DESCRIPTION_REQUIRED })
    .max(200, { message: messages.ROLE_DESCRIPTION_TOO_LONG }),

  permissions: z
    .array(z.string())
    .optional()
    .refine(
      (permissions) =>
        !permissions || permissions.every((p) => typeof p === "string"),
      { message: messages.PERMISSION_TYPE_ERROR }
    ),
});

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
};
