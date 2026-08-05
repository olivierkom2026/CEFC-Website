# Plan d'Implémentation : Passage en Back-End (Node.js & SQLite)

Ce document décrit l'architecture et les étapes nécessaires pour doter le site internet de **CEFC SARL** d'un système back-end sécurisé et fonctionnel. 

En tant que débutant en back-end, vous trouverez ici une approche simple, robuste et pédagogique basée sur **Node.js**, **Express**, et une base de données locale **SQLite** (sans installation complexe).

---

## Fonctionnalités Futures Suggérées ("BOSS Mode")

Avant de passer à la technique, voici les fonctionnalités majeures à forte valeur ajoutée que nous pourrons ajouter par la suite pour propulser le site du cabinet :

1. **Portail Client Sécurisé (Espace Client)** : 
   - Permettre à vos clients de déposer leurs documents comptables (factures, reçus, relevés) de manière sécurisée en ligne.
   - Partager les DSF (Déclarations Statistiques et Fiscales), rapports d'audit et bilans comptables directement dans leur espace privé.
2. **Système de Notification SMS et Rappels par Email** :
   - Envoyer une confirmation automatique par email aux clients et un SMS de rappel la veille d'un rendez-vous pour réduire les absences.
3. **Simulateur de Devis Interactif** :
   - Un questionnaire étape par étape où le prospect indique son chiffre d'affaires, son régime fiscal (IGS ou Réel) et son nombre de salariés pour obtenir instantanément une fourchette de prix ou une recommandation d'offre.
4. **Blog / Veille Fiscale & Légale** :
   - Un espace d'actualités pour publier des articles sur la loi de finances au Cameroun. Cela améliorera grandement votre image d'expert et le référencement (SEO) du cabinet sur Google.
5. **Gestionnaire de Statuts des RDV** :
   - Dans le tableau de bord admin, pouvoir marquer un rendez-vous comme *Confirmé*, *Reporté*, *Terminé* ou *Annulé*, et lui attribuer un collaborateur du cabinet.

---

## Choix de l'Architecture Technique

Nous proposons une architecture **Full-Stack Node.js/Express** :
* **Serveur Web** : Node.js avec le framework **Express** pour gérer la logique, les formulaires et servir les fichiers du site.
* **Base de Données** : **SQLite** via `sqlite3`. C'est une base de données relationnelle légère qui stocke toutes les données dans un seul fichier local (`database.sqlite`). Elle ne nécessite aucune installation de serveur de base de données (idéal pour débuter).
* **Notifications par Email** : Utilisation de **Nodemailer** pour envoyer des alertes mails automatiques à `cefcsarl@gmail.com` à chaque fois qu'un client remplit un formulaire.
* **Sécurisation du Tableau de Bord Admin** : Remplacement de l'accès direct sans mot de passe (raccourci `Ctrl + Shift + A`) par un système d'authentification sécurisé (mot de passe stocké de manière chiffrée avec `bcryptjs`).

---

## Structure du Projet Proposée

Pour garder le code propre, nous allons réorganiser le projet en séparant le frontend (fichiers visibles par le visiteur) du backend :

```
/CEFC-Website
  ├── public/                  <-- [NOUVEAU DOSSIER] Contient les fichiers du site
  │   ├── index.html           <-- (Déplacé) Page principale
  │   ├── script.js            <-- (Déplacé/Modifié) Script d'interaction et d'API
  │   ├── style.css            <-- (Déplacé) Styles CSS
  │   └── hero-bg.png          <-- (Déplacé) Image de fond
  ├── server.js                <-- [NOUVEAU] Serveur back-end Express
  ├── .env                     <-- [NOUVEAU] Variables secrètes (non partagées sur Git)
  ├── .env.example             <-- [NOUVEAU] Modèle du fichier .env pour les collaborateurs
  ├── package.json             <-- [NOUVEAU] Liste des dépendances Node.js
  └── database.sqlite          <-- [GÉNÉRÉ AUTOMATIQUEMENT] Fichier contenant les RDV et Devis
```

---

## Modifications Proposées

### 1. Initialisation Node.js et Dépendances

Nous allons créer un fichier `package.json` contenant les paquets requis :
* `express` : Framework web.
* `cors` : Gestion des requêtes multi-origines.
* `dotenv` : Chargement des variables d'environnement (mots de passe, clés secrètes).
* `sqlite3` : Module de base de données SQLite.
* `nodemailer` : Envoi de mails via SMTP.
* `bcryptjs` : Hachage sécurisé des mots de passe.
* `jsonwebtoken` : Génération de jetons de session sécurisés pour l'administrateur.

### 2. Création du Serveur Backend (`server.js`)
* Créera automatiquement le fichier `database.sqlite` et les tables `appointments` et `quotes` s'ils n'existent pas.
* Fournira les routes API suivantes :
  - `POST /api/rdv` : Enregistre un rendez-vous et envoie une alerte mail.
  - `POST /api/devis` : Enregistre une demande de devis et envoie une alerte mail.
  - `POST /api/admin/login` : Vérifie le mot de passe et génère un jeton (token) d'accès.
  - `GET /api/admin/data` : Récupère les données (RDV + Devis) si le token admin est valide.
  - `DELETE /api/admin/rdv/:id` : Supprime un RDV (sécurisé).
  - `DELETE /api/admin/devis/:id` : Supprime un devis (sécurisé).

### 3. Fichier de Configuration `.env`
Contiendra les configurations sensibles :
```env
PORT=3000
ADMIN_PASSWORD=VotreMotDePasseSuperSecurisant
JWT_SECRET=CleSecretePourGenererLesSessions
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-adresse-email@gmail.com
SMTP_PASS=votre-mot-de-passe-d-application
NOTIFICATION_EMAIL=cefcsarl@gmail.com
```

### 4. Adaptation du Frontend (`public/script.js` et `public/index.html`)
* Modification des écouteurs de formulaires (`submit`) pour envoyer les données au serveur via `fetch()` au lieu d'utiliser uniquement `localStorage`.
* **Ajout d'un écran de connexion** : Lorsque le raccourci secret `Ctrl + Shift + A` est pressé, une petite fenêtre demande le mot de passe administrateur avant d'afficher le tableau de bord.
* Les requêtes de chargement, suppression et export CSV du tableau de bord utiliseront désormais l'API sécurisée avec le jeton d'authentification.

---

## Plan de Vérification

### Tests Automatiques / Intégration Locale
1. **Démarrage du Serveur** : Exécuter `npm start` et vérifier la création du fichier `database.sqlite`.
2. **Soumission RDV** : Remplir le formulaire de rendez-vous sur le site et vérifier :
   - L'affichage du message de succès.
   - L'insertion correcte dans la table SQLite.
   - La simulation ou l'envoi effectif du mail de notification.
3. **Soumission Devis** : Même vérification pour le formulaire de demande de devis.
4. **Accès Administration** :
   - Taper `Ctrl + Shift + A`.
   - Vérifier qu'un mot de passe est demandé.
   - Tester avec un mauvais mot de passe (doit échouer).
   - Entrer le bon mot de passe (doit charger et afficher les données issues de la base SQLite).
5. **Suppression de données** : Tester la suppression d'un élément depuis le tableau de bord et vérifier qu'il disparaît de la base de données.

### Plan de Déploiement
* Nous vous fournirons un guide pour déployer gratuitement ou à très bas coût ce serveur sur **Render.com** ou **Heroku**, avec les étapes pour configurer vos emails de notification en toute sécurité.
