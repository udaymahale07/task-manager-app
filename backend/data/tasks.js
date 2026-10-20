// const tasks = [
//   {
//     id: 1,
//     title: "Setup project structure",
//     description: "Initialize Express backend and React frontend",
//     status: "done"
//   },
//   {
//     id: 2,
//     title: "Build REST API",
//     description: "Create endpoints for GET, POST, PUT, DELETE tasks",
//     status: "in-progress"
//   },
//   {
//     id: 3,
//     title: "Connect Frontend to API",
//     description: "Use Axios to perform CRUD operations",
//     status: "pending"
//   }
// ];

const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "in-progress", "done"],
      default: "pending"
    },
    completed: { type: Boolean, default: false },
    assignedUser: { type: String, default: "Unassigned" },
    createdAt: { type: Date, default: Date.now }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual getter for id
taskSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model("Task", taskSchema);