/**
 * ====================================================================
 * CEFC SARL — SERVEUR BACK-END DE GESTION DES COMMANDES & RENDEZ-VOUS
 * ====================================================================
 * 
 * Ce fichier est le coeur du back-end de l'application CEFC SARL.
 * Il utilise Express pour le serveur Web, SQLite pour la base de données,
 * et Nodemailer pour l'envoi automatique de notifications par email.
 */

// Importation des modules requis
const express = require('express');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');

// Chargement des variables d'environnement (.env)
require('dotenv').config();

// Validation au démarrage (Fail-Fast) - Sécurité 1.6
if (!process.env.ADMIN_PASSWORD) {
  console.error("FATAL ERROR: La variable d'environnement ADMIN_PASSWORD n'est pas configurée.");
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error("FATAL ERROR: La variable d'environnement JWT_SECRET n'est pas configurée.");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'database.sqlite');

// Limiteurs de débit (Rate Limiting) - Sécurité Section 6
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes max par 15 min par IP
  message: { error: "Trop de requêtes depuis cette adresse IP. Veuillez réessayer plus tard." }
});

const emailFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 demandes max par 15 min par IP (anti-spam)
  message: { error: "Trop de demandes soumises. Veuillez patienter 15 minutes avant de réessayer." }
});

const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 10, // 10 tentatives max par heure (anti-bruteforce)
  message: { error: "Trop de tentatives de connexion. Accès temporairement bloqué." }
});

// Middlewares globaux
app.use(express.json()); // Permet de lire le JSON envoyé dans les requêtes
app.use(express.static(path.join(__dirname, 'public'))); // Sert les fichiers statiques du frontend (dossier public)

/**
 * -------------------------------------------------------------
 * INITIALISATION DE LA BASE DE DONNÉES SQLITE
 * -------------------------------------------------------------
 * SQLite stocke toutes les données dans un seul fichier local (database.sqlite).
 */
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error('Erreur lors de la connexion à la base de données SQLite :', err.message);
  } else {
    console.log('Connecté avec succès à la base de données SQLite :', DB_FILE);
    initializeTables();
  }
});

