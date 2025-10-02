// validations.js
import { z } from "zod";
import { messages } from "../constants/messages.js";
import { Schema } from "zod/v3";

// Common schemas
const emailSchema = z.string().email({ message: messages.EMAIL_CHECK });
const passwordSchema = z.string().min(6, { message: messages.PASSWORD_CHECK });
const idParam = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, { message: messages.INVALID_USER_ID }),
});

// ========================
// AUTH SCHEMAS
// ========================


export const registerValidation = z.object({
  name: z.string().trim().min(3, { message: messages.NAME_CHECK }),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, { message: messages.PHONE_CHECK }),
  roleName: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"], { message: messages.ROLE_CHECK }),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string({ message: messages.CONFIRM_PASSWORD_REQUIRED })
}).refine((data) => data.password === data.confirmPassword, {
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

// ========================
// USER SCHEMAS
// ========================
export const inviteUserValidation = z.object({
  email: emailSchema,
  role_id: z.enum(["ADMIN", "MANAGER"], {
    message: messages.ROLE_CHECK,
  }),
});
export const completeRegistrationValidation = z
  .object({
    name: z.string().trim().min(3, { message: messages.NAME_CHECK }),
    password: passwordSchema,
    confirmPassword: z.string({ message: messages.CONFIRM_PASSWORD_REQUIRED }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: messages.CONFIRM_PASSWORD,
  });

export const toggleUserStatusValidation = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"], { message: messages.STATUS_CHECK }),
});
export const updateProfileValidation = z.object({
  name: z.string().min(3, { message: messages.NAME_CHECK }).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, { message: messages.PHONE_CHECK }).optional(),
  address: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  nationality: z.string().optional(),
  maritalStatus: z.enum(["single", "married"]).optional(),
  department: z.string().optional(),
  salary: z.number().nonnegative().optional(),
  description: z.string().optional(),
  avatar: z.string().url({ message: "Invalid image URL" }).optional(),
});


// ========================
// EXPORT
// ========================
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
};
