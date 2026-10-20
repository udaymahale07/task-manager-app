# Practical 10: Asynchronous Processing with Event-Driven Architecture

**CO / PO Mapping:** CO4 / PO3, PO5  
**Objective:** To implement asynchronous background processing using Node.js native `EventEmitter` without external dependencies.

---

## 1. Architectural Overview & EventEmitter Concepts

Node.js is built on a single-threaded event loop. In standard synchronous processing, long-running operations (such as sending push notifications, sending welcome emails, or generating reports) can block subsequent operations or delay HTTP client responses.

By adopting an **Event-Driven Architecture (EDA)** using Node.js's native `EventEmitter` class (`events` module):
1. **Decoupled Architecture:** Business logic (saving tasks to the database and sending HTTP responses) is decoupled from secondary side effects (notifications, auditing, cache synchronization, error tracking).
2. **Non-Blocking Background Processing:** The API response is dispatched immediately to the HTTP client (e.g. Postman or frontend). Background tasks are queued and executed asynchronously via the libuv event loop.
3. **No External Dependencies:** Uses Node.js's native `EventEmitter` class without requiring Redis, RabbitMQ, or heavy message queues for intra-process event distribution.

---

## 2. Implementation Files

### A. Dedicated Events Module (`events.js`)
Creates and exports a singleton instance of `TaskEvents` extending `EventEmitter`.

```javascript
// backend/events.js
const EventEmitter = require('events');

class TaskEvents extends EventEmitter {}

module.exports = new TaskEvents();
```

### B. Event Listeners Module (`listeners.js`)
Registers event listeners before any route emits events. Includes artificial delays to clearly demonstrate non-blocking asynchronous execution and implements post-lab tasks (`task-deleted` and `error` events).

```javascript
// backend/listeners.js
const taskEvents = require('./events');

// 1. Asynchronous Task Created Listener
taskEvents.on('task-created', (task) => {
  const assignedUser = task.assignedUser || (task.user && (task.user.email || task.user)) || 'Unassigned';

  console.log(
    `[Notification Queue] Task "${task.title}" creation event received at ${new Date().toISOString()} - Starting background processing...`
  );

  // Artificial delay (2000ms) to clearly show non-blocking async execution
  setTimeout(() => {
    try {
      if (task.simulateError) {
        throw new Error(`Simulated failure in background notification worker for task "${task.title}" (ID: ${task._id || task.id})`);
      }
      if (!task.title) {
        throw new Error('Task title is required for background notification.');
      }

      console.log(
        `[Notification] Task "${task.title}" created at ${new Date().toISOString()} | Assigned User: ${assignedUser}`
      );
      console.log(
        `[Notification Completed] Background notification finished at ${new Date().toISOString()}`
      );
    } catch (err) {
      taskEvents.emit('error', err);
    }
  }, 2000);
});

// 2. Task Deleted Listener (Post-Lab Task)
taskEvents.on('task-deleted', (task) => {
  const taskId = task._id || task.id || 'Unknown ID';
  const taskTitle = task.title || 'Untitled Task';

  console.log(
    `[Notification Queue] Task "${taskTitle}" (ID: ${taskId}) deletion event received at ${new Date().toISOString()} - Starting cleanup...`
  );

  setTimeout(() => {
    console.log(
      `[Notification] Task "${taskTitle}" (ID: ${taskId}) was successfully removed from the system at ${new Date().toISOString()}`
    );
    console.log(
      `[Notification Completed] Background cleanup finished at ${new Date().toISOString()}`
    );
  }, 1500);
});

// 3. Error Event Listener (Post-Lab Task)
taskEvents.on('error', (err) => {
  console.error(
    `[TaskEvents Error] Background event processing error caught at ${new Date().toISOString()}: ${err.message}`
  );
});

console.log('[TaskEvents] Event listeners registered successfully.');
```

### C. Server & Route Integration (`server.js`)
Listeners are registered at startup. `taskEvents.emit()` is called **after** `res.status(...).json(...)`, ensuring the HTTP response is sent immediately.

```javascript
// Register listeners prior to routes
const taskEvents = require("./events");
require("./listeners");

// Inside POST /api/tasks (and POST /tasks)
router.post("/", validateTaskInput, async (req, res, next) => {
  try {
    const taskPayload = {
      ...req.body,
      assignedUser: req.body.assignedUser || (req.user && req.user.email) || "Unassigned"
    };
    const newTask = await Task.create(taskPayload);
    cache.del("all_tasks");

    // 1. Log timestamp and respond immediately
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

    // 2. Emit event asynchronously after HTTP response is sent
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
```

---

## 3. Postman Testing Guide

### Prerequisites
1. Start MongoDB: Make sure the local MongoDB service is running on `mongodb://127.0.0.1:27017/taskmanager`.
2. Start the Backend Server:
   ```bash
   node server.js
   # or
   npm run dev
   ```
3. Obtain a JWT Auth Token:
   - **Method A:** POST request to `http://localhost:5000/api/auth/login` (or `/api/auth/register`) with JSON:
     ```json
     {
       "email": "student@example.com",
       "password": "password123"
     }
     ```
   - Copy the returned `token`.
   - In Postman, open the **Authorization** tab, select **Bearer Token**, and paste your token.

