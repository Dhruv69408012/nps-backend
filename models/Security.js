const mongoose = require("mongoose");

const securitySchema = new mongoose.Schema({
  password: String,
  uname: String,
  createdAt: Date,
  updatedAt: Date,
});

const Security = mongoose.model("Security", securitySchema);

module.exports = Security;
