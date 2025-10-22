# 📨 API Send Email

API REST pour l'envoi d'emails via formulaire de contact.

## 🚀 Démarrage rapide

### Installation

```bash
npm install
```

### Configuration

Créer un fichier `.env` à la racine du projet :

```env
EMAIL_USER=votre-email@gmail.com
EMAIL_PASS=votre-mot-de-passe-application
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_TO_ADDRESS=destinataire@example.com
```

### Lancement

```bash
npm start
```

Le serveur démarre sur `http://localhost:3000`

---

## 📡 Documentation API pour le Front-End

### Endpoint principal

**POST** `/send-email`

### URL de base

```
http://localhost:3000
```

### Headers requis

```json
{
  "Content-Type": "application/json"
}
```

### Corps de la requête (Body)

```json
{
  "name": "Jean Dupont",
  "phone": "06 12 34 56 78",
  "email": "jean.dupont@example.com",
  "adressePostal": "123 Rue de Paris",
  "codePostal": "75001",
  "type": "Demande d'information",
  "message": "Bonjour, j'aimerais avoir plus d'informations..."
}
```

#### Champs obligatoires

| Champ           | Type   | Description                                                             |
| --------------- | ------ | ----------------------------------------------------------------------- |
| `name`          | string | Nom complet du contact                                                  |
| `phone`         | string | Numéro de téléphone                                                     |
| `email`         | string | Adresse email du contact                                                |
| `adressePostal` | string | Adresse postale complète                                                |
| `codePostal`    | string | Code postal                                                             |
| `type`          | string | Type de demande (ex: "Demande d'information", "Support", "Réclamation") |
| `message`       | string | Message du contact                                                      |

---

## 📝 Exemples d'intégration

### JavaScript (Fetch)

```javascript
const sendEmail = async (formData) => {
  try {
    const response = await fetch("http://localhost:3000/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        adressePostal: formData.adressePostal,
        codePostal: formData.codePostal,
        type: formData.type,
        message: formData.message,
      }),
    });

    const result = await response.json();

    if (result.success) {
      console.log("✅ Email envoyé avec succès!");
      return result;
    } else {
      console.error("❌ Erreur:", result.error);
      throw new Error(result.error);
    }
  } catch (error) {
    console.error("❌ Erreur réseau:", error);
    throw error;
  }
};
```

### React (Axios)

```javascript
import axios from "axios";

const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const response = await axios.post("http://localhost:3000/send-email", {
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      adressePostal: formData.adressePostal,
      codePostal: formData.codePostal,
      type: formData.type,
      message: formData.message,
    });

    if (response.data.success) {
      alert("Email envoyé avec succès!");
    }
  } catch (error) {
    console.error("Erreur:", error);
    alert("Erreur lors de l'envoi de l'email");
  }
};
```

### Vue.js

```javascript
methods: {
  async submitForm() {
    try {
      const response = await this.$http.post('http://localhost:3000/send-email', {
        name: this.form.name,
        phone: this.form.phone,
        email: this.form.email,
        adressePostal: this.form.adressePostal,
        codePostal: this.form.codePostal,
        type: this.form.type,
        message: this.form.message
      });

      if (response.data.success) {
        this.showSuccessMessage();
      }
    } catch (error) {
      this.showErrorMessage(error);
    }
  }
}
```

---

## ✅ Réponses API

### Succès (200)

```json
{
  "success": true,
  "messageId": "<unique-message-id@gmail.com>"
}
```

### Erreur - Champs manquants (400)

```json
{
  "success": false,
  "error": "Champs manquants dans la requête."
}
```

### Erreur serveur (500)

```json
{
  "success": false,
  "error": "Description de l'erreur"
}
```

---

## 🔒 Configuration Gmail

Pour utiliser Gmail, vous devez générer un **mot de passe d'application** :

1. Allez sur votre compte Google
2. Sécurité → Validation en deux étapes (activez-la si nécessaire)
3. Mots de passe d'application
4. Créez un nouveau mot de passe pour "Application personnalisée"
5. Copiez le mot de passe dans `.env` (`EMAIL_PASS`)

---

## 🛠️ Technologies utilisées

- **Node.js** & **Express** - Backend
- **Nodemailer** - Envoi d'emails
- **dotenv** - Gestion des variables d'environnement

---

## 📞 Support

Pour toute question ou problème d'intégration, contactez l'équipe backend.

---

## 📄 Licence

ISC
