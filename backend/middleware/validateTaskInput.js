// Rejects malformed requests before they hit the database
const validateTaskInput = (req, res, next) => {
    const { title } = req.body || {};

    if (!title || typeof title !== "string" || !title.trim()) {
        return res.status(400).json({
            success: false,
            error: "Task title is required and cannot be empty."
        });
    }

    next();
};

module.exports = validateTaskInput;
