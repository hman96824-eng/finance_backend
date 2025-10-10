class ApiError extends Error {
  constructor(statusCode, message, data = null) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
    Error.captureStackTrace(this, this.constructor);
  }

  // ✅ 200 OK
  static ok(message = "Success", data = null) {
    return new ApiError(200, message, data);
  }

  // ✅ 201 Created
  static created(message = "Resource created successfully", data = null) {
    return new ApiError(201, message, data);
  }

  // ✅ 202 Accepted
  static accepted(message = "Request accepted", data = null) {
    return new ApiError(202, message, data);
  }

  // ✅ 204 No Content
  static noContent(message = "No content") {
    return new ApiError(204, message);
  }

  // ✅ 400 Bad Request
  static badRequest(message = "Bad request", data = null) {
    return new ApiError(400, message, data);
  }

  // ✅ 401 Unauthorized
  static unauthorized(message = "Unauthorized", data = null) {
    return new ApiError(401, message, data);
  }

  // ✅ 403 Forbidden
  static forbidden(message = "Forbidden", data = null) {
    return new ApiError(403, message, data);
  }

  // ✅ 404 Not Found
  static notFound(message = "Resource not found", data = null) {
    return new ApiError(404, message, data);
  }

  // ✅ 409 Conflict
  static conflict(message = "Conflict", data = null) {
    return new ApiError(409, message, data);
  }

  // ✅ 422 Unprocessable Entity (validation error)
  static validationError(message = "Validation failed", data = null) {
    return new ApiError(422, message, data);
  }

  // ✅ 500 Internal Server Error
  static internal(message = "Internal server error", data = null) {
    return new ApiError(500, message, data);
  }
}

export default ApiError;
