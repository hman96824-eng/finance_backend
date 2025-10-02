import messages from "../constants/messages.js";
import { UserModel } from "../modules/user/model.js";
import ApiError from "../utils/ApiError.js";

export const checkPermission = (requiredPermissions) => {
  return async (req, res, next) => {
    try {
      const user = await UserModel.findById(req?.user?.id).populate("role_id");

      if (!user) throw ApiError.unauthorized(messages.USER_NOT_FOUND);

      const userPermissions = user?.role_id?.permissions;

      // check if user has ALL required permissions
      const hasPermission = requiredPermissions.every((perm) =>
        userPermissions.includes(perm)
      );

      if (!hasPermission)
        throw ApiError.unauthorized(messages.PERMISSON_NOT_GRANTED);

      next();
    } catch (err) {
      next(err);
    }
  };
};
