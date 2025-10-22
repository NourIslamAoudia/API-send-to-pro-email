const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendMail = async (mailOptions) => {
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email envoyé :", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Erreur d'envoi :", error);
    return { success: false, error: error.message };
  }
};

module.exports = sendMail;
