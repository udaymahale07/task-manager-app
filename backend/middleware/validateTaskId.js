// Route-specific middleware: validates :id is a positive integer before hitting the controller
const validateTaskId = (req, res, next) => {
  const { id } = req.params;
  if (!/^\d+$/.test(id)) {
    return res.status(400).json({
      success: false,
      error: "Invalid task ID format. ID must be a positive integer."
    });
  }
  next();
};

module.exports = validateTaskId;
