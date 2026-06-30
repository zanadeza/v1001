const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// استقبال الرسائل من Cloudflare Email Worker
const receiveFromCloudflare = async (req, res) => {
  try {
    // تحقق من الـ secret
    const secret = (req.headers["x-webhook-secret"] || "").trim();
    const expected = (process.env.CLOUDFLARE_WEBHOOK_SECRET || "").trim();
    if (!expected || secret !== expected) {
      console.error("Webhook secret mismatch:", { received: secret, expectedLength: expected.length });
      return res.status(401).json({ error: "Invalid webhook secret" });
    }

    const { from, to, subject, rawEmail } = req.body;
    const toAddress = (to || "").toLowerCase().trim();
    const fromAddress = from || "unknown";

    // استخراج نص الرسالة من الـ raw email (بسيط)
    let bodyText = rawEmail || "";
    const bodyMatch = rawEmail.split(/\r?\n\r?\n/);
    if (bodyMatch.length > 1) {
      bodyText = bodyMatch.slice(1).join("\n\n").substring(0, 5000);
    }

    // هل البريد موجود؟ لو لأ أنشئه (catch-all حقيقي)
    let inbox = await prisma.inbox.findUnique({ where: { address: toAddress } });
    if (!inbox) {
      inbox = await prisma.inbox.create({ data: { address: toAddress } });
    }

    await prisma.message.create({
      data: {
        inboxId: inbox.id,
        direction: "INBOUND",
        fromAddress,
        toAddress,
        subject: subject || "(no subject)",
        body: bodyText,
        htmlBody: null
      }
    });

    res.status(200).json({ message: "OK" });
  } catch (err) {
    console.error("Cloudflare webhook error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { receiveFromCloudflare };
