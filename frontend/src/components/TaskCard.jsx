const STATUSES = ["pending", "in-progress", "done"];

export default function TaskCard({ task, onStatusChange, onDelete }) {
  const currentIndex = STATUSES.indexOf(task.status);

  return (
    <div className={`task-card task-card--${task.status}`}>
      <div className="task-card__top">
        <h3>{task.title}</h3>
        <button
          className="task-card__delete"
          onClick={() => onDelete(task.id)}
          aria-label={`Delete ${task.title}`}
          title="Delete task"
        >
          ×
        </button>
      </div>
      {task.description && <p className="task-card__desc">{task.description}</p>}
      <div className="task-card__footer">
        <span className="task-card__id">#{task.id}</span>
        <div className="task-card__actions">
          {currentIndex > 0 && (
            <button onClick={() => onStatusChange(task, STATUSES[currentIndex - 1])}>
              ← {STATUSES[currentIndex - 1]}
            </button>
          )}
          {currentIndex < STATUSES.length - 1 && (
            <button onClick={() => onStatusChange(task, STATUSES[currentIndex + 1])}>
              {STATUSES[currentIndex + 1]} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
