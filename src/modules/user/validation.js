import { z } from "zod";
import { messages } from "../../constants/messages.js";
// login validation
export const loginValidation = z.object({
  email: z.string().email({ message: messages.EMAIL_CHECK }),
  password: z.string().min(6, { message: messages.PASSWORD_CHECK }),
});

// signup validation
export const registerValidation = z
  .object({
    name: z.string().trim().min(3, { message: messages.NAME_CHECK }),
    phone: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/, { message: messages.PHONE_CHECK }),
    role_id: z.string().refine((val) => ["ADMIN", "MANAGER"].includes(val), {
      message: "Role must be either ADMIN or MANAGER",
    }),
    email: z.string().email({ message: messages.EMAIL_CHECK }),
    password: z.string().min(6, { message: messages.PASSWORD_CHECK }),
    confirmPassword: z.string({ message: "Confirm password is required" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: messages.CONFIRM_PASSWORD,
  });

// request otp validation
export const requestOTP = z.object({
  email: z.string().email({ message: messages.EMAIL_CHECK }),
});

// verify otp validation
export const verifyOTP = z.object({
  email: z.string().email({ message: messages.EMAIL_CHECK }),
  code: z.string().min(4, { message: "Invalid OTP code" }),
});

// reset password validation
export const resetpassword = z
  .object({
    email: z.string().email({ message: messages.EMAIL_CHECK }),
    newPassword: z.string().min(6, { message: messages.PASSWORD_CHECK }),
    confirmPassword: z.string({ message: "Confirm password is required" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: messages.CONFIRM_PASSWORD,
  });
