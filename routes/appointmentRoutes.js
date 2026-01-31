// routes/appointmentRoutes.js
const fs = require("fs");
const path = require("path");

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Appointment = require("../models/Appointment");
const sendMail = require("../utils/sendMail");

console.log("✅ Appointment routes initialized");

const isDbConnected = () => mongoose.connection.readyState === 1;

/**
 * Ensure data directory exists. If not, create it.
 * csvPath will be used by saveAppointmentToCSV below.
 */
const dataDir = path.join(__dirname, "../data");
if (!fs.existsSync(dataDir)) {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log("✔ Created data directory:", dataDir);
  } catch (err) {
    console.error("❌ Could not create data directory:", err);
  }
}

// ---------------- CSV helper ----------------
const csvPath = path.join(__dirname, "../data/appointments.csv");

/**
 * Save appointment to CSV (simple, comma-separated).
 * If file doesn't exist, write a header line first.
 *
 * Note: This is synchronous and simple — acceptable for low-volume usage.
 * If you expect high-volume, we can switch to a streaming/async approach.
 */
function saveAppointmentToCSV(appointmentData) {
  try {
    const row = `${escapeCsv(appointmentData.name)},${escapeCsv(appointmentData.email)},${escapeCsv(appointmentData.phone)},${escapeCsv(appointmentData.doctor)},${escapeCsv(appointmentData.date)},${escapeCsv(appointmentData.message)}\n`;

    if (!fs.existsSync(csvPath)) {
      fs.writeFileSync(csvPath, "name,email,phone,doctor,date,message\n", { encoding: "utf8" });
    }

    fs.appendFileSync(csvPath, row, { encoding: "utf8" });
  } catch (err) {
    console.error("❌ Failed to write appointment to CSV:", err);
  }
}

/**
 * Minimal CSV escaping: wrap fields that contain comma/newline/quote in double-quotes,
 * escape internal double-quotes by doubling them. This prevents row shifting.
 */
function escapeCsv(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[,"\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
// ---------------- end CSV helper ----------------

const allowCors = (req, res, next) => {
  console.log("Appointment router CORS", req.method, req.headers.origin);
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Vary", "Origin");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
};

router.use(allowCors);

// GET ALL APPOINTMENTS
router.get("/", async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.json([]);
    }

    const appointments = await Appointment.find().sort({ date: -1 });
    res.json(appointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// BOOK APPOINTMENT
router.post("/", async (req, res) => {
  console.log("📥 Incoming POST /api/appointments request:", req.body);

  try {
    const { name, email, phone, doctor, date, message } = req.body;

    // Save to database when connected, otherwise log for manual follow-up
    let appointmentRecord = null;
    if (isDbConnected()) {
      const newAppointment = new Appointment({
        name,
        email,
        phone,
        doctor,
        date,
        message
      });

      appointmentRecord = await newAppointment.save();

      // ---------- SAVE TO CSV (always append locally) ----------
      try {
        saveAppointmentToCSV({ name, email, phone, doctor, date, message });
        console.log("✔ Appointment appended to CSV:", csvPath);
      } catch (csvErr) {
        console.warn("⚠️ Could not append appointment to CSV:", csvErr);
      }
      // --------------------------------------------------------

    } else {
      console.warn("⚠️  MongoDB is not connected. Appointment will not be persisted to DB. Still attempting to save to CSV.");

      // If DB not connected, still save to CSV (helps offline capture)
      try {
        saveAppointmentToCSV({ name, email, phone, doctor, date, message });
        console.log("✔ Appointment appended to CSV (DB offline):", csvPath);
      } catch (csvErr) {
        console.warn("⚠️ Could not append appointment to CSV (DB offline):", csvErr);
      }
    }

    // Send confirmation email
    try {
      await sendMail({
        to: email,
        subject: "Appointment Confirmation - Chikitsa Finder",
        html: `
          <h2>Hello ${name},</h2>
          <p>Your appointment has been successfully booked.</p>
          <p><strong>Doctor:</strong> ${doctor}</p>
          <p><strong>Date:</strong> ${new Date(date).toDateString()}</p>
          <p>We look forward to seeing you.</p>
          <p style="margin-top:16px;">Regards,<br/>Chikitsa Finder</p>
        `,
        text: `Hello ${name}, your appointment with ${doctor} on ${date} has been confirmed.`
      });
    } catch (mailError) {
      console.warn("⚠️  Email could not be sent:", mailError.message);
      return res.status(502).json({
        error: "Appointment saved but confirmation email failed to send. Please verify mail configuration."
      });
    }

    res.json({
      success: true,
      message: "Appointment booked! You'll receive an email confirmation shortly.",
      appointmentId: appointmentRecord?._id || null
    });

  } catch (error) {
    console.error("❌ BOOKING ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
