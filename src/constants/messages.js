export const messages = {
  // ========================
  // AUTHENTICATION & LOGIN
  // ========================
  LOGIN_MESSAGE: "Login successful",
  REGISTER_MESSAGE: "Registered successfully",
  SIGNUP_SUCCESS: "Signed up successfully.",
  SIGNIN_SUCCESS: "Signed in successfully.",
  LOGOUT_SUCCESS: "Logged out successfully.",
  INCORRECT_PASSWORD: "old password is incorrect",
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
  IsActive: "you can not login because you are not a active user ",
  PERMISSON_NOT_GRANTED: "Forbidden: insufficient permissions",
  FILE_NOT_UPLOADED: "file not uploaded",
  USER_ALREADY_DELETED: "user is already deleted",
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

  NEW_PASSWORD: "New password cannot be the same as the old password.",
  PASSWORD_RESET: "Your password has been reset. You can now login again.",
  PASSWORD_CHANGED: "Password changed successfully",
  PASSWORD_UNMATCH: "your current password is incorrect",
  INCORRECT_PASSWORD: "old password is incorrect",
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
  INVALID_ROLE: "only admin can login",
  ROLE_CHECK: "Role must be either ADMIN or MANAGER",
  STATUS_CHECK: "Invalid status value",
  CONFIRM_EMAIL: "Verify your email",
  ROLE_NOT_DEFINE: "This role is not defined",
  INVALID_OTP: "Invalid OTP. Please try again.",

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
  REFRESH_TOKEN: "Refresh token required",
  ACCESS_TOKEN: "New access token generated",
  // ========================
  // SERVER & SYSTEM
  // ========================
  SERVER_ERROR: "Something went wrong. Please try again later",
  // ========== ROLE MODULE ==========
  ROLE_CREATED: "Role created successfully.",
  ROLE_UPDATED: "Role updated successfully.",
  ROLE_DELETED: "Role deleted successfully.",
  ROLE_ALREADY_EXISTS: "A role with this name already exists.",
  ROLE_NOT_FOUND: "Role not found.",
  ROLE_LIST: "Roles fetched successfully.",
  ROLE_NAME_REQUIRED: "Role name is required.",
  ROLE_DESCRIPTION_REQUIRED: "Role description is required.",
  ROLE_DESCRIPTION_TOO_LONG:
    "Role description must be less than 200 characters.",
  ROLE_NAME_TOO_LONG: "Role name must be less than 50 characters.",
  PERMISSION_TYPE_ERROR: "Permissions must be an array of strings.",

  ROLE_REQUIRED: "Role is required.",
  // ROLE_NOT_FOUND: "Selected role does not exist.",
  ROLE_NAME_REQUIRED: "Role name is required.",
  ROLE_NAME_TOO_LONG: "Role name must not exceed 50 characters.",
  ROLE_DESCRIPTION_REQUIRED: "Role description is required.",
  ROLE_DESCRIPTION_TOO_LONG: "Description must not exceed 200 characters.",
  PERMISSION_TYPE_ERROR: "Each permission must be a string.",
  // ========================
  // Organization Details
  // ========================
  ORG_CREATED: "Organization created successfully",
  ORG_UPDATED: "Organization updated successfully",
  ORG_DELETED: "Organization deleted successfully",
  ORG_NOT_FOUND: "Organization not found",
  ORG_FETCHED: "Organization fetched successfully",
  ORG_LIST: "Organizations fetched successfully",

  TYPE_CHECK: "Address type is required",

  // Role messages...
  ROLE_CREATED: "Role created successfully",
  ROLE_UPDATED: "Role updated successfully",
  ROLE_NOT_FOUND: "Role not found",

  // ✅ Add these:
  ORG_CREATED: "Organization created successfully",
  ORG_UPDATED: "Organization updated successfully",
  ORG_NOT_FOUND: "Organization not found",
  ORG_DELETED: "Organization deleted successfully",

  // Common/server
  SERVER_ERROR: "An unexpected error occurred",
  NO_ID_PROVIDED: "No User ID provided",
  // organization
  ORGANIZATION_CREATED: "Organizaton created successfullys",
  ORGANIZATION_UPDATED: "Organizaton updated successfullys",
  MEDIA_UPLOAD_FAILED: "Media upload failed",
  MEDIA_DELETE_FAILED: "Media delete failed",
  MEDIA_NOT_FOUND: "Media not found",
  ORG_ALREADY_EXISTS: "Organization Already Exists",
  DUPLICATE_FIELD: "Duplicate value provided for field",
  ORG_CODE_EXISTS: "Organization code already exists",

  // permissions
  PERMISSION_INVALID: "Permissions array must contain non-empty strings only",
  PERMISSION_ADDED: "Permission added successfully",
  ROLE_STRING: "Role name is required and must be a string",


  // employee EMPLOYEE_CREATED: "Employee created successfully",
  EMPLOYEE_CREATED: "Employee created successfully",
  EMPLOYEE_UPDATED: "Employee updated successfully",
  EMPLOYEE_NOT_FOUND: "Employee not found",
  EMPLOYEE_DELETED: "Employee deleted successfully",
};

export default messages;