// Création des tables si elles n'existent pas encore
function initializeTables() {
  db.serialize(() => {
    // Table pour les Rendez-vous (appointments)
    db.run(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        company TEXT,
        service TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        mode TEXT NOT NULL,
        notes TEXT,
        timestamp TEXT DEFAULT (datetime('now', 'localtime'))
      )
    `, (err) => {
      if (err) console.error("Erreur création table appointments :", err.message);
    });

    // Table pour les Demandes de Devis (quotes)
    db.run(`
      CREATE TABLE IF NOT EXISTS quotes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        company TEXT,
        service TEXT NOT NULL,
        message TEXT,
        timestamp TEXT DEFAULT (datetime('now', 'localtime'))
      )
    `, (err) => {
      if (err) console.error("Erreur création table quotes :", err.message);
    });
  });
}

/**
 * -------------------------------------------------------------
 * CONFIGURATION DE NODEMAILER (ENVOI DE MAILS)
 * -------------------------------------------------------------
 */
function getEmailTransporter() {
  // On vérifie si les variables SMTP de base sont configurées
  if (!process.env.SMTP_USER || process.env.SMTP_USER.includes('votre-adresse-email')) {
    return null; // SMTP non configuré
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // false pour le port 587 (TLS)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

// Fonction utilitaire pour envoyer un mail sans bloquer le serveur
async function sendNotificationEmail(subject, htmlContent) {
  const transporter = getEmailTransporter();
  if (!transporter) {
    console.warn("⚠️ Attention : Les notifications par email ne sont pas configurées dans le fichier .env (SMTP_USER ou SMTP_PASS manquant). Le mail n'a pas été envoyé.");
    return;
  }

  const mailOptions = {
    from: `"CEFC SARL Robot" <${process.env.SMTP_USER}>`,
    to: process.env.NOTIFICATION_EMAIL || 'cefcsarl@gmail.com',
    subject: subject,
    html: htmlContent
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("📧 Email de notification envoyé avec succès :", info.messageId);
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de l'email de notification :", error.message);
  }
}

/**
 * -------------------------------------------------------------
 * MIDDLEWARE DE PROTECTION DU TABLEAU DE BORD (AUTHENTIFICATION JWT)
 * -------------------------------------------------------------
 */
function verifyAdminToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Accès refusé. Token manquant.' });
  }

  const token = authHeader.split(' ')[1]; // Format : "Bearer TOKEN_STRING"
  if (!token) {
    return res.status(401).json({ error: 'Accès refusé. Token mal formaté.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Jeton de session invalide ou expiré.' });
  }
}

// Fonction d'échappement HTML pour prévenir le XSS stocké - Sécurité 4.3
function sanitizeInput(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Middleware global de protection par défaut (deny-by-default) - Sécurité 3.2
const publicRoutes = ['/api/rdv', '/api/devis', '/api/admin/login'];

app.use((req, res, next) => {
  // Si la route commence par /api/ et n'est pas publique, elle nécessite le token admin
  if (req.path.startsWith('/api/') && !publicRoutes.includes(req.path)) {
    return verifyAdminToken(req, res, next);
  }
  next();
});


/**
 * -------------------------------------------------------------
 * ROUTES DE L'API PUBLIQUE (ACCESSIBLES PAR LES CLIENTS)
 * -------------------------------------------------------------
 */

// 1. Enregistrement d'un Rendez-vous (rdvForm)
app.post('/api/rdv', emailFormLimiter, (req, res) => {
  const { name, phone, email, company, service, date, time, mode, notes } = req.body;

  if (!name || !phone || !service || !date || !time) {
    return res.status(400).json({ error: 'Champs obligatoires manquants.' });
  }

  // Assainissement des entrées utilisateur
  const safeName = sanitizeInput(name);
  const safePhone = sanitizeInput(phone);
  const safeEmail = sanitizeInput(email);
  const safeCompany = sanitizeInput(company);
  const safeService = sanitizeInput(service);
  const safeDate = sanitizeInput(date);
  const safeTime = sanitizeInput(time);
  const safeMode = sanitizeInput(mode);
  const safeNotes = sanitizeInput(notes);

  const query = `
    INSERT INTO appointments (name, phone, email, company, service, date, time, mode, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [safeName, safePhone, safeEmail || 'Non renseigné', safeCompany || 'Non renseignée', safeService, safeDate, safeTime, safeMode, safeNotes || 'Aucune note'], function(err) {
    if (err) {
      console.error("Erreur insertion rdv :", err.message);
      return res.status(500).json({ error: 'Erreur interne du serveur lors de la sauvegarde.' });
    }

    // Préparation et envoi du mail en tâche de fond (async)
    const emailSubject = `📅 Nouveau Rendez-vous : ${safeName}`;
    const emailBody = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
        <h2 style="color: #0072ff; border-bottom: 2px solid #0072ff; padding-bottom: 8px;">Nouveau Rendez-vous Enregistré</h2>
        <p>Un utilisateur a pris rendez-vous sur le site de <strong>CEFC SARL</strong>.</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <tr><td style="padding: 6px; font-weight: bold; width: 150px;">Client :</td><td style="padding: 6px;">${safeName}</td></tr>
          <tr><td style="padding: 6px; font-weight: bold;">Téléphone :</td><td style="padding: 6px;">${safePhone}</td></tr>
          <tr><td style="padding: 6px; font-weight: bold;">Email :</td><td style="padding: 6px;">${safeEmail || 'Non renseigné'}</td></tr>
          <tr><td style="padding: 6px; font-weight: bold;">Entreprise :</td><td style="padding: 6px;">${safeCompany || 'Non renseignée'}</td></tr>
          <tr><td style="padding: 6px; font-weight: bold; color: #0072ff;">Objet du RDV :</td><td style="padding: 6px; font-weight: bold; color: #0072ff;">${safeService}</td></tr>
          <tr><td style="padding: 6px; font-weight: bold;">Date & Heure :</td><td style="padding: 6px; background-color: #f0f7ff;">Le ${safeDate} à ${safeTime}</td></tr>
          <tr><td style="padding: 6px; font-weight: bold;">Mode :</td><td style="padding: 6px; text-transform: uppercase;">${safeMode === 'cabinet' ? 'Au cabinet' : (safeMode === 'visio' ? 'Visioconférence' : 'Téléphone')}</td></tr>
          <tr><td style="padding: 6px; font-weight: bold; vertical-align: top;">Notes :</td><td style="padding: 6px;">${safeNotes || 'Aucune note'}</td></tr>
        </table>
        <p style="margin-top: 20px; font-size: 0.85rem; color: #666; border-top: 1px solid #eee; padding-top: 10px;">
          Ce message a été envoyé automatiquement depuis le site web CEFC SARL.
        </p>
      </div>
    `;
    sendNotificationEmail(emailSubject, emailBody);

    res.status(201).json({ message: 'Rendez-vous enregistré avec succès.', id: this.lastID });
  });
});

// 2. Enregistrement d'une demande de Devis (devisForm & contactForm)
app.post('/api/devis', emailFormLimiter, (req, res) => {
  const { name, phone, email, company, service, message } = req.body;

  if (!name || !phone || !service) {
    return res.status(400).json({ error: 'Champs obligatoires manquants.' });
  }

  // Assainissement des entrées utilisateur
  const safeName = sanitizeInput(name);
  const safePhone = sanitizeInput(phone);
  const safeEmail = sanitizeInput(email);
  const safeCompany = sanitizeInput(company);
  const safeService = sanitizeInput(service);
  const safeMessage = sanitizeInput(message);

  const query = `
    INSERT INTO quotes (name, phone, email, company, service, message)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [safeName, safePhone, safeEmail || 'Non renseigné', safeCompany || 'Non renseignée', safeService, safeMessage || 'Aucun message'], function(err) {
    if (err) {
      console.error("Erreur insertion devis :", err.message);
      return res.status(500).json({ error: 'Erreur interne du serveur lors de la sauvegarde.' });
    }

    // Préparation et envoi du mail en tâche de fond (async)
    const emailSubject = `💼 Nouvelle Demande de Devis : ${safeName}`;
    const emailBody = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
        <h2 style="color: #00c6ff; border-bottom: 2px solid #00c6ff; padding-bottom: 8px;">Nouvelle Demande de Devis</h2>
        <p>Un utilisateur a demandé un devis sur le site de <strong>CEFC SARL</strong>.</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <tr><td style="padding: 6px; font-weight: bold; width: 150px;">Client :</td><td style="padding: 6px;">${safeName}</td></tr>
          <tr><td style="padding: 6px; font-weight: bold;">Téléphone :</td><td style="padding: 6px;">${safePhone}</td></tr>
          <tr><td style="padding: 6px; font-weight: bold;">Email :</td><td style="padding: 6px;">${safeEmail || 'Non renseigné'}</td></tr>
          <tr><td style="padding: 6px; font-weight: bold;">Entreprise :</td><td style="padding: 6px;">${safeCompany || 'Non renseignée'}</td></tr>
          <tr><td style="padding: 6px; font-weight: bold; color: #00c6ff;">Service souhaité :</td><td style="padding: 6px; font-weight: bold; color: #00c6ff;">${safeService}</td></tr>
          <tr><td style="padding: 6px; font-weight: bold; vertical-align: top;">Message :</td><td style="padding: 6px; background-color: #fafafa; border: 1px dashed #eee;">${safeMessage || 'Aucun message'}</td></tr>
        </table>
        <p style="margin-top: 20px; font-size: 0.85rem; color: #666; border-top: 1px solid #eee; padding-top: 10px;">
          Ce message a été envoyé automatiquement depuis le site web CEFC SARL.
        </p>
      </div>
    `;
    sendNotificationEmail(emailSubject, emailBody);

    res.status(201).json({ message: 'Demande de devis enregistrée avec succès.', id: this.lastID });
  });
});


/**
 * -------------------------------------------------------------
 * ROUTES DE L'API D'ADMINISTRATION (SÉCURISÉES PAR DEFAUT)
 * -------------------------------------------------------------
 */

// 1. Authentification Admin (Connexion)
app.post('/api/admin/login', loginLimiter, (req, res) => {
  const { password } = req.body;
  const systemPassword = process.env.ADMIN_PASSWORD;

  if (!password) {
    return res.status(400).json({ error: 'Mot de passe requis.' });
  }

  // Vérification simple et directe du mot de passe
  if (password === systemPassword) {
    // Génération du token de session JWT valide pendant 24h
    const token = jwt.sign(
      { role: 'admin' }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );
    return res.json({ token });
  } else {
    return res.status(401).json({ error: 'Mot de passe administrateur incorrect.' });
  }
});

// 2. Récupération des données (RDVs + Devis)
app.get('/api/admin/data', (req, res) => {
  // Récupération asynchrone parallèle des données des deux tables
  db.all("SELECT * FROM appointments ORDER BY id DESC", [], (err, appointments) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erreur SQL lors du chargement des rendez-vous.' });
    }

    db.all("SELECT * FROM quotes ORDER BY id DESC", [], (err, quotes) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erreur SQL lors du chargement des devis.' });
      }

      res.json({ appointments, quotes });
    });
  });
});

// 3. Suppression d'un Rendez-vous
app.delete('/api/admin/rdv/:id', (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM appointments WHERE id = ?", [id], function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erreur SQL lors de la suppression.' });
    }
    res.json({ message: 'Rendez-vous supprimé avec succès.', changes: this.changes });
  });
});

// 4. Suppression d'un Devis
app.delete('/api/admin/devis/:id', (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM quotes WHERE id = ?", [id], function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erreur SQL lors de la suppression.' });
    }
    res.json({ message: 'Demande de devis supprimée avec succès.', changes: this.changes });
  });
});

// 5. Réinitialisation complète de toutes les données (RDVs + Devis)
app.post('/api/admin/clear-all', (req, res) => {
  db.serialize(() => {
    db.run("DELETE FROM appointments");
    db.run("DELETE FROM quotes", [], (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erreur SQL lors du nettoyage des tables.' });
      }
      res.json({ message: 'Toutes les données de la base SQLite ont été supprimées.' });
    });
  });
});


/**
 * -------------------------------------------------------------
 * GESTION DU CYCLE DE VIE DU SERVEUR
 * -------------------------------------------------------------
 */

// Route générique pour rediriger vers le site statique
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Démarrage du serveur
const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Serveur CEFC SARL démarré sur : http://localhost:${PORT}`);
  console.log(`📂 Fichiers statiques servis depuis le dossier : public/`);
  console.log(`=======================================================`);
});

// Fermeture propre de la base de données SQLite lors de l'arrêt du serveur
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error("Erreur lors de la fermeture de SQLite :", err.message);
    } else {
      console.log("Base de données SQLite fermée proprement.");
    }
    process.exit(0);
  });
});
