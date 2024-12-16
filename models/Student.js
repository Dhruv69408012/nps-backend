const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  password: { type: String, required: true },
  uname: { type: String, required: true },
  rollNo: { type: String, required: true },
  branch: { type: String, required: true },
  year: { type: String, required: true },
  section: { type: String, required: true },
  phone: { type: String, required: true },
  mentor: { type: String, required: true },
  hod: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  notificationsEnabled: { type: Boolean, default: true },
  notificationToken: { type: String },
});

const Student = mongoose.model("Student", studentSchema);

module.exports = Student;
