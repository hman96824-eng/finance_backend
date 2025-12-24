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
        const fieldName = firstError.path.join('.') || 'field';
        
        // Create a more descriptive error message
        let errorMessage = firstError.message;
        
        // If the error message is generic, make it more specific
        if (errorMessage.includes('expected') && errorMessage.includes('received undefined')) {
          errorMessage = `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
        } else if (errorMessage.includes('Required')) {
          errorMessage = `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
        } else if (!errorMessage.includes(fieldName) && fieldName !== 'field') {
          errorMessage = `${fieldName}: ${errorMessage}`;
        }
        
        return res.status(400).json({
          success: false,
          error: "Validation error",
          message: errorMessage,
          field: fieldName,
        });
      }

      next(err);
    }
  };
};
