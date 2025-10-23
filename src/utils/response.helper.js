export const successResponse = (res, message, data = null) => {
    return res.status(200).json({
        success: true,
        message,
        data,
    });
};

export const errorResponse = (res, error) => {
    // Check if error is instance of ApiError
    if (error.statusCode) {
        return res.status(error.statusCode).json({
            success: false,
            message: error.message,
            data: error.data,
        });
    }

    // Default error response
    return res.status(500).json({
        success: false,
        message: error.message || 'Internal Server Error',
        data: null,
    });
};

