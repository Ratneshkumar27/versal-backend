const fs = require("fs");
const path = require("path");

const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  doctor: String,   // FIXED
  date: String,
  message: String
});

module.exports = mongoose.model("Appointment", appointmentSchema);
