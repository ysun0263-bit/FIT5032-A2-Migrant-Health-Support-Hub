# Migrant Health Support Hub

FIT5032 Assessment 3 web application

Student: Yilian Sun

Student ID: 36667382

Production: https://fit5032-a3-migrant-health-hub.web.app

## Local setup

1. Run `npm install` and `npm --prefix functions install`.
2. Copy `.env.example` to `.env.local` and provide the Firebase web configuration and Mapbox public token. Do not commit `.env.local`.
3. Run `npm run dev`.

## Verification

- `npm run test:unit`
- `npm --prefix functions test`
- `npm run build`

Firestore Rules and realtime emulator tests additionally require Java and use the scripts defined in `package.json`.
