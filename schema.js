const validator = require("validator");

/**
 * Payload d'exemple retourné par GET / et utilisé pour la documentation
 */
const examplePayload = {
  locale: "fr",
  selectedServices: ["Service A", "Service B"],
  name: "Nom Prénom",
  email: "nom@example.com",
  phone: "+213 555 555 555",
  company: "Entreprise SARL",
  Project_Scope: "Refonte du site web et intégration CRM",
  consent: true,
};

/**
 * Échappe le HTML pour éviter l'injection XSS / HTML dans l'email
 * @param {string|any} str
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Valide et assainit les données du formulaire de contact.
 * Pour modifier, ajouter ou supprimer un champ, ajustez cette fonction.
 *
 * @param {object} body - req.body reçu par l'API
 * @returns {{ valid: boolean, error?: string, data?: object }}
 */
function validate(body) {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Le corps de la requête est invalide." };
  }

  const {
    locale,
    selectedServices,
    name,
    email,
    phone,
    company,
    consent,
    Project_Scope,
  } = body;

  // 1. Validation des champs obligatoires
  if (!name || !email || !phone || consent !== true) {
    return {
      valid: false,
      error: "Champs manquants ou consentement non fourni.",
    };
  }

  // 2. Validation du format de l'email
  if (!validator.isEmail(email)) {
    return {
      valid: false,
      error: "Adresse email invalide.",
    };
  }

  // 3. Validation des services sélectionnés (doit être un tableau non vide)
  if (!Array.isArray(selectedServices) || selectedServices.length === 0) {
    return {
      valid: false,
      error: "Veuillez sélectionner au moins un service.",
    };
  }

  // 4. Validation du numéro de téléphone (chiffres, espaces, +, -, parenthèses entre 6 et 20 caractères)
  if (!/^[\d\s+()-]{6,20}$/.test(phone)) {
    return {
      valid: false,
      error: "Numéro de téléphone invalide.",
    };
  }

  // Récupération de Project_Scope (tolère Project_Scope, project_scope ou projectScope)
  const rawProjectScope =
    Project_Scope !== undefined
      ? Project_Scope
      : body.project_scope !== undefined
        ? body.project_scope
        : body.projectScope;

  // 5. Nettoyage et assainissement des données (échappement HTML)
  const sanitized = {
    locale: escapeHtml(locale || "non spécifiée"),
    selectedServices: selectedServices.map((s) => escapeHtml(s)),
    name: escapeHtml(name),
    email: escapeHtml(email),
    rawEmail: String(email).trim(), // Utilisé pour replyTo sans entités HTML
    phone: escapeHtml(phone),
    company: escapeHtml(company || "non renseignée"),
    Project_Scope: escapeHtml(rawProjectScope || "non renseigné"),
    consent: Boolean(consent),
  };

  return {
    valid: true,
    data: sanitized,
  };
}

/**
 * Construit le sujet et le contenu (texte brut + HTML) de l'email
 * à partir des données validées et assainies.
 *
 * @param {object} data - Données retournées par validate().data
 * @returns {{ subject: string, replyTo: string, text: string, html: string }}
 */
function buildEmail(data) {
  const {
    locale,
    selectedServices,
    name,
    email,
    rawEmail,
    phone,
    company,
    Project_Scope,
  } = data;

  const servicesText = selectedServices.join(", ");
  const servicesHtml = selectedServices.map((s) => `<li>${s}</li>`).join("");

  const subject = `Nouveau message de ${name}`;

  const text = `
Nouveau message reçu depuis le formulaire de contact :

Langue : ${locale}
Nom complet : ${name}
Email : ${email}
Téléphone : ${phone}
Entreprise : ${company}
Périmètre du projet : ${Project_Scope}
Services sélectionnés : ${servicesText}
Consentement : Oui
  `.trim();

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="color: #007BFF;">Nouveau message de ${name}</h2>
      <p><strong>Langue :</strong> ${locale}</p>
      <p><strong>Nom complet :</strong> ${name}</p>
      <p><strong>Email :</strong> <a href="mailto:${email}">${email}</a></p>
      <p><strong>Téléphone :</strong> ${phone}</p>
      <p><strong>Entreprise :</strong> ${company}</p>
      <p><strong>Périmètre du projet :</strong> ${Project_Scope}</p>
      <p><strong>Services sélectionnés :</strong></p>
      <ul>${servicesHtml}</ul>
      <p><strong>Consentement RGPD :</strong> Oui</p>
      <hr style="border: none; border-top: 1px solid #ccc;" />
      <p style="font-size: 0.9em; color: #888;">Cet email a été envoyé automatiquement depuis votre site web.</p>
    </div>
  `.trim();

  return {
    subject,
    replyTo: `"${name}" <${rawEmail}>`,
    text,
    html,
  };
}

module.exports = {
  examplePayload,
  escapeHtml,
  validate,
  buildEmail,
};
