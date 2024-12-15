const mongoose = require("mongoose");

const facultySchema = new mongoose.Schema({
  name: String,
  password: String,
  uname: String,
  role: String,
  branch: String,
  year: String,
  section: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Faculty = mongoose.model("Faculty", facultySchema);

module.exports = Faculty;
