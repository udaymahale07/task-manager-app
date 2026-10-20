import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api/tasks";

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" }
});

export const fetchTasks = () => client.get("/");
export const createTask = (task) => client.post("/", task);
export const updateTask = (id, task) => client.put(`/${id}`, task);
export const deleteTask = (id) => client.delete(`/${id}`);
