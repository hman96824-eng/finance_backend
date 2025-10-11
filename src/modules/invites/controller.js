import inviteService from "./service.js";
import messages from "../../constants/messages.js";
import ApiError from "../../utils/ApiError.js";

export const getAllInvitedUsers = async (req, res) => {
  try {
    const { accepted } = req.query; // "true" or "false"

    const result = await inviteService.getAllInvitedUsers(accepted);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error in getAllInvitedUsers:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
export const sendInvitation = async (req, res) => {
  try {
    const { name, email, role_id } = req.body;

    const invite = await inviteService.createInvite(name, email, role_id);

    res.status(201).json({
      success: true,
      message: "Invitation sent successfully",
      data: invite,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
export const completeRegistration = async (req, res) => {
  const { token } = req.query;
  if (!token) throw ApiError.badRequest(messages.AUTH_INVALID_TOKEN);

  try {
    const result = await inviteService.registerUser(token, req.body);
    res.status(201).json({
      success: true,
      message: messages.SIGNUP_SUCCESS,
      ...result,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export default {
  getAllInvitedUsers,
  sendInvitation,
  completeRegistration,
};
