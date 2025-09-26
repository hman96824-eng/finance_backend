import { z } from "zod";
import { messages } from "../../constants/messages.js";
export const loginValidation = z.object({
  email: z.string().email({ message: messages.EMAIL_CHECK }),
  password: z.string().min(6, { message: messages.PASSWORD_CHECK }),
});
export const requestOTP = z.object({
  email: z.string().email({ message: messages.EMAIL_CHECK }),
});
export const verifyOTP = z.object({
  email: z.string().email({ message: messages.EMAIL_CHECK }),
  code: z.string().min(4),
});

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
