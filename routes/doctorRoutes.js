const express = require("express");
const router = express.Router();
const Doctor = require("../models/Doctor");

router.options("/", (req, res) => {
  const origin = req.headers.origin || "*";
  res.set("Access-Control-Allow-Origin", origin);
  res.set("Access-Control-Allow-Headers", "Content-Type");
  res.set("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.set("Vary", "Origin");
  return res.sendStatus(204);
});

// GET /api/doctors  -> return all doctors
router.get("/", async (req, res) => {
  try {
    const origin = req.headers.origin || "*";
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.set("Vary", "Origin");

    const doctors = await Doctor.find();
    res.json(doctors);
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
