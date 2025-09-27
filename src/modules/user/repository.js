import { email } from "zod";
import User from "./model.js";
import Otp from "./temp/otp.model.js";
export const findByEmail = async (email) => {
  return await User.findOne({ email });
};
export const findByEmailotp = async (email) => {
  return await Otp.findOne({ email });
};
