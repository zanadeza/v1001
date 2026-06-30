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

// Temporary bulk-generate endpoint (احذفه بعد الاستخدام لأسباب أمنية)
app.get("/api/setup-bulk-inboxes", async (req, res) => {
  try {
    if (req.query.key !== process.env.JWT_SECRET) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();

    const count = Math.min(Number(req.query.count) || 7000, 10000);
    const domain = req.query.domain || "nader111hhdhyygdh.win";
    const prefix = req.query.prefix || "inbox";

    const data = Array.from({ length: count }, (_, i) => ({
      address: `${prefix}${String(i + 1).padStart(5, "0")}@${domain}`
    }));

    // batch insert بدفعات من 1000 لتجنب overload
    let created = 0;
    for (let i = 0; i < data.length; i += 1000) {
      const batch = data.slice(i, i + 1000);
      const result = await prisma.inbox.createMany({ data: batch, skipDuplicates: true });
      created += result.count;
    }

    res.json({ message: "Bulk inboxes created", created, total: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/setup-seed", async (req, res) => {
  try {
    if (req.query.key !== process.env.JWT_SECRET) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { PrismaClient } = require("@prisma/client");
    const bcrypt = require("bcryptjs");
    const prisma = new PrismaClient();

    const hashed = await bcrypt.hash("Admin@1234", 12);
    const admin = await prisma.user.upsert({
      where: { email: "admin@yourdomain.com" },
      update: {},
      create: {
        email: "admin@yourdomain.com",
        password: hashed,
        name: "Super Admin",
        role: "SUPERADMIN"
      }
    });

    res.json({ message: "Admin created", email: admin.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
