# API Send to Pro Email

A modern, secure, and modular REST API for sending contact form emails, built with Node.js, Express, and Nodemailer.

---

## Table of Contents

- [Features & Security](#features--security)
- [Project Architecture](#project-architecture)
- [Quick Start](#quick-start)
- [Configuration (.env)](#configuration-env)
- [API Documentation](#api-documentation)
  - [1. Status & Example (GET /)](#1-status--example-get-)
  - [2. Send Email (POST /send-email)](#2-send-email-post-send-email)
- [Customizing the Schema (schema.js)](#customizing-the-schema-schemajs)
- [Frontend Integration Examples](#frontend-integration-examples)
  - [JavaScript (Fetch)](#javascript-fetch)
  - [React (Axios)](#react-axios)
  - [Vue.js](#vuejs)
  - [cURL](#curl)
- [Configuring a Gmail App Password](#configuring-a-gmail-app-password)
- [License](#license)

---

## Features & Security

- **Decoupled Modular Schema (`schema.js`)**: All validation rules, input sanitization, and email templates are isolated in `schema.js`. Modifying or adding form fields requires zero changes to `app.js`.
- **Configurable CORS Protection**: Domain whitelist managed through the `ALLOWED_ORIGINS` environment variable.
- **Rate Limiting**: Anti-spam and abuse prevention capped at 5 requests per 15 minutes per IP address (`express-rate-limit`).
- **XSS & HTML Injection Protection**: Systematic input escaping (`escapeHtml`) before inserting values into outgoing email templates.
- **Strict Data Validation**:
  - Strict email validation using the `validator` library.
  - Regular expression validation for phone numbers.
  - Mandatory GDPR consent verification (`consent: true`).
- **Optimized SMTP Transport (`sendMail.js`)**:
  - Cached IPv4 DNS resolution to prevent network lookup latency.
  - Strict connection, greeting, and socket timeouts (`connectionTimeout`, `greetingTimeout`, `socketTimeout`).
  - Secure TLS/SSL configuration with Server Name Indication (SNI).
- **Error Masking**: Internal server and SMTP error details are hidden from the client to prevent sensitive data exposure.

---

## Project Architecture

```text
.
├── app.js             # Express server, middlewares (CORS, Rate Limit) and route handlers
├── schema.js          # Data schema, validation, sanitization, and email template
├── sendMail.js        # Nodemailer setup, DNS resolution, and SMTP transport
├── package.json       # Project dependencies and scripts
├── .env.example       # Environment variables template
└── README.md          # Project documentation
```

---

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Then fill in your SMTP credentials (see [Configuration](#configuration-env)).

### 3. Start the Server

```bash
npm start
```

By default, the server runs on `http://localhost:3000`.

---

## Configuration (.env)

| Variable           | Description                                       | Example                                       |
| :----------------- | :------------------------------------------------ | :-------------------------------------------- |
| `PORT`             | Node.js server port                               | `3000`                                        |
| `ALLOWED_ORIGINS`  | Comma-separated list of allowed CORS origins      | `https://mywebsite.com,http://localhost:5173` |
| `EMAIL_USER`       | SMTP sender email address                         | `your-email@gmail.com`                        |
| `EMAIL_PASS`       | SMTP application password                         | `xxxx xxxx xxxx xxxx`                         |
| `SMTP_HOST`        | SMTP server host                                  | `smtp.gmail.com`                              |
| `SMTP_PORT`        | SMTP server port (465 for SSL, 587 for TLS)       | `465`                                         |
| `EMAIL_TO_ADDRESS` | Destination email address receiving form messages | `contact@mybusiness.com`                      |

Example `.env` file:

```env
PORT=3000
ALLOWED_ORIGINS=https://mywebsite.com,http://localhost:5173
EMAIL_USER=my-account@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
EMAIL_TO_ADDRESS=destination@gmail.com
```

---

## API Documentation

### 1. Status & Example (GET `/`)

Check server availability and view the expected payload structure.

- **URL**: `/`
- **Method**: `GET`
- **Response (200 OK)**:

```json
{
  "message": "API Send Email - Server active!",
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

### 2. Send Email (POST `/send-email`)

Main endpoint for submitting contact form requests.

- **URL**: `/send-email`
- **Method**: `POST`
- **Rate Limit**: 5 requests / 15 minutes per IP
- **Headers**:
  ```json
  {
    "Content-Type": "application/json"
  }
  ```

#### Request Body (JSON)

| Field              | Type       | Required | Description / Validation Rule                                                      |
| :----------------- | :--------- | :------- | :--------------------------------------------------------------------------------- |
| `name`             | `string`   | **Yes**  | Full contact name (non-empty).                                                     |
| `email`            | `string`   | **Yes**  | Valid email address (validated with `validator.isEmail`).                          |
| `phone`            | `string`   | **Yes**  | Phone number (6 to 20 characters, allowing digits, `+`, `-`, spaces, parentheses). |
| `selectedServices` | `string[]` | **Yes**  | Array with at least one selected service.                                          |
| `consent`          | `boolean`  | **Yes**  | Explicit user consent (`true` required).                                           |
| `company`          | `string`   | No       | Company name (defaults to: `"non renseignée"`).                                    |
| `locale`           | `string`   | No       | User language code (e.g., `"fr"`, `"en"`, defaults to: `"non spécifiée"`).         |

Example request:

```json
{
  "locale": "fr",
  "selectedServices": ["Web Development", "SEO & Marketing"],
  "name": "Sarah Connor",
  "email": "sarah.connor@example.com",
  "phone": "+33 6 12 34 56 78",
  "company": "Cyberdyne Systems",
  "consent": true
}
```

#### Possible Responses

##### Success (200 OK)

```json
{
  "success": true
}
```

##### Validation Error (400 Bad Request)

```json
{
  "success": false,
  "error": "Champs manquants ou consentement non fourni."
}
```

_(Other possible error messages: `"Adresse email invalide."`, `"Numéro de téléphone invalide."`, `"Veuillez sélectionner au moins un service."`)_

##### Rate Limit Exceeded (429 Too Many Requests)

```json
{
  "success": false,
  "error": "Trop de tentatives, réessayez plus tard."
}
```

##### Origin Disallowed by CORS (500 Error)

```text
Error: Non autorisé par CORS
```

##### Internal Server or SMTP Error (500 Internal Server Error)

```json
{
  "success": false,
  "error": "Une erreur est survenue lors de l'envoi de l'email."
}
```

---

## Customizing the Schema (`schema.js`)

The project isolates validation and email templating logic inside [schema.js](schema.js).
**You do not need to open or edit `app.js` when adding or modifying form fields.**

### Example: Adding `message` and `budget` Fields

Open `schema.js`:

#### 1. Update `examplePayload`

```javascript
const examplePayload = {
  // ... existing fields
  budget: "$5,000 - $10,000",
  message: "Hello, I would like to request a quote...",
};
```

#### 2. Add Validation and Sanitization in `validate(body)`

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

  // Custom validation if required
  if (!message || message.trim().length < 5) {
    return {
      valid: false,
      error: "The message must be at least 5 characters long.",
    };
  }

  const sanitized = {
    // ... existing fields
    budget: escapeHtml(budget || "not specified"),
    message: escapeHtml(message),
  };

  return { valid: true, data: sanitized };
}
```

#### 3. Include the New Fields in `buildEmail`

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
New message from: ${name}
Budget: ${budget}
Message: ${message}
...
  `.trim();

  const html = `
    <div>
      <h2>New message from ${name}</h2>
      <p><strong>Budget:</strong> ${budget}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
    </div>
  `.trim();

  return {
    subject: `New message from ${name}`,
    replyTo: `"${name}" <${data.rawEmail}>`,
    text,
    html,
  };
}
```

`app.js` automatically integrates the new schema without any modifications.

---

## Frontend Integration Examples

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
        locale: "en",
        selectedServices: ["Audit", "Website Redesign"],
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        consent: true,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || "Failed to send message");
    }

    console.log("Message sent successfully!");
    return result;
  } catch (error) {
    console.error("Error:", error.message);
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
    services: ["Development"],
    consent: false,
  });
  const [status, setStatus] = useState({ loading: false, msg: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, msg: "" });

    try {
      const response = await axios.post("http://localhost:3000/send-email", {
        locale: "en",
        selectedServices: formData.services,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        consent: formData.consent,
      });

      if (response.data.success) {
        setStatus({ loading: false, msg: "Message sent successfully!" });
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to send message";
      setStatus({ loading: false, msg: errorMsg });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Your name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />
      <input
        type="email"
        placeholder="Your email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
      />
      <input
        type="tel"
        placeholder="Phone"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        required
      />
      <input
        type="text"
        placeholder="Company"
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
        I agree to the processing of my personal data (GDPR)
      </label>
      <button type="submit" disabled={status.loading}>
        {status.loading ? "Sending..." : "Send"}
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
          locale: this.locale || "en",
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
        alert(data.error || "Failed to send message");
        return;
      }

      alert("Email sent successfully!");
    } catch (error) {
      console.error(error);
      alert("Network error or unreachable server");
    }
  }
}
```

### cURL

```bash
curl -X POST http://localhost:3000/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "locale": "en",
    "selectedServices": ["Web Services"],
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+1 555 123 4567",
    "company": "Acme Corp",
    "consent": true
  }'
```

---

## Configuring a Gmail App Password

To send emails through Gmail securely:

1. Go to your Google Account: [Google Security Settings](https://myaccount.google.com/security).
2. Enable **2-Step Verification** if not already active.
3. Search for **App passwords** (or go to `https://myaccount.google.com/apppasswords`).
4. Enter an application name (for instance: `API Send Email`).
5. Copy the generated 16-character password and paste it into your `.env` file under `EMAIL_PASS`.

---

## License

This project is licensed under the ISC License.
