const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getAll = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true, lastLoginAt: true }
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

const create = async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password || !name)
      return res.status(400).json({ error: "email, password, name required" });

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ error: "Email already exists" });

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password: hashed, name, role: role || "VIEWER" },
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true }
    });
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

const update = async (req, res) => {
  try {
    const { name, role, isActive, password } = req.body;
    const data = {};
    if (name) data.name = name;
    if (role) data.role = role;
    if (isActive !== undefined) data.isActive = isActive;
    if (password) data.password = await bcrypt.hash(password, 12);

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, email: true, name: true, role: true, isActive: true }
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

const remove = async (req, res) => {
  try {
    if (req.params.id === req.user.id)
      return res.status(400).json({ error: "Cannot delete yourself" });
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { getAll, create, update, remove };
