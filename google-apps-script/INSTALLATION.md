# Connecter les commandes à Google Sheets (10 minutes)

Le site n'a pas de serveur : les commandes passent par un petit script Google (Apps Script) attaché à votre feuille.
Rien n'est publié tant que vous ne faites pas ces étapes — d'ici là, le bouton « Commander » ouvre WhatsApp comme avant.

## 1. Créer la feuille et le script
1. Créez un Google Sheet vide, nommez-le par exemple **MIROTECH — Commandes**.
2. Menu **Extensions → Apps Script**.
3. Supprimez le code par défaut, collez tout le contenu de `Code.gs` (dans ce dossier), cliquez **Enregistrer**.

## 2. Choisir le mot de passe admin
1. Dans Apps Script : **Paramètres du projet** (roue dentée) → **Propriétés du script** → **Ajouter une propriété**.
2. Nom : `ADMIN_PASSWORD` — Valeur : votre mot de passe (6 caractères minimum ; plus il est long, mieux c'est).
3. Ne l'écrivez jamais dans le code ni dans le site : il est vérifié uniquement côté Google.

## 3. Publier
1. **Déployer → Nouveau déploiement → type « Application Web »**.
2. *Exécuter en tant que* : **Moi**. *Qui a accès* : **Tout le monde**.
   (Le site doit pouvoir envoyer une commande ; la lecture des commandes reste protégée par le mot de passe.)
3. Autorisez l'accès à la feuille quand Google le demande, puis copiez l'**URL de l'application Web** (finit par `/exec`).

## 3 bis. (Optionnel) Être prévenu par e-mail
Ajoutez la propriété `NOTIFY_EMAIL` (votre adresse) : vous recevrez un e-mail à chaque commande, et vous verrez tout de suite un éventuel spam. Google demandera l'autorisation d'envoyer des e-mails au premier déploiement.

## 4. Relier le site
1. À la racine du projet, créez le fichier `.env.local` :
   ```
   VITE_ORDERS_API_URL=https://script.google.com/macros/s/XXXXXXXX/exec
   ```
2. Relancez `npm run dev`, ou refaites `npm run build` avant de publier.
3. Sur votre hébergeur, ajoutez la même variable `VITE_ORDERS_API_URL` avant le build.

## 5. Utiliser
- Commandes : l'onglet **Commandes** de la feuille se remplit tout seul (statut « Nouvelle »). Changez le statut à la main : Confirmée, Livrée, Annulée.
- Page admin : `https://votre-site/miro` → saisissez le mot de passe → liste des commandes, recherche, bouton WhatsApp pour contacter le client.
- Après 5 mots de passe faux de suite, la connexion est bloquée 15 minutes (cela protège un mot de passe court, mais quelqu'un peut aussi vous bloquer volontairement : attendez 15 minutes). La session admin dure 30 minutes puis demande de se reconnecter.

## Règles de saisie du formulaire
Nom ou prénom : un seul mot suffit, 60 caractères maximum. Téléphone : numéro marocain (05/06/07 ou +212). Ville et adresse : un seul champ, 150 caractères maximum, aucune autre règle. Ces règles sont revérifiées par `Code.gs`.
La feuille a 9 colonnes (Date, N° commande, Nom et prénom, Téléphone, Ville et adresse, Articles, Total, Paiement, Statut) : si vous aviez déjà créé la feuille avec une ancienne version, supprimez l'onglet « Commandes » pour qu'il soit recréé.

## Si vous modifiez Code.gs
Faites **Déployer → Gérer les déploiements → Modifier → Nouvelle version**, sinon l'ancienne version reste en ligne.

## Quand vous changez un prix
Modifiez `src/data/products.js` **et** le bloc `CATALOGUE` de `Code.gs`, puis redéployez le script. `npm test` échoue si les deux ne sont pas identiques.

## Sécurité : à savoir
- L'adresse `/exec` est publique (elle est dans le site). Elle ne permet que d'envoyer une commande ; lire les commandes exige le mot de passe.
- Ne donnez pas l'accès « éditeur » du Google Sheet à vos employés : un éditeur peut voir le script et le mot de passe. Pour eux, partagez le Sheet en lecture seule ou donnez-leur la page `/miro`.
- Plafond anti-spam : 30 commandes par tranche de 10 minutes, un client ne peut pas renvoyer deux commandes en moins d'une minute avec le même téléphone.
- Si vous exportez la feuille en CSV, importez-la en « texte » plutôt que de l'ouvrir directement dans Excel.
- Vos clients doivent être informés de l'usage de leurs données (loi marocaine 09-08) : le formulaire contient une courte mention ; complétez-la si besoin dans vos mentions légales.

## Données clients
La feuille contient des noms, téléphones et adresses : partagez-la uniquement avec les personnes qui gèrent les commandes.
