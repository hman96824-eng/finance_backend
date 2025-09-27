export const messages = {
  USER_NOT_FOUND: "User not found",
  USER_EXISTS: "This email already registered",
  INVALID_CREDENTIALS: "Invalid email or password",
  EMAIL_SENT_SUBJECT: "Password reset OTP",
  OTP_SENT_MESSAGE: "OTP sent to your email",
  OTP_REQUEST_NOT_FOUND: "No OTP sent",
  OTP_EXPIRED: "OTP expired",
  INVALID_OTP: "Invalid OTP",
  VERIFIED_OTP: "OTP verified successfully",
  NEW_PASSWORD: "Choose a different password",
  PASSWORD_UNMATCH: " password do not match ",
  PASSWORD_RESET: "Your password is reset. You can now login again ",
  AUTH_TOKEN_REQUIRED: "Authorization token required",
  AUTH_INVALID_TOKEN: "Invalid or expired token",
  EMAIL_CHECK: "Valid email is required",
  PASSWORD_CHECK: "Password must be at least 6 characters long",
  CONFIRM_PASSWORD: "Passwords do not match",
  PASSWORD_CHANGED: "Password changed successfully",
  AUTH_INVALID_EMAIL: "You can change only your password",
  SERVER_ERROR: "Internal Server Error",
  LOGIN_MESSAGE: "login successful",
  REGISTER_MESSAGE: "Registered successfully",
  CONFIRM_EMAIL: "Verify you Email.",
  NAME_CHECK: "Name should be atleast 3 charactors long",
  PHONE_CHECK: "Phone number must begin with country code",
  REQUIRED_FIELDS_MISSING: "Please fill in all required fields.",
  INVALID_INPUT: "Invalid input provided.",
  SERVER_ERROR: "Something went wrong. Please try again later.",

  // Auth
  EMAIL_INVALID: "Invalid email address.",
  PASSWORD_INVALID: "Invalid password.",
  TOKEN_MISSING: "Unauthorized: Token missing.",
  TOKEN_INVALID: "Forbidden: Invalid token.",
  TOKEN_EXPIRED: "Invalid or expired token.",
  UNAUTHORIZED: "You are not authorized to perform this action.",
  LOGIN_REQUIRED: "Unauthorized: Please login first.",

  // User
  USER_NOT_FOUND: "User not found.",
  USER_ALREADY_EXISTS: "User already exists.",
  USER_CREATED: "User created successfully.",
  USER_UPDATED: "User updated successfully.",
  USER_DELETED: "User deleted successfully.",
  USER_STATUS_UPDATED: "User status updated successfully.",

  // Auth Flow
  SIGNUP_SUCCESS: "Signed up successfully.",
  SIGNIN_SUCCESS: "Signed in successfully.",
  LOGOUT_SUCCESS: "Logged out successfully.",

  // Invite Flow
  INVITE_SENT: "Invitation sent successfully.",
  INVITE_FAILED: "Failed to send invitation.",
  INVITE_ACCEPTED: "Invitation accepted successfully.",
  INVITE_REJECTED: "Invitation rejected.",

  // Messages
  MESSAGE_SENT_SUCCESS: "Your message has been sent.",
  MESSAGE_SEND_FAILED: "Failed to send the message.",

  // STATUS UPDATE
  USER_STATUS_UPDATE_FAILED: "Failed to update user status.",
};
export default messages;
