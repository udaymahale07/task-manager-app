import { useState } from "react";

export default function NewTaskForm({ onCreate, submitting }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title can't be empty");
      return;
    }
    setError("");
    await onCreate({ title: title.trim(), description: description.trim() });
    setTitle("");
    setDescription("");
    setExpanded(false);
  };

  return (
    <form className="new-task" onSubmit={handleSubmit}>
      <div className="new-task__row">
        <span className="new-task__prompt">＋</span>
        <input
          className="new-task__input"
          placeholder="Add a task and press enter…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setExpanded(true)}
        />
        <button className="new-task__submit" type="submit" disabled={submitting}>
          {submitting ? "Adding…" : "Add task"}
        </button>
      </div>
      {expanded && (
        <input
          className="new-task__description"
          placeholder="Optional description…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      )}
      {error && <div className="new-task__error">{error}</div>}
    </form>
  );
}
