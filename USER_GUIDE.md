# MangeQR — Guide d'utilisation

> **Qui doit lire ce document ?**
> - **Restaurateurs (clients)** : suivez les sections marquées 👤 pour installer et gérer votre menu.
> - **Équipe support / service client** : les encarts 🛟 donnent le dépannage, les règles métier et les réponses aux questions fréquentes.
>
> MangeQR transforme la carte de votre restaurant en **menu digital** accessible via un **QR code** (ou un lien partageable sur les réseaux sociaux), avec analytics, avis clients, prise de commande, et commande de supports imprimés.

---

## Table des matières

1. [Concepts clés](#1-concepts-clés)
2. [Créer un compte et se connecter](#2-créer-un-compte-et-se-connecter)
3. [Vue d'ensemble de l'interface](#3-vue-densemble-de-linterface)
4. [Mise en route rapide (5 étapes)](#4-mise-en-route-rapide-5-étapes)
5. [Restaurants](#5-restaurants)
6. [Menus](#6-menus)
7. [Catégories & plats](#7-catégories--plats)
8. [Menu numérique (QR code & apparence)](#8-menu-numérique-qr-code--apparence)
9. [Menu physique (impression)](#9-menu-physique-impression)
10. [Le menu vu par le client (diner)](#10-le-menu-vu-par-le-client-diner)
11. [Prise de commande (option)](#11-prise-de-commande-option)
12. [Avis clients](#12-avis-clients)
13. [Performances (statistiques)](#13-performances-statistiques)
14. [Équipe (membres)](#14-équipe-membres)
15. [Mon compte, abonnement & langue](#15-mon-compte-abonnement--langue)
16. [Plans & limites](#16-plans--limites)
17. [Console Super Admin](#17-console-super-admin)
18. [Guide de dépannage support 🛟](#18-guide-de-dépannage-support-)
19. [FAQ](#19-faq)

---

## 1. Concepts clés

| Terme | Définition |
| --- | --- |
| **Restaurant** | Un établissement. Chaque restaurant a son propre QR code, son lien d'accès, sa devise et son apparence. |
| **Menu** | Une carte (ex. « Menu du midi », « Boissons »). Un restaurant peut avoir plusieurs menus. Chaque menu a des **jours de disponibilité**. |
| **Catégorie** | Une section d'un menu (ex. « Entrées », « Plats », « Desserts »). |
| **Plat** | Un article : nom, description, prix, photo, allergènes/tags. |
| **QR code / Lien d'accès** | Ce que scanne ou ouvre le client pour voir le menu. |
| **Espace de travail** | Le compte propriétaire + ses membres. Les membres agissent sur les données du propriétaire. |
| **Prise de commande** | Option activée par MangeQR : les clients commandent depuis la table ou en livraison. |

**Rôles :**
- **Propriétaire (OWNER)** : accès complet (restaurants, menus, apparence, équipe, abonnement).
- **Membre (MEMBER)** : gère les menus/catégories/plats et les commandes du propriétaire, mais **pas** les restaurants, campagnes, apparence, ni le plan de salle.
- **Super Admin** : équipe MangeQR uniquement (abonnements, suivi des commandes de designs, activation de la prise de commande).

---

## 2. Créer un compte et se connecter

👤 **Créer un compte**
1. Aller sur la page d'accueil → **S'inscrire** (`/auth/sign-up`).
2. Renseigner nom, email et mot de passe.
3. Un **email de vérification** est envoyé. Cliquez sur le lien pour activer le compte.
4. Connectez-vous sur `/auth/sign-in`.

👤 **Mot de passe oublié**
- Sur la page de connexion → **Mot de passe oublié** (`/auth/forgot-password`) → saisissez votre email → suivez le lien de réinitialisation reçu.

👤 **Authentification à deux facteurs (2FA)** — optionnelle
- Activable depuis **Mon compte → Paramètres du profil**. Un code est alors demandé à chaque connexion.

🛟 **Support — problèmes de connexion**
- *« Je n'ai pas reçu l'email de vérification / réinitialisation »* : vérifier les spams ; confirmer que l'email saisi est correct ; l'envoi dépend du service email (Resend) — un email peut mettre quelques minutes.
- *« Compte suspendu »* : le compte a été suspendu par un Super Admin (souvent abonnement expiré/impayé). Voir §17.
- *« Connexion via Google/GitHub »* : disponible si l'OAuth est configuré ; sinon utiliser email + mot de passe.

---

## 3. Vue d'ensemble de l'interface

Après connexion, vous arrivez sur **Mes performances**. La **barre latérale** (à gauche) regroupe :

- **Tableau de bord** → Mes performances
- **Mon activité** → Mes restaurants · Menus · Catégories & plats
- **Ma clientèle** → Avis clients *(· Campagne marketing — masquée par défaut)*
- **Personnalisations** → Menu numérique · Menu physique
- **Prise de commande** *(visible seulement si activée)* → Commandes · Cuisine · Plan de salle
- **Paramètres** → Mon compte
- **Administration** *(Super Admin uniquement)* → Super Admin · Commandes de designs

En haut à droite : **sélecteur de langue** (🇫🇷 FR / 🇩🇿 AR / 🇬🇧 EN), **thème clair/sombre**, **menu du compte**, et le bouton **aide** (revoir le guide interactif).

> 💡 **Guide interactif** : à la première connexion, une visite guidée s'affiche automatiquement. Vous pouvez la relancer à tout moment via le bouton d'aide dans la barre du haut. Sur mobile, la visite ouvre le menu latéral automatiquement.

📱 **Mobile** : la barre latérale se replie derrière l'icône ☰ en haut à gauche.

---

## 4. Mise en route rapide (5 étapes)

👤 Pour être opérationnel en quelques minutes :

1. **Créer un restaurant** → *Mes restaurants* → *Ajouter un restaurant* (nom, adresse, téléphone, devise, lien d'accès).
2. **Créer un menu** → *Menus* → *Ajouter un menu* (nom + jours de disponibilité).
3. **Ajouter des catégories et des plats** → *Catégories & plats* → choisir restaurant + menu → *Ajouter une catégorie*, puis *Ajouter un plat*.
4. **Récupérer le QR code / lien** → *Menu numérique* → sélectionner le restaurant → *Télécharger le QR* ou copier le lien.
5. **Tester** → *Aperçu du menu* pour voir exactement ce que verra votre client.

Vous pouvez ensuite personnaliser l'apparence, commander des supports imprimés, et suivre vos statistiques.

---

## 5. Restaurants

👤 **Créer** : *Mes restaurants* → *Ajouter un restaurant*.
Champs : **Nom***, **Adresse***, **Numéro de téléphone***, **Lien d'accès à votre menu*** (sous-domaine unique), **Devise*** (Euro / Dollar / Dinar), puis optionnels : mot de passe Wifi, site web, Instagram, TikTok, profil Google, photo bannière.

- Le **lien d'accès** doit être unique (globalement). En production il donne `https://<lien>.mangeqr.com` ; le QR code encode toujours un lien stable qui fonctionne dans tous les cas.
- La **devise** détermine le symbole affiché (€, $, DZD) **et** les options de livraison des commandes de supports (voir §9).

👤 **Modifier / Supprimer** : dans le tableau *Mes restaurants*, utilisez l'icône crayon (modifier) ou sélectionnez des lignes puis *Supprimer*.

> ⚠️ **La suppression est irréversible** : elle supprime définitivement le restaurant **et** ses menus, catégories, plats — et rend le lien public obsolète.

🛟 **Support**
- *« Lien d'accès déjà utilisé »* : le sous-domaine est pris ; en choisir un autre.
- *« Limite de restaurants atteinte »* : le plan limite le nombre de restaurants (Starter 1, Pro 3, Premium illimité). Voir §16.
- *Un membre ne voit pas « Ajouter un restaurant »* : normal — la gestion des restaurants est réservée au propriétaire.

---

## 6. Menus

👤 **Créer** : *Menus* → *Ajouter un menu* → **Nom**, **Restaurant**, **Disponibilité** (jours de la semaine).

- **Disponibilité** : un menu ne s'affiche au client que les jours cochés. **Aucun jour coché = disponible tous les jours.**
- **Statut Actif/Inactif** : un menu inactif n'apparaît pas sur le menu public.
- **Dupliquer** : copie un menu (avec ses catégories et plats).
- **Réordonner** : glisser-déposer pour changer l'ordre d'affichage.

🛟 **Support**
- *« Aucun menu disponible aujourd'hui » côté client* : soit tous les menus sont **inactifs**, soit leurs **jours de disponibilité** n'incluent pas la date du jour. Solution : cocher le bon jour ou vider les jours pour « tous les jours ».
- *« Limite de menus atteinte »* : Starter 7, Pro 21, Premium illimité.

---

## 7. Catégories & plats

👤 **Accès** : *Catégories & plats* → choisir un **restaurant** puis un **menu**.

- **Ajouter une catégorie** : nom + icône (emoji).
- **Catégories repliables** : chaque catégorie a un chevron ; elles sont **repliées par défaut**. Cliquez pour développer et voir les plats.
- **Ajouter un plat** : depuis l'en-tête d'une catégorie → *Ajouter un plat*. Champs : nom, description, prix, photo, et **allergènes & tags** (Végétarien, Fait maison, De saison, Gluten, Lait, etc.).
- **Réordonner** : glisser-déposer les catégories entre elles et les plats (y compris d'une catégorie à l'autre).
- **Activer/Désactiver** un plat ou une catégorie via l'interrupteur ; **désactivé = masqué** du menu public.
- **Dupliquer / Modifier / Supprimer** via les icônes de chaque carte.

> 💡 Les **tags** (Végétarien, Fait maison, De saison…) apparaissent en badges colorés sur le menu client ; les **allergènes** apparaissent dans la ligne « Contient : ».

🛟 **Support**
- *« Ma photo ne s'affiche pas »* : l'upload d'image nécessite le stockage S3 configuré. Sans S3 (démo locale), les pages fonctionnent mais les images n'apparaissent pas.
- *« J'ai modifié un plat et il est réapparu alors qu'il était désactivé »* : ce comportement a été corrigé ; désactiver via l'interrupteur reste effectif.

---

## 8. Menu numérique (QR code & apparence)

👤 **Accès** : *Menu numérique*. Trois onglets :

**QR code**
- Sélectionnez un restaurant → le QR s'affiche. **Télécharger le QR** (PNG), **copier le lien**, ou **Aperçu du menu** (ouvre le menu client réel).

**Apparence**
- Personnalisez la police, la **couleur principale** (accent), la **couleur de fond**, et l'affichage des informations (adresse, téléphone, Wifi, réseaux). Un **aperçu en direct** (téléphone) reflète vos changements avant enregistrement.
- Le menu client est rendu **exactement** selon ces couleurs, indépendamment du thème clair/sombre de l'appareil du client.

**Commander un design**
- Catalogue de supports QR physiques (affiche élégante, disque en bois gravé, sticker de table). Choisissez un design, une quantité, vos coordonnées et le mode de livraison, puis validez. L'équipe MangeQR traite la commande (suivi en §17).

🛟 **Support**
- *L'apparence n'est pas plan-gated* : tout le monde peut personnaliser ; la **suppression du logo** et le **QR personnalisé** sont des avantages du plan Premium.
- *Livraison en Algérie (Dinar)* : seule l'option **Yalidine bureau** est disponible (règle métier). Ailleurs : standard / express / point relais.

---

## 9. Menu physique (impression)

👤 **Accès** : *Menu physique*. Sélectionnez restaurant + menu, choisissez un **modèle** de carte (Ardoise, Bistro, Élégant, Élégant Doré, Moderne, Tableau Vert), puis :
- **Imprimer / Exporter PDF** : impression navigateur, pagination A4 propre.
- **Commander l'impression** : menu A4, plastifié ou livret, livrés par MangeQR.

🛟 **Support**
- *Bordures/coupures bizarres à l'impression* : utiliser l'aperçu A4 ; la pagination évite de couper un plat en deux. En cas de souci, vérifier les marges d'impression du navigateur (par défaut).

---

## 10. Le menu vu par le client (diner)

Le client scanne le QR ou ouvre le lien — **aucune connexion requise**. Il voit :
- Une **barre supérieure** avec le logo et le titre du menu actif.
- Des **onglets** (pilules) pour changer de menu.
- Une **photo de couverture** avec le nom du restaurant.
- Une barre **« Suivez-nous »** (réseaux sociaux).
- Les **catégories** et des **cartes de plats** : photo, nom, prix, description, badges (Végétarien / Fait maison…), ligne « Contient : » (allergènes), et un **cœur** pour mettre en favori.
- Un espace **avis** (laisser une note / avis).
- Le client peut **changer la langue** (FR/AR/EN) indépendamment de l'app.

> Chaque scan et consultation alimente vos **statistiques** (voir §13).

---

## 11. Prise de commande (option)

> ℹ️ **La prise de commande est activée par MangeQR par compte** (Super Admin). Une fois activée, le propriétaire l'active **par restaurant**. Les entrées **Commandes / Cuisine / Plan de salle** n'apparaissent que si l'option est active.

👤 **Plan de salle** (*propriétaire uniquement*)
- *Plan de salle* → sélectionner un restaurant → définir des **zones** (ex. Terrasse, Salle) et des **tables** (numéro, places).
- **Glisser-déposer** les tables pour organiser la salle. **Enregistrer**.

👤 **Côté client (diner)**
- Sur le menu, le client **ajoute des plats** au panier, choisit des **suppléments** (ex. cuisson unique, extras multiples) et ajoute une **demande spéciale**.
- Au paiement : **Sur place** (choisir le numéro de table) **ou Livraison** (nom, téléphone + adresse ou **partage de position GPS**).
- Après envoi, le client suit l'état de sa commande sur une **page de suivi en direct**.
- 💰 **Paiement sur place** (pas de paiement en ligne).

👤 **Suppléments par plat**
- Dans *Catégories & plats*, l'icône « suppléments » (visible quand la commande est activée) ouvre l'éditeur : créez des groupes **choix unique** (ex. Taille) ou **choix multiple** (ex. Extras), chaque option pouvant ajouter un prix.

👤 **Commandes** (propriétaire **et** membres)
- File des commandes **groupées par table** + un groupe **Livraison**, avec numéro de commande, articles, statut.
- Faites avancer le statut : **Reçue → En préparation → Prête → Servie → Terminée** (sur place) ou **… → En livraison → Livrée → Terminée** (livraison), + **Annuler**.
- **Nouvelle commande** = **son** + indication visuelle (badge pulsé). Le son est activable/désactivable.

👤 **Cuisine** (propriétaire **et** membres)
- Tableau des commandes **actives** organisé par colonnes de statut, pour un affichage type « écran cuisine ». Mise à jour automatique.

🛟 **Support**
- *« Je ne vois pas Commandes/Cuisine/Plan de salle »* : la prise de commande n'est pas activée pour ce compte (Super Admin) **ou** pas activée sur ce restaurant.
- *« Le client ne peut pas commander »* : vérifier que **le compte** ET **le restaurant** ont l'option activée, et que des **tables** existent pour le sur-place.
- *Les prix des commandes sont recalculés côté serveur* : impossible de manipuler les prix depuis le navigateur du client.

---

## 12. Avis clients

👤 **Accès** : *Avis clients*.
- Liste des avis (note, message, source **MangeQR** ou **Google**), avec recherche et filtre par source.
- Les avis sont laissés par les clients depuis le menu public.
- Un **badge partageable** met en avant votre note.

---

## 13. Performances (statistiques)

👤 **Accès** : *Mes performances* → sélectionner un restaurant + une période.

KPIs :
- **Scans**, **Avis**, **Catégorie la plus vue**, **Le plat favoris**.
- Si la **prise de commande** est active : **Commandes**, **Revenu**, **Panier moyen**, **Sur place / Livraison**, plus un **graphique de revenu par jour**.
- Graphiques : scans par jour, répartition jour/soir, etc.

🛟 **Support**
- *« Mes stats sont vides »* : aucune donnée sur la période — élargir la plage de dates, ou le restaurant n'a pas encore de scans/commandes.

---

## 14. Équipe (membres)

👤 **Accès** : *Mon compte* → section **Équipe** (propriétaire).
- **Inviter un membre** : génère un **code / lien d'invitation** à partager. Le membre crée/possède un compte et rejoint votre espace via `/team/join?code=...`.
- Le nombre de sièges dépend du plan.
- **Retirer un membre** révoque immédiatement son accès.

Un **membre** voit une carte en lecture seule indiquant l'espace qu'il a rejoint. Il peut agir sur menus/catégories/plats/commandes, mais pas sur les restaurants, l'apparence, les campagnes ou le plan de salle.

🛟 **Support**
- *« Impossible de rejoindre »* : le code peut être expiré, déjà utilisé, ou l'utilisateur possède déjà des restaurants / une équipe (il doit être « libre » pour rejoindre).
- *« Plus de sièges »* : la limite du plan est atteinte.

---

## 15. Mon compte, abonnement & langue

👤 **Accès** : *Mon compte*.
- **Profil** : nom, email, avatar, rôle, **ID du compte** (copiable — utile au support).
- **Paramètres du profil** : modifier nom / email (l'email demande une vérification), activer la **2FA**.
- **Mettre à jour le mot de passe**.
- **Mon abonnement** : plan souscrit, date d'expiration, mode de paiement (espèces / en ligne), et compteurs d'usage (restaurants, menus).

**Langue & thème** (barre du haut) :
- Langues : **Français, العربية (Arabe), English**. L'arabe passe l'interface en **RTL**.
- Thème **clair / sombre**.

---

## 16. Plans & limites

| | **Starter** | **Pro** | **Premium** |
| --- | --- | --- | --- |
| Prix | 10€/mois · 100€/an | 35€/mois · 350€/an | 49€/mois · 490€/an |
| Restaurants | 1 | jusqu'à 3 | illimités |
| Menus | 7 | 21 | illimités |
| Catégories / plats / scans | illimités | illimités | illimités |
| QR code par restaurant | ✅ | ✅ | ✅ |
| Statistiques | ✅ | ✅ | ✅ |
| Livraison des menus | +2€/table | +2€/table | **gratuite** |
| Suppression du logo | — | — | ✅ |
| QR code personnalisé | — | — | ✅ |
| Assistance | ✅ | ✅ | ✅ |

> Un abonnement payant **expiré** rétrograde automatiquement le compte au niveau **Starter** (les limites Starter s'appliquent alors).

🛟 **Support** : le paiement peut être **en espèces** (géré hors ligne par un Super Admin) ou **en ligne**. Les changements de plan/date d'expiration sont effectués par un Super Admin (§17).

---

## 17. Console Super Admin

> Réservé à l'équipe MangeQR. Accès : entrée **Super Admin** dans la barre latérale (rôle SUPERADMIN uniquement ; routes protégées).

**Super Admin** (`/superadmin`) — gestion des comptes :
- Rechercher / paginer les utilisateurs.
- **Gérer l'abonnement** : plan, mode de paiement (espèces/en ligne), date d'expiration.
- **Activer/désactiver la prise de commande** par compte (interrupteur « Commandes »).
- **Suspendre / réactiver** un compte (empêche la connexion).
- **Supprimer** un compte (irréversible, cascade sur ses données).
- Garde-fous : on ne peut pas se suspendre/supprimer soi-même ni un autre Super Admin.

**Commandes de designs** (`/superadmin/design-orders`) — suivi de fabrication :
- Toutes les commandes de QR/menus physiques, avec recherche et filtre par statut.
- Faire évoluer le statut : **En attente → En cours → Expédiée → Livrée** (ou **Annulée**).

🛟 **Scénarios support fréquents**
- *Client bloqué par « limite atteinte »* → vérifier le plan ; proposer une montée de gamme ou ajuster via Super Admin.
- *Client veut la prise de commande* → l'activer sur son compte (Super Admin), puis lui indiquer d'activer le restaurant concerné.
- *Abonnement payé en espèces* → mettre à jour plan + date d'expiration dans Super Admin.
- *Suivi d'une commande de QR imprimé* → onglet **Commandes de designs**.

---

## 18. Guide de dépannage support 🛟

| Symptôme | Cause probable | Résolution |
| --- | --- | --- |
| Menu client affiche « Aucun menu disponible aujourd'hui » | Menus inactifs ou jours de disponibilité ne couvrant pas aujourd'hui | Activer le menu / cocher le bon jour / vider les jours (= tous les jours) |
| « Restaurant introuvable » sur un lien | Lien obsolète (restaurant supprimé ou id changé) | Récupérer le lien actuel via *Mes restaurants* ou *Menu numérique* |
| Images de plats absentes | Stockage S3 non configuré | Configurer S3 (prod) ; en démo locale c'est attendu |
| Impossible de créer un restaurant/menu | Limite du plan atteinte | Vérifier le plan (§16) ; monter de gamme |
| Entrées Commandes/Cuisine absentes | Prise de commande non activée (compte ou restaurant) | Activer au niveau compte (Super Admin) puis restaurant |
| Le client ne peut pas commander | Option inactive ou pas de tables | Activer l'option + créer des tables |
| Connexion refusée | Email non vérifié ou compte suspendu | Vérifier l'email / lever la suspension (Super Admin) |
| Emails non reçus (vérif./reset) | Service email (Resend) | Vérifier spams ; réessayer ; confirmer la config email |
| Interface partiellement en français en arabe | Certaines sous-vues restent à traduire | En cours de finalisation ; signaler la vue concernée |
| Livraison de design limitée en Algérie | Règle métier (Dinar → Yalidine bureau) | Comportement attendu |

**Informations à demander au client pour un ticket :**
- L'**ID du compte** (dans *Mon compte → Profil*, copiable).
- Le **restaurant** concerné (nom) et, si pertinent, le **lien d'accès**.
- La **page** exacte et une **capture d'écran**.
- Le **navigateur / appareil** (surtout pour l'impression ou la géolocalisation).

---

## 19. FAQ

**Le client doit-il installer une application ?**
Non. Le menu s'ouvre dans le navigateur après scan du QR ou via le lien.

**Puis-je avoir plusieurs restaurants ?**
Oui, selon le plan (Starter 1, Pro 3, Premium illimité).

**Le QR code change-t-il si je modifie mon menu ?**
Non. Le QR reste stable ; le menu se met à jour automatiquement.

**Puis-je partager mon menu sur Instagram/TikTok ?**
Oui, partagez simplement le lien d'accès. C'est aussi via ce lien que les commandes en livraison arrivent.

**Comment activer la prise de commande ?**
Contactez le support : MangeQR l'active pour votre compte, puis vous l'activez par restaurant.

**Les clients paient-ils en ligne ?**
Non, le paiement se fait sur place (ou à la livraison). MangeQR gère la commande, pas l'encaissement.

**Dans quelles langues le menu est-il disponible ?**
Français, Arabe (RTL) et Anglais — côté interface propriétaire et côté client. Les **noms de plats/menus** restent tels que saisis (non traduits automatiquement).

**Que se passe-t-il si mon abonnement expire ?**
Le compte repasse aux limites du plan Starter jusqu'au renouvellement. Vos données ne sont pas supprimées.

---

*Pour l'installation technique en local (base de données, seed, variables d'environnement), voir `LOCAL_DEV.md`.*
