// Rejects POST/PUT requests that are missing a proper JSON Content-Type header
const validateContentType = (req, res, next) => {
  if (["POST", "PUT"].includes(req.method)) {
    const contentType = req.headers["content-type"];
    if (!contentType || !contentType.includes("application/json")) {
      return res.status(400).json({
        success: false,
        error: "Content-Type must be application/json"
      });
    }
  }
  next();
};

module.exports = validateContentType;
