# Phase 4 Manual Checklist

Run the app with:

```bash
npm run dev
```

## Rating

- Guest can view rating summary and distribution.
- Guest cannot submit a rating.
- Login to rate link redirects back to the resource detail page.
- User A rates Resource 1 as 4.
- Average score updates.
- Rating count updates.
- User A changes Resource 1 rating to 2.
- Rating count remains 1.
- User B rates the same resource as 4.
- Average becomes 3.0.
- Resource 2 rating summary is unaffected.
- Refresh and confirm ratings persist.
- Rating distribution counts are correct.
- Invalid scores such as 0, 6, 2.5, and script strings are rejected.
- Invalid resource rating submission is rejected.
- Corrupted `migrantHealthHub.ratings` JSON does not crash the app.

## Security

- XSS strings display as text or are rejected and do not execute.
- Local Storage contains no ordinary user plain-text password.
- Session contains no password, hash, salt, or role.
- Standard user cannot access `/admin`.
- Guest cannot submit ratings.
- User A cannot delete User B appointment.
- User A cannot modify User B rating.
- Admin appointment status update still checks admin role.
- Corrupted session does not white-screen the app.
- Invalid session is cleared.
- No API key or private token is present.
- Console does not output passwords or hashes.
- CSP does not break the app.
- `npm run build` succeeds.

## Responsive

- 375px: rating input and distribution do not overflow.
- 576px: resource cards with ratings remain readable.
- 768px: rating panels align cleanly.
- 1024px: admin rating stats wrap cleanly.
- 1440px: page content remains constrained.

## Console

- Confirm there are no red uncaught console errors while rating, updating ratings, logging in/out, and using admin status controls.
