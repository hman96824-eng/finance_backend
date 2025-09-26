export const Messages = {
    // General
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

export default Messages;
