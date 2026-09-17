const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const sendMail = require("./sendMail");
const {
  validate,
  buildEmail,
  buildAutoReplyEmail,
  examplePayload,
} = require("./schema");

const app = express();
const PORT = process.env.PORT || 3000;

// Autorise uniquement ton propre domaine frontend
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Autorise les requêtes sans origin (ex: Postman, curl) uniquement en dev
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Non autorisé par CORS"));
      }
    },
  }),
);

app.use(express.json());

// Limite : 5 requêtes / 15 min / IP sur la route d'envoi
const sendEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    error: "Trop de tentatives, réessayez plus tard.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.get("/", (req, res) => {
  res.json({
    message: "API Send Email - Serveur actif !",
    example: {
      endpoint: "/send-email",
      method: "POST",
      body: examplePayload,
    },
  });
});

app.post("/send-email", sendEmailLimiter, async (req, res) => {
  try {
    const { valid, error, data } = validate(req.body);

    if (!valid) {
      return res.status(400).json({
        success: false,
        error,
      });
    }

    // 1. Email principal envoyé à l'administrateur
    const { subject, replyTo, text, html } = buildEmail(data);

    const mailOptions = {
      from: `"Formulaire Site Web" <${process.env.EMAIL_USER}>`,
      replyTo: replyTo || process.env.EMAIL_USER,
      to: process.env.EMAIL_TO_ADDRESS,
      subject,
      text,
      html,
    };

    const result = await sendMail(mailOptions);

    if (!result.success) {
      // On ne renvoie jamais le détail technique de l'erreur au client
      console.error("Erreur d'envoi d'email:", result.error);
      return res.status(500).json({
        success: false,
        error: "Une erreur est survenue lors de l'envoi de l'email.",
      });
    }

    // 2. Email de confirmation automatique (Auto-Reply en anglais) envoyé au client
    try {
      const autoReply = buildAutoReplyEmail(data);
      const autoReplyOptions = {
        from: `"Shams Agency Support Team" <${process.env.EMAIL_USER}>`,
        replyTo: process.env.EMAIL_TO_ADDRESS || process.env.EMAIL_USER,
        to: data.rawEmail,
        subject: autoReply.subject,
        text: autoReply.text,
        html: autoReply.html,
      };

      const autoReplyResult = await sendMail(autoReplyOptions);
      if (!autoReplyResult.success) {
        console.warn(
          "Avertissement: L'auto-reply n'a pas pu être envoyé:",
          autoReplyResult.error,
        );
      }
    } catch (autoReplyErr) {
      console.error("Erreur lors de l'envoi de l'auto-reply:", autoReplyErr);
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({
      success: false,
      error: "Une erreur interne est survenue.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
