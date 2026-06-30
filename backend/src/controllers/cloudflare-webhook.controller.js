const { PrismaClient } = require("@prisma/client");
const PostalMime = require("postal-mime").default;
const prisma = new PrismaClient();

// استقبال الرسائل من Cloudflare Email Worker
const receiveFromCloudflare = async (req, res) => {
  try {
    // تحقق من الـ secret
    const secret = (req.headers["x-webhook-secret"] || "").trim();
    const expected = (process.env.CLOUDFLARE_WEBHOOK_SECRET || "").trim();
    if (!expected || secret !== expected) {
      return res.status(401).json({ error: "Invalid webhook secret" });
    }

    const { to, rawEmail } = req.body;
    const toAddress = (to || "").toLowerCase().trim();

    // تحليل احترافي للرسالة الخام (MIME) عشان نطلع نص + HTML + الموضوع الصحيح بشكل مضمون
    let fromAddress = req.body.from || "unknown";
    let subject = req.body.subject || "(no subject)";
    let bodyText = "";
    let bodyHtml = null;

    try {
      const parsed = await PostalMime.parse(rawEmail);
      if (parsed.from?.address) fromAddress = parsed.from.address;
      if (parsed.subject) subject = parsed.subject;
      bodyText = parsed.text || "";
      bodyHtml = parsed.html || null;
    } catch (parseErr) {
      console.error("MIME parse failed, falling back to raw text:", parseErr.message);
      bodyText = (rawEmail || "").split(/\r?\n\r?\n/).slice(1).join("\n\n").substring(0, 5000);
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
        subject,
        body: bodyText.substring(0, 20000),
        htmlBody: bodyHtml ? bodyHtml.substring(0, 50000) : null
      }
    });

    res.status(200).json({ message: "OK" });
  } catch (err) {
    console.error("Cloudflare webhook error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { receiveFromCloudflare };
