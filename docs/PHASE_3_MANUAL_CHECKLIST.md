# Phase 3 Manual Browser Checklist

Project: Migrant Health Support Hub  
Phase: 3 - Authentication and role-based access

Run the application locally with:

```bash
npm run dev
```

## Registration

- Empty form: submit and confirm field-level errors.
- Wrong email: enter an invalid email and confirm it is rejected.
- Duplicate email: register an existing email with different casing and confirm it is rejected.
- Short password: confirm fewer than 8 characters is rejected.
- Missing uppercase: confirm password is rejected.
- Missing lowercase: confirm password is rejected.
- Missing number: confirm password is rejected.
- Password mismatch: confirm password confirmation is rejected.
- Missing acknowledgement: confirm checkbox error appears.
- Correct registration: confirm account is created and user is redirected to Profile.
- Local Storage: inspect `migrantHealthHub.users` and confirm no plain-text user password is stored.

## Login

- Unregistered email: confirm generic error message appears.
- Wrong password: confirm generic error message appears.
- Correct password: confirm login succeeds.
- Refresh: confirm session is restored after page refresh.
- Logout: confirm session is cleared and header returns to guest navigation.

## Multiple Users

- Create User A.
- Create User B.
- User A creates an appointment.
- User B creates an appointment.
- User A can only see User A appointments.
- User B can only see User B appointments.
- Confirm one user cannot delete another user's appointment.

## Role Access

- Guest visits `/profile`: redirects to `/login` with redirect query.
- Guest visits `/appointments`: redirects to `/login` with redirect query.
- Guest visits `/admin`: redirects to `/login` with redirect query.
- Standard user visits `/admin`: redirects to `/unauthorized`.
- Admin visits `/admin`: dashboard loads.
- Direct address-bar visits enforce the same route guards.
- Unauthorized page has a clear `h1` and links back to safe pages.

## Admin

- Login with `admin@migranthealthhub.demo` and `Admin123!`.
- Confirm statistics cards show users, appointments, resources, and events.
- Confirm user list displays fullName, email, role, createdAt, and active.
- Confirm user list does not display password, passwordHash, or passwordSalt.
- Confirm all appointments are listed.
- Confirm unlinked Phase 2 appointments display as `Unlinked demonstration appointment`.
- Update an appointment status.
- Logout admin, login as the appointment owner, and confirm the updated status is visible.

## Responsive

- 375px: Login/Register forms do not overflow.
- 576px: password error text remains readable.
- 768px: header login state does not crush navigation.
- 1024px: admin statistics cards wrap cleanly.
- 1440px: user and appointment lists remain readable and page width is constrained.

## Console

- Confirm there are no red uncaught console errors during registration, login, refresh, protected-route access, appointment creation, admin status update, and logout.
