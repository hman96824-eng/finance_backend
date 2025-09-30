class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }

  // ✅ 200 OK
  static ok(message) {
    return new ApiError(200, message);
  }

  // ✅ 201 Created
  static created(message) {
    return new ApiError(201, message);
  }

  // ✅ 400 Bad Request
  static badRequest(message) {
    return new ApiError(400, message);
  }

  // ✅ 401 Unauthorized
  static unauthorized(message) {
    return new ApiError(401, message);
  }

  // ✅ 404 Not Found
  static notFound(message) {
    return new ApiError(404, message);
  }

  // ✅ 500 Internal Server Error
  static internal(message) {
    return new ApiError(500, message);
  }
}

export default ApiError;
