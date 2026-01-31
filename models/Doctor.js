const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  specialization: { type: String, required: true },
  experience: { type: Number, default: 1 },
  location: { type: String, default: "Your City" },
  contact: { type: String, default: "Not Provided" },
  description: { type: String, default: "No description available." },
  image: { type: String, default: "img/team-1.jpg" }
});

module.exports = mongoose.model("Doctor", doctorSchema);
