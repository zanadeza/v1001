require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const { rateLimiter } = require("./middleware/rateLimiter");

const authRoutes = require("./routes/auth.routes");
const inboxRoutes = require("./routes/inbox.routes");
const messageRoutes = require("./routes/message.routes");
const webhookRoutes = require("./routes/webhook.routes");
const statsRoutes = require("./routes/stats.routes");
const userRoutes = require("./routes/user.routes");

const app = express();

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "5mb" }));
app.use("/api/webhook", webhookRoutes);
app.use(morgan("combined"));
app.use(rateLimiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/inboxes", inboxRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/users", userRoutes);

// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

// 404
app.use((req, res) => res.status(404).json({ error: "Route not found" }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
