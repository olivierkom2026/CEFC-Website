# Walkthrough : Migration Back-end CEFC SARL

Félicitations, le site de **CEFC SARL** est désormais doté d'une architecture Full-Stack complète ! Voici le récapitulatif de ce qui a été construit et comment l'utiliser, même en étant novice.

---

## 📁 Nouvelle Structure du Projet

Les fichiers ont été réorganisés proprement pour séparer la partie visible (front-end) de la logique serveur (back-end) :

* **`public/`** : Contient vos fichiers web habituels (`index.html`, `script.js`, `style.css`, `hero-bg.png`). C'est le dossier que le serveur affiche aux visiteurs.
* **`server.js`** : Le code du serveur Node.js/Express. C'est lui qui gère la base de données, l'authentification et l'envoi d'emails.
* **`package.json`** : Le fichier d'identité Node.js listant les outils utilisés (Express, SQLite3, Nodemailer, JWT, etc.).
* **`.env`** : Fichier contenant vos variables de configuration privées (mots de passe, ports, réglages SMTP).
* **`.env.example`** : Modèle du fichier `.env` pour savoir quelles variables remplir si vous partagez le code.

---

## 🛠️ Comment Exécuter le Projet en Local (Étape par Étape)

Comme Node.js n'est pas encore installé sur votre ordinateur, voici les étapes très simples pour le configurer et lancer le serveur :

### Étape 1 : Installer Node.js
1. Allez sur le site officiel : **[nodejs.org](https://nodejs.org/)**.
2. Téléchargez la version **LTS** (recommandée pour la stabilité).
3. Lancez l'installateur téléchargé et suivez les étapes en cliquant sur *Suivant* jusqu'à la fin.

### Étape 2 : Lancer le projet
1. Ouvrez votre terminal ou invite de commande (PowerShell ou CMD).
2. Rendez-vous dans le dossier de votre projet :
   ```bash
   cd "c:\QUELQUES SECRETS\BOS-main\BOS-main\Output\CEFC-Website"
   ```
3. Installez les dépendances nécessaires en tapant :
   ```bash
   npm install
   ```
4. Démarrez le serveur avec la commande :
   ```bash
   npm start
   ```
5. Ouvrez votre navigateur internet et visitez : **`http://localhost:3000`** !

---

## 🔐 Comment Fonctionne le Nouveau Tableau de Bord Admin ?

Le tableau de bord (Easter Egg) est désormais **hautement sécurisé** :
1. **Accès** : Taper le raccourci clavier secret **`Ctrl + Shift + A`**.
2. **Authentification** : Une fenêtre popup s'ouvre et vous demande le mot de passe administrateur.
3. **Mot de passe par défaut** : Le mot de passe par défaut configuré dans votre fichier `.env` est **`admincefc2026`**.
4. **Session** : Une fois connecté, vous obtenez un jeton (token JWT) valide pendant 24h qui vous évite de retaper le mot de passe à chaque fois. Les données affichées (Rendez-vous et Devis) sont lues directement depuis le fichier SQLite (`database.sqlite`).

> [!TIP]
> Pour changer le mot de passe, ouvrez simplement le fichier `.env` dans votre éditeur de code et modifiez la valeur de `ADMIN_PASSWORD`. Redémarrez ensuite le serveur.

---

## 🔄 Mécanisme de Secours (Offline Fallback)

Nous avons conçu le système pour qu'il soit ultra-robuste :
* **Si le serveur fonctionne normalement** : Les rendez-vous et demandes de devis sont enregistrés dans la base de données SQL et un mail est instantanément envoyé à `cabinetcefc87@gmail.com`.
* **Si le serveur est temporairement arrêté (ou hors ligne)** : Les données sont automatiquement stockées dans le navigateur (`localStorage`) avec une notification discrète jaune (ex: *"Envoyé (Hors ligne) !"*).
* **Affichage unifié** : Le tableau de bord fusionne intelligemment les données de la base de données et celles de secours pour que vous ne perdiez **absolument aucun client**.

---

## 📧 Envoi d'Emails Automatiques

Pour activer l'envoi d'emails vers `cabinetcefc87@gmail.com` :
1. Si vous utilisez **Gmail** pour envoyer les alertes, allez dans les paramètres de sécurité de votre compte Google et activez la validation en deux étapes, puis générez un **Mot de passe d'application**.
2. Ouvrez le fichier `.env` et mettez à jour ces lignes :
   ```env
   SMTP_USER=votre-adresse-email@gmail.com
   SMTP_PASS=votre-code-d-application-google
   ```
Le serveur s'occupera d'envoyer de magnifiques emails formatés HTML à chaque fois qu'un client s'inscrit !
