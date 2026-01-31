const nodemailer = require("nodemailer");

const sendMail = async ({ to, subject, text, html }) => {
  const { MAIL_USER, MAIL_PASS, MAIL_ADMIN } = process.env;

  if (!MAIL_USER || !MAIL_PASS) {
    throw new Error("MAIL_USER or MAIL_PASS are not configured in the environment.");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: MAIL_USER,
      pass: MAIL_PASS
    }
  });

  await transporter.sendMail({
    from: `Chikitsa Finder <${MAIL_USER}>`,
    to,
    bcc: MAIL_ADMIN && MAIL_ADMIN !== to ? MAIL_ADMIN : undefined,
    subject,
    text,
    html
  });
};

module.exports = sendMail;
