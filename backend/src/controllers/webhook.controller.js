const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const verifyMailgunSignature = (timestamp, token, signature) => {
  const value = timestamp + token;
  const hash = crypto
    .createHmac("sha256", process.env.MAILGUN_WEBHOOK_SECRET)
    .update(value)
    .digest("hex");
  return hash === signature;
};

const receiveEmail = async (req, res) => {
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { signature, "event-data": eventData } = body;

    // التحقق من صحة الـ webhook
    if (!verifyMailgunSignature(
      signature.timestamp,
      signature.token,
      signature.signature
    )) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    if (eventData["event"] !== "stored") {
      return res.status(200).json({ message: "Event ignored" });
    }

    const message = eventData.message;
    const toAddress = (eventData.recipient || "").toLowerCase();
    const fromAddress = message.headers["from"] || "";
    const subject = message.headers["subject"] || "(no subject)";
    const body_text = message["body-plain"] || "";
    const body_html = message["body-html"] || null;
    const messageId = message.headers["message-id"] || null;

    // هل البريد موجود في قاعدة البيانات؟
    const inbox = await prisma.inbox.findUnique({
      where: { address: toAddress }
    });

    if (!inbox) {
      // catch-all: أضف البريد تلقائياً لو ما كان موجود
      const newInbox = await prisma.inbox.create({
        data: { address: toAddress }
      });

      await prisma.message.create({
        data: {
          inboxId: newInbox.id,
          direction: "INBOUND",
          fromAddress,
          toAddress,
          subject,
          body: body_text,
          htmlBody: body_html,
          messageId
        }
      });
    } else {
      // تحقق من رسالة مكررة
      if (messageId) {
        const exists = await prisma.message.findUnique({ where: { messageId } });
        if (exists) return res.status(200).json({ message: "Duplicate" });
      }

      await prisma.message.create({
        data: {
          inboxId: inbox.id,
          direction: "INBOUND",
          fromAddress,
          toAddress,
          subject,
          body: body_text,
          htmlBody: body_html,
          messageId
        }
      });
    }

    res.status(200).json({ message: "OK" });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { receiveEmail };
