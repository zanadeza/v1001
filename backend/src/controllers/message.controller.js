const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { sendEmail } = require("../services/mail.service");

const getByInbox = async (req, res) => {
  try {
    const { inboxId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const inbox = await prisma.inbox.findUnique({ where: { id: inboxId } });
    if (!inbox) return res.status(404).json({ error: "Inbox not found" });

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { inboxId },
        skip: Number(skip),
        take: Number(limit),
        orderBy: { receivedAt: "desc" }
      }),
      prisma.message.count({ where: { inboxId } })
    ]);

    res.json({ messages, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

const getOne = async (req, res) => {
  try {
    const message = await prisma.message.findUnique({
      where: { id: req.params.id },
      include: { inbox: true }
    });
    if (!message) return res.status(404).json({ error: "Message not found" });

    if (!message.isRead) {
      await prisma.message.update({ where: { id: message.id }, data: { isRead: true } });
    }

    res.json(message);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

const send = async (req, res) => {
  try {
    const { inboxId, to, subject, body } = req.body;
    if (!inboxId || !to || !subject || !body)
      return res.status(400).json({ error: "inboxId, to, subject, body required" });

    const inbox = await prisma.inbox.findUnique({ where: { id: inboxId } });
    if (!inbox || !inbox.isActive)
      return res.status(404).json({ error: "Inbox not found or inactive" });

    await sendEmail({ from: inbox.address, to, subject, text: body });

    const message = await prisma.message.create({
      data: {
        inboxId,
        direction: "OUTBOUND",
        fromAddress: inbox.address,
        toAddress: to,
        subject,
        body,
        isRead: true
      }
    });

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: "Failed to send message" });
  }
};

const markRead = async (req, res) => {
  try {
    await prisma.message.update({
      where: { id: req.params.id },
      data: { isRead: true }
    });
    res.json({ message: "Marked as read" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

const remove = async (req, res) => {
  try {
    await prisma.message.delete({ where: { id: req.params.id } });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { getByInbox, getOne, send, markRead, remove };
