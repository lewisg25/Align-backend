const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashBoard");
const checkInRoutes = require("./routes/checkIns");

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

app.use(helmet());
app.use(morgan("dev"));
app.use(
  cors({
    origin: process.env.CLIENT_URL || [
      "http://localhost:3000",
      "http://localhost:5173",
    ],
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

async function startServer() {
  await connectDB();

  app.listen(port, () => {
    console.log(`Server is live on port ${port}`);
  });
}

startServer();
