const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 50, search = "" } = req.query;
    const skip = (page - 1) * limit;

    const where = search
      ? { address: { contains: search, mode: "insensitive" } }
      : {};

    const [inboxes, total] = await Promise.all([
      prisma.inbox.findMany({
        where,
        skip: Number(skip),
        take: Number(limit),
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { messages: true } },
          messages: {
            where: { isRead: false, direction: "INBOUND" },
            select: { id: true }
          }
        }
      }),
      prisma.inbox.count({ where })
    ]);

    const result = inboxes.map(inbox => ({
      id: inbox.id,
      address: inbox.address,
      label: inbox.label,
      isActive: inbox.isActive,
      createdAt: inbox.createdAt,
      totalMessages: inbox._count.messages,
      unreadCount: inbox.messages.length
    }));

    res.json({ inboxes: result, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

const getOne = async (req, res) => {
  try {
    const inbox = await prisma.inbox.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { messages: true } } }
    });
    if (!inbox) return res.status(404).json({ error: "Inbox not found" });
    res.json(inbox);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

const create = async (req, res) => {
  try {
    const { address, label } = req.body;
    if (!address) return res.status(400).json({ error: "Address required" });

    const exists = await prisma.inbox.findUnique({ where: { address } });
    if (exists) return res.status(409).json({ error: "Address already exists" });

    const inbox = await prisma.inbox.create({ data: { address, label } });
    res.status(201).json(inbox);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

const bulkCreate = async (req, res) => {
  try {
    const { addresses } = req.body;
    if (!Array.isArray(addresses) || addresses.length === 0)
      return res.status(400).json({ error: "addresses array required" });

    const data = addresses.map(a => ({ address: a.trim().toLowerCase() }));
    const result = await prisma.inbox.createMany({ data, skipDuplicates: true });
    res.status(201).json({ created: result.count });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

const update = async (req, res) => {
  try {
    const { label, isActive } = req.body;
    const inbox = await prisma.inbox.update({
      where: { id: req.params.id },
      data: { label, isActive }
    });
    res.json(inbox);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

const remove = async (req, res) => {
  try {
    await prisma.inbox.delete({ where: { id: req.params.id } });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { getAll, getOne, create, bulkCreate, update, remove };
