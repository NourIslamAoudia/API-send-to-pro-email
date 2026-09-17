# 📨 API Send to Pro Email

API REST moderne, sécurisée et modulaire pour l'envoi d'emails via formulaire de contact, développée avec **Node.js**, **Express** et **Nodemailer**.

---

## 📋 Sommaire

- [✨ Fonctionnalités & Sécurité](#-fonctionnalités--sécurité)
- [📁 Architecture du Projet](#-architecture-du-projet)
- [🚀 Démarrage Rapide](#-démarrage-rapide)
- [⚙️ Configuration (.env)](#️-configuration-env)
- [📡 Documentation de l'API](#-documentation-de-lapi)
  - [1. Statut & Exemple (GET /)](#1-statut--exemple-get-)
  - [2. Envoi d'email (POST /send-email)](#2-envoi-demail-post-send-email)
- [🛠️ Personnaliser le Schéma (`schema.js`)](#️-personnaliser-le-schéma-schemajs)
- [💻 Exemples d'Intégration Frontend](#-exemples-dintégration-frontend)
  - [JavaScript (Fetch)](#javascript-fetch)
  - [React (Axios)](#react-axios)
  - [Vue.js](#vuejs)
  - [cURL](#curl)
- [🔒 Configuration du mot de passe d'application Gmail](#-configuration-du-mot-de-passe-dapplication-gmail)

---

## ✨ Fonctionnalités & Sécurité

- **Schéma Modulaire Découplé (`schema.js`)** : Toutes les règles de validation, assainissement et gabarit d'email sont isolées dans `schema.js`. Modifier vos champs ne nécessite aucune modification dans `app.js`.
- **Protection CORS configurable** : Whitelist d'origines autorisées via la variable `ALLOWED_ORIGINS`.
- **Limiteur de débit (Rate Limiting)** : Protection anti-spam et anti-abus limitée à 5 requêtes toutes les 15 minutes par adresse IP (`express-rate-limit`).
- **Protection contre les injections XSS / HTML** : Échappement systématique des entrées utilisateur (`escapeHtml`) avant intégration dans le courriel.
- **Validation stricte des données** :
  - Validation robuste de l'email avec la bibliothèque `validator`.
  - Contrôle du format du numéro de téléphone par expression régulière.
  - Vérification obligatoire du consentement RGPD (`consent: true`).
- **Transport SMTP optimisé (`sendMail.js`)** :
  - Résolution DNS IPv4 mise en cache pour éviter les ralentissements réseau.
  - Délais d'expiration stricts (`connectionTimeout`, `greetingTimeout`, `socketTimeout`).
  - Support TLS/SSL sécurisé avec configuration SNI.
- **Masquage des erreurs sensibles** : Les détails techniques internes ne sont jamais divulgués au client HTTP.

---

## 📁 Architecture du Projet

```text
.
├── app.js             # Serveur Express, middlewares (CORS, Rate Limit) et routes
├── schema.js          # Schéma des données, validation, assainissement et template d'email
├── sendMail.js        # Configuration Nodemailer, résolution DNS et envoi SMTP
├── package.json       # Dépendances et scripts du projet
├── .env.example       # Modèle des variables d'environnement
└── README.md          # Documentation complète du projet
```

---

## 🚀 Démarrage Rapide

### 1. Installation des dépendances

```bash
npm install
```

### 2. Configuration des variables d'environnement

Copiez le fichier d'exemple `.env.example` vers `.env` :

```bash
cp .env.example .env
```

Puis complétez vos identifiants SMTP (voir la section [Configuration](#️-configuration-env)).

### 3. Lancement du serveur

```bash
npm start
```

Le serveur démarrera par défaut sur `http://localhost:3000`.

---

## ⚙️ Configuration (.env)

| Variable           | Description                                             | Exemple                                     |
| :----------------- | :------------------------------------------------------ | :------------------------------------------ |
| `PORT`             | Port d'écoute du serveur Node.js                        | `3000`                                      |
| `ALLOWED_ORIGINS`  | Origines autorisées par CORS (séparées par une virgule) | `https://monsite.com,http://localhost:5173` |
| `EMAIL_USER`       | Adresse email expéditrice SMTP                          | `votre-adresse@gmail.com`                   |
| `EMAIL_PASS`       | Mot de passe d'application SMTP                         | `xxxx xxxx xxxx xxxx`                       |
| `SMTP_HOST`        | Hôte du serveur SMTP                                    | `smtp.gmail.com`                            |
| `SMTP_PORT`        | Port SMTP (465 pour SSL, 587 pour TLS)                  | `465`                                       |
| `EMAIL_TO_ADDRESS` | Adresse email destinataire recevant les messages        | `contact@monentreprise.com`                 |

Exemple de fichier `.env` :

```env
PORT=3000
ALLOWED_ORIGINS=https://monsite.com,http://localhost:5173
EMAIL_USER=mon-compte@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
EMAIL_TO_ADDRESS=destinataire@gmail.com
```

---

## 📡 Documentation de l'API

### 1. Statut & Exemple (GET `/`)

Permet de vérifier que l'API est en ligne et retourne un exemple du payload attendu.

- **URL** : `/`
- **Méthode** : `GET`
- **Réponse (200 OK)** :

```json
{
  "message": "📨 API Send Email - Serveur actif !",
  "example": {
    "endpoint": "/send-email",
    "method": "POST",
    "body": {
      "locale": "fr",
      "selectedServices": ["Service A", "Service B"],
      "name": "Nom Prénom",
      "email": "nom@example.com",
      "phone": "+213 555 555 555",
      "company": "Entreprise SARL",
      "consent": true
    }
  }
}
```

---

### 2. Envoi d'email (POST `/send-email`)

Endpoint principal pour soumettre le formulaire de contact.

- **URL** : `/send-email`
- **Méthode** : `POST`
- **Rate Limit** : 5 requêtes / 15 minutes par IP
- **Headers** :
  ```json
  {
    "Content-Type": "application/json"
  }
  ```

#### Corps de la requête (JSON Body)

| Champ              | Type       | Obligatoire | Description / Règle de validation                                                            |
| :----------------- | :--------- | :---------- | :------------------------------------------------------------------------------------------- |
| `name`             | `string`   | **Oui**     | Nom complet du contact (non vide).                                                           |
| `email`            | `string`   | **Oui**     | Adresse email valide (vérifiée via `validator.isEmail`).                                     |
| `phone`            | `string`   | **Oui**     | Numéro de téléphone (6 à 20 caractères autorisant chiffres, `+`, `-`, espaces, parenthèses). |
| `selectedServices` | `string[]` | **Oui**     | Tableau contenant au moins un service sélectionné.                                           |
| `consent`          | `boolean`  | **Oui**     | Consentement obligatoire (`true`).                                                           |
| `company`          | `string`   | Non         | Nom de l'entreprise (valeur par défaut : `"non renseignée"`).                                |
| `locale`           | `string`   | Non         | Langue de l'utilisateur (ex: `"fr"`, `"en"`, valeur par défaut : `"non spécifiée"`).         |

Exemple de requête :

```json
{
  "locale": "fr",
  "selectedServices": ["Développement Web", "SEO & Marketing"],
  "name": "Sarah Connor",
  "email": "sarah.connor@example.com",
  "phone": "+33 6 12 34 56 78",
  "company": "Cyberdyne Systems",
  "consent": true
}
```

#### Réponses possibles

##### Succès (200 OK)

```json
{
  "success": true
}
```

##### Erreur de validation (400 Bad Request)

```json
{
  "success": false,
  "error": "Champs manquants ou consentement non fourni."
}
```

_(Autres messages possibles : `"Adresse email invalide."`, `"Numéro de téléphone invalide."`, `"Veuillez sélectionner au moins un service."`)_

##### Limite de requêtes dépassée (429 Too Many Requests)

```json
{
  "success": false,
  "error": "Trop de tentatives, réessayez plus tard."
}
```

##### Origine CORS non autorisée (500 Error)

```text
Error: Non autorisé par CORS
```

##### Erreur serveur ou SMTP (500 Internal Server Error)

```json
{
  "success": false,
  "error": "Une erreur est survenue lors de l'envoi de l'email."
}
```

---

## 🛠️ Personnaliser le Schéma (`schema.js`)

Le projet sépare entièrement la logique de validation et de templating dans [schema.js](schema.js).
**Vous n'avez plus besoin d'ouvrir ou de modifier `app.js` pour ajouter ou modifier des champs.**

### Exemple : Comment ajouter un champ `message` et `budget` ?

Ouvrez simplement `schema.js` :

#### 1. Mettre à jour `examplePayload`

```javascript
const examplePayload = {
  // ... champs existants
  budget: "5000€ - 10000€",
  message: "Bonjour, je souhaite un devis...",
};
```

#### 2. Ajouter la validation et l'échappement dans `validate(body)`

```javascript
function validate(body) {
  const {
    locale,
    selectedServices,
    name,
    email,
    phone,
    company,
    consent,
    budget,
    message,
  } = body;

  // Validation requise si nécessaire
  if (!message || message.trim().length < 5) {
    return {
      valid: false,
      error: "Le message doit contenir au moins 5 caractères.",
    };
  }

  const sanitized = {
    // ... champs existants
    budget: escapeHtml(budget || "non renseigné"),
    message: escapeHtml(message),
  };

  return { valid: true, data: sanitized };
}
```

#### 3. Intégrer les champs dans l'email (`buildEmail`)

```javascript
function buildEmail(data) {
  const {
    name,
    email,
    phone,
    company,
    servicesText,
    servicesHtml,
    budget,
    message,
  } = data;

  const text = `
Nouveau message de : ${name}
Budget : ${budget}
Message : ${message}
...
  `.trim();

  const html = `
    <div>
      <h2>Nouveau message de ${name}</h2>
      <p><strong>Budget :</strong> ${budget}</p>
      <p><strong>Message :</strong></p>
      <p>${message}</p>
    </div>
  `.trim();

  return {
    subject: `Nouveau message de ${name}`,
    replyTo: `"${name}" <${data.rawEmail}>`,
    text,
    html,
  };
}
```

C'est terminé ! `app.js` prendra immédiatement en compte vos modifications.

---

## 💻 Exemples d'Intégration Frontend

### JavaScript (Fetch)

```javascript
async function sendContactForm(formData) {
  try {
    const response = await fetch("http://localhost:3000/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        locale: "fr",
        selectedServices: ["Audit", "Refonte Site Web"],
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        consent: true,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || "Erreur lors de l'envoi");
    }

    console.log("✅ Message envoyé avec succès !");
    return result;
  } catch (error) {
    console.error("❌ Erreur :", error.message);
    throw error;
  }
}
```

### React (Axios)

```jsx
import React, { useState } from "react";
import axios from "axios";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    services: ["Développement"],
    consent: false,
  });
  const [status, setStatus] = useState({ loading: false, msg: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, msg: "" });

    try {
      const response = await axios.post("http://localhost:3000/send-email", {
        locale: "fr",
        selectedServices: formData.services,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        consent: formData.consent,
      });

      if (response.data.success) {
        setStatus({ loading: false, msg: "Message envoyé avec succès !" });
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Erreur lors de l'envoi";
      setStatus({ loading: false, msg: errorMsg });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Votre nom"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />
      <input
        type="email"
        placeholder="Votre email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
      />
      <input
        type="tel"
        placeholder="Téléphone"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        required
      />
      <input
        type="text"
        placeholder="Entreprise"
        value={formData.company}
        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
      />
      <label>
        <input
          type="checkbox"
          checked={formData.consent}
          onChange={(e) =>
            setFormData({ ...formData, consent: e.target.checked })
          }
          required
        />
        J'accepte le traitement de mes données (RGPD)
      </label>
      <button type="submit" disabled={status.loading}>
        {status.loading ? "Envoi en cours..." : "Envoyer"}
      </button>
      {status.msg && <p>{status.msg}</p>}
    </form>
  );
}
```

### Vue.js

```javascript
methods: {
  async submitForm() {
    try {
      const res = await fetch("http://localhost:3000/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale: this.locale || "fr",
          selectedServices: this.selectedServices,
          name: this.name,
          email: this.email,
          phone: this.phone,
          company: this.company,
          consent: this.consent,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "Erreur lors de l'envoi");
        return;
      }

      alert("Email envoyé avec succès !");
    } catch (error) {
      console.error(error);
      alert("Erreur réseau ou serveur inaccessible");
    }
  }
}
```

### cURL

```bash
curl -X POST http://localhost:3000/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "locale": "fr",
    "selectedServices": ["Service Web"],
    "name": "Jean Dupont",
    "email": "jean.dupont@example.com",
    "phone": "+33 6 11 22 33 44",
    "company": "Acme SAS",
    "consent": true
  }'
```

---

## 🔒 Configuration du mot de passe d'application Gmail

Pour envoyer des emails via Gmail en toute sécurité :

1. Rendez-vous sur votre compte Google : [Sécurité Google](https://myaccount.google.com/security).
2. Activez la **Validation en deux étapes** si ce n'est pas déjà fait.
3. Recherchez **Mots de passe des applications** (ou visitez `https://myaccount.google.com/apppasswords`).
4. Donnez un nom à l'application (ex: `API Send Email`).
5. Copiez le mot de passe généré (16 caractères) et collez-le dans votre fichier `.env` sous `EMAIL_PASS`.

---

## 📄 Licence

Ce projet est sous licence ISC.
