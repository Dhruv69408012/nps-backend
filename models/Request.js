const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
  rollNo: String,
  reason: String,
  to: String,
  status: String,
  time: String,
  phone: String,
  createdAt: Date,
  updatedAt: Date,
});

const Request = mongoose.model("Request", requestSchema);

module.exports = Request;
