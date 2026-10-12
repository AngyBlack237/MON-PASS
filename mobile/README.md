# MON PASS Mobile — V1 architecture

Application Expo / React Native distincte du site Next.js. Les comptes, partenaires et offres utilisent le **Supabase existant**. Aucune table ni donnée de production n'est modifiée par cette architecture.

## Démarrer

1. Depuis `mobile/`, exécuter `npm install`.
2. Créer `.env` à partir de `.env.example` et renseigner uniquement l'URL Supabase et la clé publique (anon/publishable). Ne jamais mettre de clé service_role dans l'application.
3. Lancer `npx expo start` et ouvrir dans Expo Go ou un simulateur.

## État réel

- Base Expo Router, authentification Supabase et orientation client/partenaire/admin via le rôle en base.
- **Non encore implémentés :** catalogue natif, réservations, paiements, QR scanner, administration native et notifications.
- La sécurité des droits doit être appliquée côté Supabase (RLS/RPC), jamais uniquement par l'affichage du rôle.
- Aucune publication Android/iOS ni test de compilation confirmé à ce stade.
- Branche isolée `feature/mobile-v1-architecture` pour préserver la production web.
