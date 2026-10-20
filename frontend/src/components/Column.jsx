import TaskCard from "./TaskCard.jsx";

export default function Column({ status, label, tasks, onStatusChange, onDelete }) {
  return (
    <section className={`column column--${status}`}>
      <div className="column__header">
        <span className="column__dot" />
        <h2>{label}</h2>
        <span className="column__count">{tasks.length}</span>
      </div>
      <div className="column__body">
        {tasks.length === 0 && <div className="column__empty">No tasks here yet</div>}
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  );
}
