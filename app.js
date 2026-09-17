const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const validator = require("validator");
const sendMail = require("./sendMail");

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
  max: 5,
  message: {
    success: false,
    error: "Trop de tentatives, réessayez plus tard.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.get("/", (req, res) => {
  res.json({
    message: "📨 API Send Email - Serveur actif !",
    example: {
      endpoint: "/send-email",
      method: "POST",
      body: {
        locale: "fr",
        selectedServices: ["Service A", "Service B"],
        name: "Nom Prénom",
        email: "nom@example.com",
        phone: "+213 555 555 555",
        company: "Entreprise SARL",
        consent: true,
      },
    },
  });
});

// Échappe le HTML pour éviter l'injection dans l'email
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

app.post("/send-email", sendEmailLimiter, async (req, res) => {
  try {
    const { locale, selectedServices, name, email, phone, company, consent } =
      req.body;

    // Validation des champs requis
    if (!name || !email || !phone || consent !== true) {
      return res.status(400).json({
        success: false,
        error: "Champs manquants ou consentement non fourni.",
      });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "Adresse email invalide.",
      });
    }

    if (!Array.isArray(selectedServices) || selectedServices.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Veuillez sélectionner au moins un service.",
      });
    }

    // Validation basique du téléphone (chiffres, espaces, +, - uniquement)
    if (!/^[\d\s+()-]{6,20}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        error: "Numéro de téléphone invalide.",
      });
    }

    // Échappement pour l'affichage HTML (protège contre l'injection HTML/XSS)
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safePhone = escapeHtml(phone);
    const safeCompany = escapeHtml(company || "non renseignée");
    const safeLocale = escapeHtml(locale || "non spécifiée");
    const safeServices = selectedServices.map((s) => escapeHtml(s));

    const servicesText = safeServices.join(", ");
    const servicesHtml = safeServices.map((s) => `<li>${s}</li>`).join("");

    const mailOptions = {
      from: `"Formulaire Site Web" <${process.env.EMAIL_USER}>`,
      replyTo: `"${safeName}" <${email}>`,
      to: process.env.EMAIL_TO_ADDRESS,
      subject: `Nouveau message de ${safeName}`,
      text: `
Nouveau message reçu depuis le formulaire de contact :

Langue : ${safeLocale}
Nom complet : ${safeName}
Email : ${safeEmail}
Téléphone : ${safePhone}
Entreprise : ${safeCompany}
Services sélectionnés : ${servicesText}
Consentement : Oui
      `,
      html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="color: #007BFF;">Nouveau message de ${safeName}</h2>
      <p><strong>Langue :</strong> ${safeLocale}</p>
      <p><strong>Nom complet :</strong> ${safeName}</p>
      <p><strong>Email :</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
      <p><strong>Téléphone :</strong> ${safePhone}</p>
      <p><strong>Entreprise :</strong> ${safeCompany}</p>
      <p><strong>Services sélectionnés :</strong></p>
      <ul>${servicesHtml}</ul>
      <p><strong>Consentement RGPD :</strong> Oui</p>
      <hr style="border: none; border-top: 1px solid #ccc;" />
      <p style="font-size: 0.9em; color: #888;">Cet email a été envoyé automatiquement depuis votre site web.</p>
    </div>
      `,
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
