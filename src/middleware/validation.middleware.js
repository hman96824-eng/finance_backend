export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (err) {
    if (err.issues) {
      // Zod validation error
      return res.status(400).json({
        success: false,
        errors: err.issues.map((e) => ({
          field: e.path[0],
          message: e.message,
        })),
      });
    }
    // Unexpected error
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      error: err.message,
    });
  }
};
