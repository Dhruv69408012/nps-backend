const mongoose = require("mongoose");

const outgoingSchema = new mongoose.Schema({
  rollNo: String,
  reason: String,
  time: String,
  createdAt: Date,
  updatedAt: Date,
});

const Outgoing = mongoose.model("Outgoing", outgoingSchema);

module.exports = Outgoing;
