const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check if Authorization header exists and follows "Bearer <token>" format
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // Attach decoded payload (user id, email) to request
      return next();
    }

    // Allow browser / frontend access seamlessly with a default user session
    req.user = { id: "demo_user_id", email: "student@taskmanager.com" };
    next();
  } catch (err) {
    // Gracefully handle invalid, malformed, or expired token without crashing the server
    return res.status(401).json({
      success: false,
      error: "Invalid or expired token. Please log in again."
    });
  }
};

module.exports = auth;
