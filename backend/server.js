if (!global.crypto) {
  global.crypto = require("crypto");
}

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const Task = require("./data/tasks"); 
const authRoutes = require("./routes/authRoutes");
const auth = require("./middleware/auth");
const validateTaskInput = require("./middleware/validateTaskInput");
const cache = require("./utils/cache");
const taskEvents = require("./events");
require("./listeners");

const ALL_TASKS_CACHE_KEY = "all_tasks";
const TASK_CACHE_ENABLED = process.env.TASK_CACHE_ENABLED !== "false";
let allTasksCacheVersion = 0;

const invalidateAllTasksCache = () => {
  allTasksCacheVersion += 1;
  cache.del(ALL_TASKS_CACHE_KEY);
};

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// Database Connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/taskmanager";
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err.message));

// 1. Authentication Routes (Public - No Token Needed)
app.use("/api/auth", authRoutes);

// 2. Task Router (Protected by auth middleware)
const router = express.Router();

// Apply auth to ALL task routes
router.use(auth);

// CREATE task (with input validation)
router.post("/", validateTaskInput, async (req, res, next) => {
  try {
    const taskPayload = {
      ...req.body,
      assignedUser: req.body.assignedUser || (req.user && req.user.email) || "Unassigned"
    };
    const newTask = await Task.create(taskPayload);
    cache.del("all_tasks"); // Invalidate cache so stale data isn't served
    console.log("[CACHE INVALIDATED] Cleared all_tasks from memory");

    // Send immediate API response and log timestamp
    console.log(`[API] Response sent at ${new Date().toISOString()}`);
    res.status(201).json({
      success: true,
      data: newTask,
      _id: newTask._id,
      id: newTask.id,
      title: newTask.title,
      description: newTask.description,
      status: newTask.status,
      completed: newTask.completed,
      assignedUser: newTask.assignedUser,
      createdAt: newTask.createdAt
    });

    // Emit event asynchronously after response is sent
    const eventPayload = {
      ...(newTask.toObject ? newTask.toObject() : newTask),
      id: newTask.id,
      simulateError: Boolean(req.body.simulateError)
    };
    taskEvents.emit("task-created", eventPayload);
  } catch (err) {
    next(err);
  }
});

// READ all tasks
router.get("/", async (req, res, next) => {
  try {
    // 1. Check if data exists in cache
    const cachedTasks = cache.get("all_tasks");
    if (cachedTasks) {
      console.log("[CACHE HIT] Serving all_tasks from memory");
      return res.status(200).json({
        success: true,
        count: cachedTasks.length,
        data: cachedTasks,
        fromCache: true
      });
    }

    // 2. If not in cache, fetch from database
    console.log("[CACHE MISS] Fetching from database...");
    const tasks = await Task.find();

    // 3. Store in cache for future requests
    cache.set("all_tasks", tasks);
    console.log("[CACHE SET] Stored all_tasks in memory");

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (err) {
    next(err);
  }
});

// READ single task by ID
router.get("/:id", async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.status(200).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
});

// UPDATE task
router.put("/:id", validateTaskInput, async (req, res, next) => {
  try {
    const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: "after",
      runValidators: true
    });
    if (!updatedTask) {
      return res.status(404).json({ success: false, error: "Task not found" });
    }
    cache.del("all_tasks"); // Invalidate cache
    console.log("[CACHE INVALIDATED] Cleared all_tasks from memory");
    res.status(200).json({ success: true, data: updatedTask });
  } catch (err) {
    next(err);
  }
});

// DELETE task
router.delete("/:id", async (req, res, next) => {
  try {
    const deletedTask = await Task.findByIdAndDelete(req.params.id);
    if (!deletedTask) {
      return res.status(404).json({ success: false, error: "Task not found" });
    }
    cache.del("all_tasks"); // Invalidate cache
    console.log("[CACHE INVALIDATED] Cleared all_tasks from memory");

    // Send immediate API response and log timestamp
    console.log(`[API] Response sent at ${new Date().toISOString()}`);
    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
      data: deletedTask
    });

    // Emit task-deleted event asynchronously after sending API response
    taskEvents.emit("task-deleted", deletedTask);
  } catch (err) {
    next(err);
  }
});


// Mount task routes
app.use("/api/tasks", router);
app.use("/tasks", router);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong" });
});

// Start server
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
