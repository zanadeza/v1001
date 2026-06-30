export default {
  async email(message, env, ctx) {
    try {
      // اقرأ محتوى الرسالة كاملاً
      const rawEmail = await new Response(message.raw).text();

      // استخرج البيانات الأساسية
      const from = message.from;
      const to = message.to;
      const subject = message.headers.get("subject") || "(no subject)";

      // ابعت البيانات لباكند المشروع على Render
      const response = await fetch(env.BACKEND_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Secret": env.WEBHOOK_SECRET
        },
        body: JSON.stringify({
          from,
          to,
          subject,
          rawEmail
        })
      });

      if (!response.ok) {
        console.error("Failed to forward email:", response.status);
        // كـ احتياط، خزن نسخة احتياطية (اختياري)
      }
    } catch (err) {
      console.error("Worker error:", err);
    }
  }
};
