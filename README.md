

## MangeQR

- Web app streamlining restaurants daily activities.....

## Tech/framework used

- Next.js 14
- Shadcn/ui
- NextAuth.js v5 / Auth.js
- TypeScript
- PostgreSQL
- Neon
- Prisma
- React Email
- Resend

## Starting the project

Open the [.env.example](/.env.example) and fill in your Prisma, Auth & Resend Configurations then save it as .env the run the following command:

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```
# mangeqr-v2
# mangeqr-final

## Gestion des plans (paiement en espèces / v2)

En v2, il n'y a pas d'interface de paiement (Stripe est hors périmètre). Les
plans payants sont attribués **manuellement** (paiement en espèces / hors
ligne), soit directement en base de données, soit via l'action serveur
réservée aux administrateurs.

### Champs concernés (modèle `User`)

- `plan` : le plan de l'utilisateur — `STARTER`, `PRO` ou `PREMIUM`.
- `planPaymentMethod` : le mode de paiement — `CASH` (espèces / hors ligne) ou
  `ONLINE`.
- `planRenewsAt` : la date d'expiration du plan. `null` = pas d'expiration.

> ⚠️ Utilisez impérativement les valeurs d'énumération **en majuscules**
> (`STARTER`, `PRO`, `PREMIUM`, `CASH`, `ONLINE`), telles que définies par les
> enums Prisma.

### Modifier un plan directement en base (méthode principale v2)

La table s'appelle `"User"` et les colonnes utilisent la casse PascalCase
entre guillemets (mapping Prisma par défaut). Exemple : passer un client au
plan `PRO` en espèces, expirant dans un an :

```sql
UPDATE "User"
SET "plan" = 'PRO',
    "planPaymentMethod" = 'CASH',
    "planRenewsAt" = NOW() + INTERVAL '1 year'
WHERE "email" = 'client@example.com';
```

Pour un plan gratuit sans expiration :

```sql
UPDATE "User"
SET "plan" = 'STARTER',
    "planPaymentMethod" = 'CASH',
    "planRenewsAt" = NULL
WHERE "email" = 'client@example.com';
```

### Expiration automatique

L'expiration est appliquée par `getEffectivePlan` (`lib/plan.ts`) : dès que
`planRenewsAt` est dans le passé, un plan payant est traité comme `STARTER`
pour les limites (nombre de restaurants, menus, campagnes...). Il n'est donc
pas nécessaire de repasser manuellement le plan à `STARTER` à l'expiration.

### Alternative programmatique (ADMIN)

L'action serveur `adminSetPlan` (`actions/admin-set-plan.ts`) permet à un
utilisateur ayant le rôle `ADMIN` de définir le plan, le mode de paiement et
la date d'expiration d'un utilisateur. Elle valide l'entrée avec
`AdminSetPlanSchema` (`schemas/index.ts`) et vérifie le rôle `ADMIN` avant
toute modification. Elle peut être appelée depuis un futur formulaire
d'administration.
