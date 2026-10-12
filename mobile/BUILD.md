# Compiler MON PASS Mobile

Le projet Expo EAS est relié à `865b0def-40d4-4dab-9f5c-672bac9df4d3` dans `app.json`.

## Pré-requis

- Une copie du dépôt GitHub, branche `feature/mobile-v1-architecture`.
- Node.js et npm fonctionnels sur le poste ou un environnement de build CI compatible.
- Compte Expo avec accès au projet MON PASS.
- Variables `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_ANON_KEY` renseignées dans les variables EAS (valeurs publiques uniquement).

## Commandes (dans le dossier `mobile`)

```sh
npm install
npx expo install --fix
npx expo-doctor
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview
```

Le profil `preview` produit un APK Android pour installation interne. Une compilation iOS de distribution exige une configuration Apple adaptée et, pour TestFlight, un compte Apple Developer.

**Ne pas lancer** `create-expo-app` : le projet est déjà créé. Ne pas exécuter `eas init` à nouveau : l'ID Expo est déjà dans `app.json`.

## Limites

Aucune compilation ni installation n'a encore été vérifiée. Les fonctionnalités de paiement et QR ne sont pas prêtes pour un usage réel. Les permissions d'accès doivent être validées par les politiques Supabase avant toute publication.
