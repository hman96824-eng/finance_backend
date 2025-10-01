export const messages = {
  // ========================
  // AUTHENTICATION & LOGIN
  // ========================
  LOGIN_MESSAGE: "Login successful",
  REGISTER_MESSAGE: "Registered successfully",
  SIGNUP_SUCCESS: "Signed up successfully.",
  SIGNIN_SUCCESS: "Signed in successfully.",
  LOGOUT_SUCCESS: "Logged out successfully.",

  USER_NOT_FOUND: "User not found",
  USER_EXISTS: "This email is already registered",
  USER_ALREADY_EXISTS: "User already exists.",
  INVALID_CREDENTIALS: "Incorrect email or password",
  AUTH_TOKEN_REQUIRED: "Authorization token required",
  AUTH_INVALID_TOKEN: "Invalid or expired token",
  AUTH_INVALID_EMAIL: "You can change only your password",
  LOGIN_REQUIRED: "Unauthorized: Please login first.",
  UNAUTHORIZED: "You are not authorized to perform this action.",
  TOKEN_MISSING: "Unauthorized: Token missing.",
  TOKEN_INVALID: "Forbidden: Invalid token.",
  TOKEN_EXPIRED: "Invalid or expired token.",
  REFRESH_TOKEN: "Refresh token required",
  ACCESS_TOKEN: "New access token generated",
  IsActive: "Your status is not Active",
  // ========================
  // PASSWORD & OTP
  // ========================
  EMAIL_SENT_SUBJECT: "Password reset OTP",
  OTP_SENT_MESSAGE: "OTP sent to your email",
  OTP_REQUEST_NOT_FOUND: "No OTP request found",
  OTP_EXPIRED: "OTP has expired",
  INCORRECT_OTP: "Incorrect OTP",
  VERIFIED_OTP: "OTP verified successfully",
  OTP_CHECK: "Invalid OTP code",

  NEW_PASSWORD: "Choose a different password",
  PASSWORD_RESET: "Your password has been reset. You can now login again.",
  PASSWORD_CHANGED: "Password changed successfully",
  PASSWORD_UNMATCH: "Passwords do not match",

  // ========================
  // VALIDATIONS
  // ========================
  EMAIL_CHECK: "Valid email is required",
  EMAIL_INVALID: "Invalid email address.",
  PASSWORD_CHECK: "Password must be at least 6 characters long",
  PASSWORD_INVALID: "Invalid password.",
  CONFIRM_PASSWORD: "Passwords do not match",
  CONFIRM_PASSWORD_REQUIRED: "Confirm password is required",
  NAME_CHECK: "Name should be at least 3 characters long",
  PHONE_CHECK: "Phone number must begin with country code",
  REQUIRED_FIELDS_MISSING: "Please fill in all required fields",
  INVALID_INPUT: "Invalid input provided",
  INVALID_USER_ID: "Invalid user ID",
  ROLE_CHECK: "Role must be either ADMIN or MANAGER",
  STATUS_CHECK: "Invalid status value",
  CONFIRM_EMAIL: "Verify your email",


  // ========================
  // USER ACTIONS
  // ========================
  USER_CREATED: "User created successfully",
  USER_UPDATED: "User updated successfully",
  USER_DELETED: "User deleted successfully",
  USER_STATUS_UPDATED: "User status updated successfully",
  USER_STATUS_UPDATE_FAILED: "Failed to update user status",

  // ========================
  // INVITE FLOW
  // ========================
  INVITE_SENT: "Invitation sent successfully",
  INVITE_FAILED: "Failed to send invitation",
  INVITE_ACCEPTED: "Invitation accepted successfully",
  INVITE_REJECTED: "Invitation rejected",

  // ========================
  // MESSAGES
  // ========================
  MESSAGE_SENT_SUCCESS: "Your message has been sent",
  MESSAGE_SEND_FAILED: "Failed to send the message",

  // ========================
  // SERVER & SYSTEM
  // ========================
  SERVER_ERROR: "Something went wrong. Please try again later",
};

export default messages;
