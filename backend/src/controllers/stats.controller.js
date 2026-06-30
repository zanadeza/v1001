const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getStats = async (req, res) => {
  try {
    const [
      totalInboxes,
      activeInboxes,
      totalMessages,
      totalReceived,
      totalSent,
      unreadCount,
      recentMessages
    ] = await Promise.all([
      prisma.inbox.count(),
      prisma.inbox.count({ where: { isActive: true } }),
      prisma.message.count(),
      prisma.message.count({ where: { direction: "INBOUND" } }),
      prisma.message.count({ where: { direction: "OUTBOUND" } }),
      prisma.message.count({ where: { isRead: false, direction: "INBOUND" } }),
      prisma.message.findMany({
        take: 10,
        orderBy: { receivedAt: "desc" },
        where: { direction: "INBOUND" },
        include: { inbox: { select: { address: true } } }
      })
    ]);

    // إحصائيات آخر 7 أيام
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyStats = await prisma.message.groupBy({
      by: ["receivedAt"],
      where: { receivedAt: { gte: sevenDaysAgo } },
      _count: { id: true }
    });

    res.json({
      totalInboxes,
      activeInboxes,
      totalMessages,
      totalReceived,
      totalSent,
      unreadCount,
      recentMessages,
      dailyStats
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { getStats };
