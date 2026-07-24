# Demo Accounts

Project: Migrant Health Support Hub  
Phase: 3 - Authentication and role-based access

## Demo Administrator

Email: `admin@migranthealthhub.demo`  
Password: `Admin123!`  
Role: `admin`

This account is seeded automatically on first application load if it does not already exist in `migrantHealthHub.users`.

## Important Notes

- This account is only for FIT5032 coursework demonstration.
- It is not a production account.
- Do not use it for real personal data.
- The fixed credential is included in the front-end application for demonstration, so it cannot be truly secret.
- The password is stored in Local Storage only as PBKDF2 hash plus random salt after seeding.
- Local Storage can be inspected or modified by someone with access to the browser/device.
