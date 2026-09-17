const dns = require("dns");
const { promisify } = require("util");
const nodemailer = require("nodemailer");
require("dotenv").config();

const lookup = promisify(dns.lookup);

let cachedIP = null;

async function getTransporter() {
  if (!cachedIP) {
    const result = await lookup(process.env.SMTP_HOST, { family: 4 });
    cachedIP = result.address;
    console.log(`${process.env.SMTP_HOST} résolu en ${cachedIP}`);
  }

  return nodemailer.createTransport({
    host: cachedIP,
    port: process.env.SMTP_PORT,
    secure: true,
    tls: {
      servername: process.env.SMTP_HOST,
    },
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 10000, // 10s max pour se connecter
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

const sendMail = async (mailOptions) => {
  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email envoyé :", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Erreur d'envoi :", error);
    cachedIP = null; // reset le cache si erreur (au cas où l'IP a changé)
    return { success: false, error: error.message };
  }
};

module.exports = sendMail;