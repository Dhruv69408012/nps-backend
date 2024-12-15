const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  password: String,
  uname: String,
  createdAt: Date,
  updatedAt: Date,
});

const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;
