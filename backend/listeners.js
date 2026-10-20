const taskEvents = require('./events');

/**
 * 1. Listener for 'task-created' event
 * Demonstrates asynchronous background processing with an artificial delay.
 * Catches errors and forwards them to the 'error' event listener.
 */
taskEvents.on('task-created', (task) => {
  const assignedUser =
    task.assignedUser ||
    (task.user && (task.user.email || task.user)) ||
    'Unassigned';

  console.log(
    `[Notification Queue] Task "${task.title}" creation event received at ${new Date().toISOString()} - Starting background processing...`
  );

  // Artificial delay (2000ms) to clearly demonstrate non-blocking asynchronous execution
  setTimeout(() => {
    try {
      // Simulate error scenario if requested or if task data is malformed
      if (task.simulateError) {
        throw new Error(
          `Simulated failure in background notification worker for task "${task.title}" (ID: ${task._id || task.id})`
        );
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
      // Forward error to dedicated error event listener
      taskEvents.emit('error', err);
    }
  }, 2000);
});

/**
 * 2. Listener for 'task-deleted' event (Student Assignment / Post-Lab Work)
 * Handles background cleanup / logging after a task is deleted via the API.
 */
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

/**
 * 3. Error Event Listener (Student Assignment / Post-Lab Work)
 * Catches and logs errors thrown inside event handlers without crashing the server.
 */
taskEvents.on('error', (err) => {
  console.error(
    `[TaskEvents Error] Background event processing error caught at ${new Date().toISOString()}: ${err.message}`
  );
});

console.log('[TaskEvents] Event listeners registered successfully.');
