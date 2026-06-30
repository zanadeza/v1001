const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_API_KEY
  }
});

const sendEmail = async ({ from, to, subject, text, html }) => {
  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html
  });
  return info;
};

module.exports = { sendEmail };
