import { errorResponse } from "../modules/utils/response.helper.js";
import messages from "../constants/messages.js";
const errorMiddleware = (err, _, res, next) => {
  const status = err.statusCode || 500;
  const message = err.message || messages.SERVER_ERROR;
  return errorResponse(res, status, message);
};

export default errorMiddleware;
