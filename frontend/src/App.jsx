import { useEffect, useState, useCallback } from "react";
import Header from "./components/Header.jsx";
import ActivityLog from "./components/ActivityLog.jsx";
import NewTaskForm from "./components/NewTaskForm.jsx";
import Board from "./components/Board.jsx";
import * as api from "./api/taskApi.js";

const formatTime = () =>
  new Date().toLocaleTimeString("en-US", { hour12: false });

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [connected, setConnected] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [log, setLog] = useState([]);

  const pushLog = useCallback((method, url) => {
    setLog((prev) => [{ method, url, time: formatTime() }, ...prev].slice(0, 8));
  }, []);

  const loadTasks = useCallback(async () => {
    try {
      const res = await api.fetchTasks();
      setTasks(res.data.data);
      setConnected(true);
      pushLog("GET", "/api/tasks");
      setError("");
    } catch (err) {
      setConnected(false);
      setError(
        "Can't reach the API. Make sure the backend is running on http://localhost:5000."
      );
    } finally {
      setLoading(false);
    }
  }, [pushLog]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleCreate = async ({ title, description }) => {
    setSubmitting(true);
    try {
      const res = await api.createTask({ title, description });
      setTasks((prev) => [...prev, res.data.data]);
      pushLog("POST", "/api/tasks");
      setConnected(true);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create task");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (task, status) => {
    const previous = tasks;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status } : t)));
    try {
      await api.updateTask(task.id, { status });
      pushLog("PUT", `/api/tasks/${task.id}`);
    } catch (err) {
      setTasks(previous);
      setError(err.response?.data?.error || "Failed to update task");
    }
  };

  const handleDelete = async (id) => {
    const previous = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await api.deleteTask(id);
      pushLog("DELETE", `/api/tasks/${id}`);
    } catch (err) {
      setTasks(previous);
      setError(err.response?.data?.error || "Failed to delete task");
    }
  };

  return (
    <div className="app">
      <Header connected={connected} taskCount={tasks.length} />

      <ActivityLog entries={log} />

      {error && <div className="banner banner--error">{error}</div>}

      <NewTaskForm onCreate={handleCreate} submitting={submitting} />

      {loading ? (
        <div className="loading">Loading tasks…</div>
      ) : (
        <Board tasks={tasks} onStatusChange={handleStatusChange} onDelete={handleDelete} />
      )}
    </div>
  );
}
