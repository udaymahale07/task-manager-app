// Global error handler — must be registered LAST in the middleware chain.
// Never leaks raw stack traces to the client.
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: err.message || "Something went wrong"
  });
};

module.exports = errorHandler;
