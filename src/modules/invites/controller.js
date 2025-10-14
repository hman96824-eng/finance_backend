import inviteService from "./service.js";
import messages from "../../constants/messages.js";
import ApiError from "../../utils/ApiError.js";
import { successResponse } from "../../utils/response.helper.js";

export const getAllInvitedUsers = async (req, res, next) => {
  try {
    const { accepted } = req.query; // "true" or "false"

    const result = await inviteService.getAllInvitedUsers(accepted);

    return successResponse(res, result, "users fetch successfully");
  } catch (error) {
    next(error);
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
export const updateInviteStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await inviteService.updateInviteStatus(id);
    res.status(200).json({
      success: true,
      message: "Status updated successfully",
      data: updated,
    });
  } catch (err) {
    console.error("Error updating invite status:", err);
    res.status(500).json({ message: err.message });
  }
};

export default {
  getAllInvitedUsers,
  sendInvitation,
  completeRegistration,
  updateInviteStatus,
};
