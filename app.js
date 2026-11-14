// Load .env before any other module so every require sees the variables.
require("dotenv").config();

const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashBoard");
const checkInRoutes = require("./routes/checkIns");
const { startReminder } = require("./services/dailyReminder");

const app = express();
const port = process.env.PORT || 8080;

// FIX 1: Relax Helmet's Cross-Origin Resource Policy so your Netlify frontend can read responses
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(morgan("dev"));

// FIX 2: Create a secure list of permitted domains, removing undefined entries safely
const allowedOrigins = ["http://localhost:5173", process.env.CLIENT_URL].filter(
  Boolean
);

// FIX 3: Pass the dynamically generated origins list to CORS
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => res.json({ message: "Align backend is running." }));

app.get("/health", (req, res) =>
  res.json({
    status: "healthy",
    date: new Date().toISOString(),
  })
);

for (const prefix of ["", "/api"]) {
  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/dashboard`, dashboardRoutes);
  app.use(`${prefix}/check-ins`, checkInRoutes);
}

app.use((req, res) => {
  res.status(404).json({ message: "Not found." });
});

// Return JSON (not Express's default HTML page) for errors such as malformed
// JSON bodies, and never leak stack traces to clients.
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    message: status >= 500 ? "Something went wrong." : err.expose ? err.message : "Bad request.",
  });
});

async function startServer() {
  await connectDB();
  startReminder();

  app.listen(port, () => {
    console.log(`Server is live on port ${port}`);
  });
}

startServer();
