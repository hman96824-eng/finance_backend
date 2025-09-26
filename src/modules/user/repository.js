import User from "./model.js";
export const findByEmail = async (email) => {
  return await User.findOne({ email });
};
