import Column from "./Column.jsx";

const COLUMNS = [
  { status: "pending", label: "Pending" },
  { status: "in-progress", label: "In Progress" },
  { status: "done", label: "Done" }
];

export default function Board({ tasks, onStatusChange, onDelete }) {
  return (
    <div className="board">
      {COLUMNS.map((col) => (
        <Column
          key={col.status}
          status={col.status}
          label={col.label}
          tasks={tasks.filter((t) => t.status === col.status)}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
