// server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const fs = require("fs");
const path = require("path");

dotenv.config();
connectDB();

const app = express();

// Ensure data directory exists (used to store CSVs)
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log("✔ Created data directory:", dataDir);
  } catch (err) {
    console.error("❌ Failed to create data directory:", err);
  }
}

const allowedOrigins = [
  "http://localhost:5500",
  "http://localhost:5173",
  "http://localhost:5502",
  "http://127.0.0.1:5500",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5502"
];

app.use(express.json());

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`❌ Blocked CORS origin: ${origin}`);
      callback(null, false);
    }
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Serve doctor images
app.use("/uploads", express.static("uploads"));

// Request logger for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Routes
const doctorRoutes = require("./routes/doctorRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");

const describeRouter = (router, name) => {
  if (!router || !router.stack) {
    console.warn(`⚠️  ${name} router has no stack`);
    return;
  }
  console.log(`📌 ${name} routes:`, router.stack
    .filter(layer => layer.route)
    .map(layer => {
      const methods = Object.keys(layer.route.methods).join(",").toUpperCase();
      return `${methods} ${layer.route.path}`;
    })
  );
};

describeRouter(doctorRoutes, "Doctor");
describeRouter(appointmentRoutes, "Appointment");

app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);

// JSON 404 fallback for APIs and assets
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl
  });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  const routes = [];
  const collectRoutes = (stack, prefix = "") => {
    stack.forEach(layer => {
      if (layer.route && layer.route.stack) {
        const methods = Object.keys(layer.route.methods).join(",").toUpperCase();
        routes.push(`${methods} ${prefix}${layer.route.path}`);
      } else if (layer.name === "router" && layer.handle && layer.handle.stack) {
        collectRoutes(layer.handle.stack, prefix + (layer.regexp?.fast_star ? "*" : layer.regexp?.toString() || ""));
      }
    });
  };

  if (app._router && app._router.stack) {
    collectRoutes(app._router.stack);
  }

  console.log("Registered routes:", routes);
});
