const express = require("express");
const sendMail = require("./sendMail");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "📨 API Send Email - Serveur actif !",
    example: {
      endpoint: "/send-email",
      method: "POST",
      body: { from: "nom@example.com", message: "Bonjour 👋" },
    },
  });
});

app.post("/send-email", async (req, res) => {
  try {
    const { name, phone, email, adressePostal, NbrPieces } = req.body;

    // Validation des champs requis
    if (!name || !phone || !email || !adressePostal || !NbrPieces) {
      return res.status(400).json({
        success: false,
        error: "Champs manquants dans la requête.",
      });
    }

    const mailOptions = {
      from: `"${name}" <${email}>`,
      to: process.env.EMAIL_TO_ADDRESS,
      subject: ` Nouveau message de ${name}`,
      text: `
Nouveau message reçu depuis le formulaire de contact :

Nom complet : ${name}
Téléphone : ${phone}
Email : ${email}
Adresse postale : ${adressePostal}
Nombre de pièces : ${NbrPieces}
      `,
      html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="color: #007BFF;"> Nouveau message de ${name}</h2>
      <p><strong>Nom complet :</strong> ${name}</p>
      <p><strong>Téléphone :</strong> ${phone}</p>
      <p><strong>Email :</strong> <a href="mailto:${email}">${email}</a></p>
      <p><strong>Adresse postale :</strong> ${adressePostal}</p>
      <p><strong>Nombre de pièces :</strong> ${NbrPieces}</p>
      <hr style="border: none; border-top: 1px solid #ccc;" />
      <p style="font-size: 0.9em; color: #888;">Cet email a été envoyé automatiquement depuis votre site web.</p>
    </div>
      `,
    };

    const result = await sendMail(mailOptions);
    res.status(result.success ? 200 : 500).json(result);
  } catch (err) {
    console.error("Erreur:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