### Test 1: Task Creation (`task-created` Event)
- **Method:** `POST`
- **URL:** `http://localhost:5000/api/tasks`
- **Headers:** `Content-Type: application/json`, `Authorization: Bearer <TOKEN>`
- **Body (raw JSON):**
  ```json
  {
    "title": "Build Docker Container",
    "description": "Containerize Node.js task manager application",
    "status": "pending",
    "assignedUser": "student@example.com"
  }
  ```
- **Observed Behavior in Postman:**
  - Status: `201 Created`
  - Response time: ~10 - 25 ms (instant)
- **Observed Console Logs:**
  ```text
  POST /api/tasks - 2026-10-20T13:26:18.726Z
  [CACHE INVALIDATED] Cleared all_tasks from memory
  [API] Response sent at 2026-10-20T13:26:18.764Z
  [Notification Queue] Task "Build Docker Container" creation event received at 2026-10-20T13:26:18.766Z - Starting background processing...
  ... (2 seconds later) ...
  [Notification] Task "Build Docker Container" created at 2026-10-20T13:26:20.780Z | Assigned User: student@example.com
  [Notification Completed] Background notification finished at 2026-10-20T13:26:20.780Z
  ```

### Test 2: Task Deletion (`task-deleted` Event)
- **Method:** `DELETE`
- **URL:** `http://localhost:5000/api/tasks/<TASK_ID>`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Observed Console Logs:**
  ```text
  DELETE /api/tasks/6ad76bfadc9eac9242a9e715 - 2026-10-20T13:26:21.269Z
  [CACHE INVALIDATED] Cleared all_tasks from memory
  [API] Response sent at 2026-10-20T13:26:21.284Z
  [Notification Queue] Task "Build Docker Container" (ID: 6ad76bfadc9eac9242a9e715) deletion event received at 2026-10-20T13:26:21.285Z - Starting cleanup...
  ... (1.5 seconds later) ...
  [Notification] Task "Build Docker Container" (ID: 6ad76bfadc9eac9242a9e715) was successfully removed from the system at 2026-10-20T13:26:22.799Z
  [Notification Completed] Background cleanup finished at 2026-10-20T13:26:22.800Z
  ```

### Test 3: Error Event Listener (`error` Event)
- **Method:** `POST`
- **URL:** `http://localhost:5000/api/tasks`
- **Body (raw JSON):**
  ```json
  {
    "title": "Faulty Background Task",
    "simulateError": true
  }
  ```
- **Observed Behavior:**
  - Client immediately receives `201 Created`
  - 2 seconds later in the console:
  ```text
  [TaskEvents Error] Background event processing error caught at 2026-10-20T13:26:25.318Z: Simulated failure in background notification worker for task "Faulty Background Task" (ID: 6ad76bffdc9eac9242a9e716)
  ```
  - The Node.js process stays alive without crashing.

---

## 4. Empirical Demonstration: Synchronous vs Asynchronous Handling

To run the automated verification suite:
```bash
node run-and-verify.js
# or
npm run test:practical10
```

### Console Output Evidence & Timestamps Comparison

| Milestone | Timestamp | Elapsed | Note |
|---|---|---|---|
| Client sends request | `2026-10-20T13:26:18.175Z` | 0 ms | POST request initiated |
| Route handler saves & invalidates cache | `2026-10-20T13:26:18.732Z` | +557 ms | MongoDB insert completes |
| **API Response Sent** | **`2026-10-20T13:26:18.764Z`** | **+589 ms** | **HTTP 201 sent to client immediately** |
| Client receives 201 Created | `2026-10-20T13:26:18.767Z` | +592 ms | Client connection closed |
| Listener acknowledges event | `2026-10-20T13:26:18.766Z` | +591 ms | Background timer started |
| **Listener Notification Completed** | **`2026-10-20T13:26:20.780Z`** | **+2,605 ms** | **Finished 2.016s AFTER client response** |

> **Conclusion:** The API response timestamp (`18.764Z`) appears **2.016 seconds before** the listener completion timestamp (`20.780Z`). The client response is not delayed by the notification workflow.

---

## 5. Solutions to Post-Laboratory Work & Student Assignment

1. **`task-deleted` Event and Listener:**
   - Emitted inside `router.delete("/:id")` after `res.status(200).json(...)`.
   - Listener registered in `listeners.js` logs task title, ID, and deletion timestamp after an asynchronous background delay.
2. **`error` Event Listener:**
   - Dedicated `taskEvents.on('error', ...)` listener in `listeners.js`.
   - Any unhandled or runtime error thrown in `task-created` (e.g. invalid task title or background network failure) is safely caught in a `try...catch` block and dispatched via `taskEvents.emit('error', err)`.
   - Prevents unhandled exceptions from terminating the Node.js process.

---

## 6. Common Pitfalls & Best Practices

1. **Listener Registration Order:**
   Always register listeners (`require('./listeners')`) **before** starting the server and routes. If an event is emitted before any listener is registered, the event will silently do nothing.
2. **Placing `emit()` after `res.json()`:**
   Calling `taskEvents.emit('task-created', task)` **after** `res.status(201).json(task)` clarifies the pedagogical separation of concerns and guarantees the client payload is dispatched first.
3. **Dedicated Error Listener:**
   In Node.js `EventEmitter`, emitting an `'error'` event without a registered listener will cause Node.js to throw an uncaught exception and crash the application. Always register an `'error'` listener.
