const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  password: String,
  uname: String,
  rollNo: String,
  branch: String,
  year: String,
  section: String,
  phone: String,
  mentor: String,
  hod: String,
  createdAt: Date,
  updatedAt: Date,
});

const Student = mongoose.model("Student", studentSchema);

module.exports = Student;
