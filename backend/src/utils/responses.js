const successResponse = (res, statusCode, message, data = null) => {
  const response = {
    success: true,
    message,
    ...data // Spread data directly, don't nest it
  };
  
  return res.status(statusCode).json(response);
};

const errorResponse = (res, statusCode, error, details = null) => {
  const response = {
    success: false,
    error,
  };
  
  if (details) {
    response.details = details;
  }
  
  return res.status(statusCode).json(response);
};

module.exports = {
  successResponse,
  errorResponse
};
