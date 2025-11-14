const successResponse = (res, statusCode, message, data = null) => {
  const response = {
    success: true,
    message,
  };
  
  if (data) {
    response.data = data;  // ✅ Nest it, don't spread
  }
  
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
