const { tasks } = require("../data/tasks");
const taskEvents = require("../events");

let nextId = tasks.length ? Math.max(...tasks.map((t) => t.id)) + 1 : 1;

const VALID_STATUSES = ["pending", "in-progress", "done"];

// GET /api/tasks
exports.getAllTasks = (req, res) => {
  res.status(200).json({ success: true, count: tasks.length, data: tasks });
};

// GET /api/tasks/:id
exports.getTaskById = (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  const task = tasks.find((t) => t.id === id);

  if (!task) {
    const err = new Error(`Task with id ${id} not found`);
    err.status = 404;
    return next(err);
  }

  res.status(200).json({ success: true, data: task });
};

// POST /api/tasks
exports.createTask = (req, res, next) => {
  const { title, description, status } = req.body || {};

  if (!title || typeof title !== "string" || !title.trim()) {
    const err = new Error("Title is required and must be a non-empty string");
    err.status = 400;
    return next(err);
  }

  if (status && !VALID_STATUSES.includes(status)) {
    const err = new Error(`Status must be one of: ${VALID_STATUSES.join(", ")}`);
    err.status = 400;
    return next(err);
  }

  const newTask = {
    id: nextId++,
    title: title.trim(),
    description: description ? String(description).trim() : "",
    status: status || "pending"
  };

  tasks.push(newTask);
  console.log(`[API] Response sent at ${new Date().toISOString()}`);
  res.status(201).json({ success: true, data: newTask });
  taskEvents.emit("task-created", newTask);
};

// PUT /api/tasks/:id
exports.updateTask = (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  const task = tasks.find((t) => t.id === id);

  if (!task) {
    const err = new Error(`Task with id ${id} not found`);
    err.status = 404;
    return next(err);
  }

  const { title, description, status } = req.body || {};

  if (status && !VALID_STATUSES.includes(status)) {
    const err = new Error(`Status must be one of: ${VALID_STATUSES.join(", ")}`);
    err.status = 400;
    return next(err);
  }

  if (title !== undefined) task.title = String(title).trim();
  if (description !== undefined) task.description = String(description).trim();
  if (status !== undefined) task.status = status;

  res.status(200).json({ success: true, data: task });
};

// DELETE /api/tasks/:id
exports.deleteTask = (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  const index = tasks.findIndex((t) => t.id === id);

  if (index === -1) {
    const err = new Error(`Task with id ${id} not found`);
    err.status = 404;
    return next(err);
  }

  const [deleted] = tasks.splice(index, 1);
  console.log(`[API] Response sent at ${new Date().toISOString()}`);
  res.status(200).json({ success: true, data: deleted });
  taskEvents.emit("task-deleted", deleted);
};
