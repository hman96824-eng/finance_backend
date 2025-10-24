import { ZodError } from 'zod';

export const validate = (schema) => {
  return async (req, res, next) => {
    try {
      // Parse with abortEarly: true to stop at first error
      req.body = await schema.parseAsync(req.body, { abortEarly: true });
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const firstError = err.issues[0]; // First error only
        return res.status(400).json({
          success: false,
          error: "Validation error",
          message: firstError.message,
        });
      }

      next(err);
    }
  };
};
