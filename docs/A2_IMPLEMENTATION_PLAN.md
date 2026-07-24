# FIT5032 Assessment 2 Implementation Plan

Project: Migrant Health Support Hub  
Phase: 0 - Repository audit and project baseline  
Audit date: 2026-07-23

## 1. Current Repository Baseline

### Repository path

`C:\Users\ROG\Desktop\FIT5032\FIT5032-A2-Migrant-Health-Support-Hub`

### Git baseline

- Git repository present: No
- Current branch: Not available because `.git` is not present
- Git status command result: `fatal: not a git repository (or any of the parent directories): .git`
- No Git repository was initialised during Phase 0.
- No Git history was altered.
- No commits were created.

### Current framework and Vue version

- Framework: Not started / not detectable
- Vue version: Not started / not detectable
- Reason: no `package.json`, lockfile, `src` directory, or Vue configuration files currently exist in the project folder.

### Package manager

- Package manager: Not detectable
- Evidence checked: no `package-lock.json`, `npm-shrinkwrap.json`, `yarn.lock`, `pnpm-lock.yaml`, or `bun.lockb` exists.
- Phase 0 decision: do not run package installation because there is no existing package manager or project manifest to install from.

### Project structure

Current project structure after Phase 0 documentation:

```text
FIT5032-A2-Migrant-Health-Support-Hub/
└── docs/
    ├── A2_IMPLEMENTATION_PLAN.md
    └── A2_REQUIREMENTS_TRACEABILITY.md
```

### Existing pages and components

- Existing pages: None found
- Existing components: None found
- Existing application source directory: None found

### Current router setup

- Vue Router setup: None found
- No `router`, `routes`, `main.js`, `main.ts`, `App.vue`, or equivalent entry file exists yet.

### Existing styling framework

- Styling framework: None found
- No CSS framework, Tailwind configuration, Bootstrap dependency, design system, or global stylesheet exists yet.

### Current data storage approach

- Current data storage approach: None found
- No JavaScript data modules, JSON files, Vue state, API layer, localStorage usage, or backend persistence exists yet.

### Existing build, lint, and test commands

- Build command: Not available
- Lint command: Not available
- Test command: Not available
- Reason: no `package.json` scripts currently exist.

### Verification command baseline

The following checks were performed:

| Command | Result | Notes |
| --- | --- | --- |
| `Get-ChildItem -Force` | Passed | Confirmed the project folder initially contained no files. |
| `rg --files` | No files found | Exited with code 1 because there were no searchable files. |
| `git status --short --branch` | Failed as expected | The folder is not currently a Git repository. |

`npm install`, `npm run build`, `npm run lint`, and `npm run test` were not run because no `package.json` exists. Running `npm install` in an empty folder would create new project metadata and would violate the Phase 0 constraint to avoid starting implementation.

## 2. Proposed Architecture

The Assessment 2 implementation should use a Vue 3 single page application. A conservative architecture is recommended because the assignment requirements can be met without a backend service.

Recommended stack:

- Vue 3
- Vite
- Vue Router
- Plain CSS or a small utility-focused styling approach
- Local JavaScript modules and/or JSON-style arrays for seed data
- Browser `localStorage` for user accounts, sessions, bookings, and ratings during the assignment

Proposed source structure:

```text
src/
├── App.vue
├── main.js
├── router/
│   └── index.js
├── assets/
│   └── styles/
│       └── main.css
├── components/
│   ├── AppHeader.vue
│   ├── AppFooter.vue
│   ├── ResourceCard.vue
│   ├── ServiceCard.vue
│   ├── EventCard.vue
│   ├── RatingSummary.vue
│   ├── BookingForm.vue
│   ├── FormField.vue
│   └── RoleGuardNotice.vue
├── data/
│   ├── healthResources.js
│   ├── localServices.js
│   └── healthEvents.js
├── stores/
│   ├── authStore.js
│   ├── bookingStore.js
│   └── ratingStore.js
├── utils/
│   ├── validation.js
│   ├── storage.js
│   └── security.js
└── views/
    ├── HomeView.vue
    ├── ResourcesView.vue
    ├── ResourceDetailView.vue
    ├── ServicesView.vue
    ├── EventsView.vue
    ├── BookingView.vue
    ├── LoginView.vue
    ├── RegisterView.vue
    ├── AccountView.vue
    ├── AdminDashboardView.vue
    └── NotFoundView.vue
```

## 3. Proposed Vue Pages

| Page | Purpose |
| --- | --- |
| Home | Introduce the Migrant Health Support Hub and provide entry points to resources, services, events, and booking. |
| Resources | Search and filter health resources for migrant communities in Australia. |
| Resource Detail | Display full resource information, multilingual/access notes, related services, and rating summary. |
| Services | List local health and support services. |
| Events | Show community health events and workshops. |
| Booking | Allow authenticated users to request an appointment. |
| Login | Authenticate existing users. |
| Register | Create user accounts. |
| Account | Show current user profile and user-specific bookings. |
| Admin Dashboard | Role-protected admin area for viewing aggregate users, bookings, resources, and ratings. |
| Not Found | Catch invalid routes. |

## 4. Proposed Reusable Components

| Component | Purpose |
| --- | --- |
| `AppHeader.vue` | Navigation, authentication state, and role-aware links. |
| `AppFooter.vue` | Contact, acknowledgement, and project footer content. |
| `ResourceCard.vue` | Reusable summary display for health resources. |
| `ServiceCard.vue` | Reusable local service listing. |
| `EventCard.vue` | Reusable event listing. |
| `RatingSummary.vue` | Display aggregated average score and rating count. |
| `BookingForm.vue` | Appointment request form with validation. |
| `FormField.vue` | Shared label, input, error, and help-text pattern. |
| `RoleGuardNotice.vue` | Clear access-denied message for protected routes. |

## 5. Proposed Data Structures

### Health resources

```js
{
  id: "resource-medicare-basics",
  title: "Medicare basics for new arrivals",
  category: "Health system navigation",
  languages: ["English", "Arabic", "Mandarin"],
  summary: "Plain-language guide to accessing Medicare and basic care.",
  body: "Detailed resource content...",
  tags: ["medicare", "primary care", "new arrivals"],
  serviceIds: ["service-community-health-01"]
}
```

### Local services

```js
{
  id: "service-community-health-01",
  name: "Community Health Access Centre",
  suburb: "Clayton",
  state: "VIC",
  phone: "03 0000 0000",
  languages: ["English", "Mandarin"],
  categories: ["GP referral", "Mental health", "Interpreter support"],
  website: "https://example.org"
}
```

### Events

```js
{
  id: "event-health-navigation-workshop",
  title: "Health system navigation workshop",
  date: "2026-08-15",
  location: "Monash community venue",
  capacity: 30,
  language: "English with interpreter support",
  description: "Workshop for new migrants learning how to access care."
}
```

### Users

```js
{
  id: "user-001",
  name: "Example User",
  email: "user@example.com",
  role: "user",
  passwordHash: "assignment-demo-hash",
  createdAt: "2026-07-23T00:00:00.000Z"
}
```

### Bookings

```js
{
  id: "booking-001",
  userId: "user-001",
  serviceId: "service-community-health-01",
  preferredDate: "2026-08-20",
  preferredTime: "10:30",
  reason: "Help understanding local GP options",
  status: "requested",
  createdAt: "2026-07-23T00:00:00.000Z"
}
```

### Ratings

```js
{
  id: "rating-001",
  resourceId: "resource-medicare-basics",
  userId: "user-001",
  score: 4,
  comment: "Helpful and easy to understand.",
  createdAt: "2026-07-23T00:00:00.000Z"
}
```

## 6. Proposed Local Storage Keys

| Key | Purpose |
| --- | --- |
| `migrantHub.users` | Registered user and admin accounts. |
| `migrantHub.currentUser` | Current authenticated session metadata. |
| `migrantHub.bookings` | Appointment booking requests. |
| `migrantHub.ratings` | User-submitted ratings for resources. |
| `migrantHub.preferences` | Optional UI preferences such as language or saved filters. |

## 7. Planned Authentication and Role Model

Planned roles:

- `user`: can browse resources, view details, book appointments, rate resources, and view their own account.
- `admin`: can access all user features plus the admin dashboard.

Planned access control:

- Public routes: home, resources, resource detail, services, events, login, register.
- Authenticated routes: booking, account.
- Admin-only routes: admin dashboard.

Security notes for assignment scope:

- Validate and normalise all user input before storing it.
- Escape or render user content through Vue text interpolation rather than `v-html`.
- Avoid storing raw passwords where practical for the assignment; if a full cryptographic implementation is out of scope, clearly label any demo hashing approach and do not claim production-grade authentication.
- Prevent direct admin page access through router guards and in-view role checks.

## 8. Planned Rating Data Model

Ratings should be stored per resource and per user. Aggregation should be computed from the ratings array:

- Average score: sum of scores divided by number of ratings.
- Rating count: number of ratings for the resource.
- User restriction: one rating per user per resource, or allow updates to the user's existing rating.

The UI should display both the average score and the count so BR C.3 is visibly demonstrable.

## 9. Planned Validation Rules

At least two validation types are required. Planned validation should include:

| Validation type | Planned examples |
| --- | --- |
| Required field validation | Name, email, password, booking date, booking reason. |
| Format validation | Email format, phone number format where applicable. |
| Length validation | Minimum password length, maximum booking reason/comment length. |
| Range validation | Rating score must be from 1 to 5. |
| Date validation | Booking date must not be in the past. |

Validation should be implemented in shared utility functions where possible and surfaced with accessible inline error messages.

## 10. Planned Responsive Breakpoints

Recommended breakpoints:

| Breakpoint | Width | Layout intent |
| --- | --- | --- |
| Small mobile | `< 480px` | Single-column layout, compact navigation, full-width form controls. |
| Large mobile | `480px - 767px` | Single-column layout with improved spacing. |
| Tablet | `768px - 1023px` | Two-column cards where appropriate, expanded navigation. |
| Desktop | `>= 1024px` | Multi-column resource/service grids and dashboard summaries. |

Implementation should use responsive CSS and avoid fixed-width layouts that break on mobile.

## 11. Phased Implementation Plan

### Phase 0 - Repository audit and project baseline

- Inspect repository state.
- Document baseline, risks, and proposed implementation.
- Create implementation plan and traceability documents.
- Do not implement application features.

### Phase 1 - Vue project scaffold

- Add Vue 3 and Vite using the chosen package manager.
- Create base app shell, router, and global styles.
- Implement responsive layout foundation.

### Phase 2 - Public resource experience

- Add seed data for resources, services, and events.
- Build home, resources, details, services, and events pages.
- Add search/filter behavior using Vue state and bindings.

### Phase 3 - Validation and appointment form UI

- Add reusable validation helpers.
- Build appointment form UI and validation messages.
- Defer persistent appointment storage until the appropriate implementation phase.

### Phase 4 - Authentication and roles

- Implement registration, login, logout, and multiple accounts.
- Add user/admin roles.
- Add router guards and role-aware navigation.

### Phase 5 - Booking persistence and account view

- Store appointment booking requests.
- Show current user's bookings.
- Validate date, required fields, and reason length.

### Phase 6 - Ratings

- Implement rating submission.
- Store ratings and compute aggregated average score and count.
- Display rating summaries on resource details.

### Phase 7 - Admin dashboard

- Build admin-only dashboard.
- Show aggregated resource, user, booking, and rating information.
- Verify page access control.

### Phase 8 - Security, accessibility, and final verification

- Review XSS exposure.
- Confirm no `v-html` is used for untrusted content.
- Run build, lint, and test commands.
- Perform responsive manual checks.

## 12. Feature Mapping to BR A.1 Through C.4

| Requirement | Planned feature coverage |
| --- | --- |
| BR A.1 Vue.js 3 development stack | Implement app with Vue 3, Vite, Vue Router, and component-based views. |
| BR A.2 Responsive design | Use mobile-first CSS, defined breakpoints, responsive navigation, cards, forms, and dashboard layout. |
| BR B.1 At least two types of input validation | Add required, format, length, range, and date validation across registration, login, booking, and ratings. |
| BR B.2 Dynamic data from JavaScript structures, JSON, Vue state or binding | Use seed data modules, Vue reactive state, search/filter bindings, localStorage-backed stores, and computed aggregates. |
| BR C.1 Registration, login and multiple user accounts | Implement localStorage-backed account creation, login, logout, current session state, and account page. |
| BR C.2 At least two roles with page access control | Implement `user` and `admin` roles with router guards and admin-only dashboard access. |
| BR C.3 Aggregated rating scores | Store ratings per resource and compute average score plus count. |
| BR C.4 Basic security measures including XSS considerations | Use Vue text interpolation, input sanitisation/normalisation, route guards, session checks, and avoid rendering untrusted HTML. |

## 13. Phase 0 Notes

- The current project folder does not yet contain the Assessment 1 implementation or any Vue project files.
- Before Phase 1, confirm whether the existing Assessment 1 files are located elsewhere and should be copied into this folder by the student.
- If this empty folder is intentional, Phase 1 can begin from a clean Vue 3 scaffold after human review.

## 14. Phase 1 Actual Implementation Baseline

Phase 1 established the Vue application foundation without implementing later-stage business features such as authentication, role guards, appointment persistence, dynamic search, Local Storage bookings, or aggregated ratings.

Actual technical choices:

- Package manager: npm
- Vue: `3.5.40`
- Vite: `7.3.6`
- Vue Router: `4.6.4`
- Language: JavaScript, not TypeScript
- Styling approach: custom modular CSS split across `base.css`, `layout.css`, `components.css`, `pages.css`, and `responsive.css`
- Build command: `npm run build`
- Lint command: not configured in Phase 1
- Test command: not configured in Phase 1

Actual Phase 1 project structure:

```text
FIT5032-A2-Migrant-Health-Support-Hub/
├── docs/
│   ├── A2_IMPLEMENTATION_PLAN.md
│   ├── A2_REQUIREMENTS_TRACEABILITY.md
│   └── PHASE_1_MANUAL_CHECKLIST.md
├── public/
│   └── site-icon.svg
├── src/
│   ├── App.vue
│   ├── main.js
│   ├── assets/styles/
│   ├── components/
│   ├── router/
│   └── views/
├── index.html
├── package.json
├── package-lock.json
└── vite.config.js
```

Actual Phase 1 routes:

| Path | View |
| --- | --- |
| `/` | `HomeView.vue` |
| `/resources` | `ResourcesView.vue` |
| `/resources/:id` | `ResourceDetailView.vue` |
| `/services` | `ServicesView.vue` |
| `/appointments` | `AppointmentView.vue` |
| `/events` | `EventsView.vue` |
| `/login` | `LoginView.vue` |
| `/register` | `RegisterView.vue` |
| `/profile` | `ProfileView.vue` |
| `/admin` | `AdminDashboardView.vue` |
| `/:pathMatch(.*)*` | `NotFoundView.vue` |

Actual reusable components:

- `AppHeader.vue`
- `AppFooter.vue`
- `PageHero.vue`
- `FeatureCard.vue`
- `SectionHeading.vue`
- `PlaceholderNotice.vue`

Actual responsive approach:

- Mobile navigation is available below `768px` with `aria-label`, `aria-expanded`, keyboard-accessible links, automatic close on link click, and Escape-key close behavior.
- Card grids collapse from three columns to two columns below `992px`, then one column below `768px`.
- Forms collapse to one column below `768px`.
- Content uses constrained max widths so large screens do not stretch text indefinitely.
- Additional breakpoint handling is included for below `576px`, `768px`, `992px`, `1200px`, and above `1400px`.

Phase 1 verification:

| Command | Result |
| --- | --- |
| `npm install` | Passed after rerunning with network permission; installed 37 packages and reported 0 vulnerabilities. |
| `npm run build` | First run failed with `Error: spawn EPERM` from the Vite/esbuild child process; rerun with permission passed. |
| `npm list vue` | Passed; verified Vue `3.5.40`. |
| `npm list vue-router` | Passed; verified Vue Router `4.6.4`. |
| `git status --short` | To be checked at Phase 1 handoff. |

## 15. Phase 2 Actual Implementation Baseline

Phase 2 implemented BR B.1 validation and BR B.2 dynamic data/data structures. It did not implement full authentication, role-based access control, aggregated ratings, Firebase, backend storage, maps, email delivery, or later assignment categories.

Actual data files:

- `src/data/healthResources.js`: 10 original demonstration health resources for migrant communities in Australia.
- `src/data/healthServices.js`: 6 original demonstration services with category, suburb, languages, contact type, and availability.
- `src/data/healthEvents.js`: 6 original demonstration events with date, time, location, language, capacity, and registration status.

Actual utility and composable files:

- `src/utils/date.js`: local date formatting and past-date comparison without relying on UTC `toISOString()` splitting for validation.
- `src/utils/validation.js`: appointment form validation rules.
- `src/utils/storage.js`: Local Storage read/write wrapper with safe fallback for missing or corrupted JSON.
- `src/utils/ids.js`: booking ID helper using `crypto.randomUUID()` with a fallback.
- `src/composables/useAppointments.js`: appointment state, Local Storage persistence, add, delete, and reload functions.

Actual Local Storage key:

| Key | Purpose |
| --- | --- |
| `migrantHealthHub.appointments` | Stores demonstration appointment requests saved on the current browser/device only. |

Actual appointment data structure:

```js
{
  id: "booking-...",
  userId: null,
  fullName: "Example User",
  email: "user@example.com",
  preferredLanguage: "English",
  supportTopic: "Finding a GP",
  preferredDate: "2026-08-20",
  preferredTime: "10:00",
  contactPreference: "Email",
  notes: "Optional demonstration note",
  status: "pending",
  createdAt: "2026-07-23T00:00:00.000Z"
}
```

The `userId` field is intentionally `null` in Phase 2 so Phase 3 can connect appointments to real authenticated users without changing the appointment shape.

Actual validation rules:

- `fullName`: required after trim; minimum 2 characters.
- `email`: required after trim; must match a reasonable email format.
- `preferredLanguage`: required selection.
- `supportTopic`: required selection.
- `preferredDate`: required; cannot be earlier than the user's local current date; today is allowed.
- `preferredTime`: required.
- `contactPreference`: required radio selection.
- `notes`: optional; trim-aware; maximum 500 characters.

Actual search and filter design:

- Health resource keyword search checks `title`, `summary`, and `topic`.
- Search input is trimmed and case-insensitive.
- Topic, language, and service type filters can be combined.
- Results update immediately through Vue computed state.
- The page displays current result count and total count.
- A Reset Filters button clears search and all filters.
- Empty state appears when no resources match.
- Resource cards link to `/resources/:id` using the real resource ID.
- Resource detail uses `route.params.id`; invalid IDs show a clear Resource not found state.
- Related services are matched from service data by `relatedServiceIds`.

Phase 2 verification:

| Command/check | Result |
| --- | --- |
| `npm install` | Passed; dependencies already up to date; 0 vulnerabilities. |
| `npm run build` | First sandbox run failed with `Error: spawn EPERM`; rerun with permission passed. Final rerun passed. |
| `npm list vue` | Passed; Vue `3.5.40`. |
| `npm list vue-router` | Passed; Vue Router `4.6.4`. |
| `rg "v-html|innerHTML" src` | No source matches. |
| `rg "localStorage" src` | Local Storage usage is centralised in `src/utils/storage.js`. |
| Code-level logic check | Confirmed 10 resources, combined filtering, detail lookup, invalid detail lookup, invalid email rejection, past-date rejection, and corrupted Local Storage JSON fallback. |

## 16. Phase 3 Actual Implementation Baseline

Phase 3 implemented BR C.1 authentication and BR C.2 role-based access control for the front-end coursework demo. It does not claim production-grade security and does not implement aggregated ratings or the full C.4 security reflection.

### User data structure

```js
{
  id: "user-...",
  fullName: "Example User",
  email: "user@example.com",
  passwordHash: "...",
  passwordSalt: "...",
  role: "user",
  createdAt: "2026-07-23T00:00:00.000Z",
  active: true
}
```

Plain-text passwords are not stored. `passwordHash` and `passwordSalt` are stored in Local Storage because this is a browser-only coursework demo.

### Session data structure

```js
{
  userId: "user-...",
  createdAt: "2026-07-23T00:00:00.000Z"
}
```

The session does not store password, role, hash, or salt. The current role is read from `migrantHealthHub.users`.

### Password hash approach

- File: `src/utils/password.js`
- API: browser Web Crypto
- Algorithm: PBKDF2
- Hash: SHA-256
- Iterations: `120000`
- Salt: random 16-byte salt encoded as Base64
- Stored values: `passwordHash` and `passwordSalt`
- If Web Crypto is unavailable, registration/login hashing fails with a clear error rather than falling back to plain text.

### Local Storage keys

| Key | Purpose |
| --- | --- |
| `migrantHealthHub.users` | Demo user and admin accounts. |
| `migrantHealthHub.session` | Current browser session with `userId` only. |
| `migrantHealthHub.appointments` | Appointment requests, now linked to `userId` for new bookings. |

### User and admin permissions

| Role | Allowed | Restricted |
| --- | --- | --- |
| Guest | Home, resources, resource detail, services, events, login, register | Profile, appointments, admin dashboard |
| User | Guest pages, profile, create/view/delete own appointments | Admin dashboard, other users' appointments |
| Admin | Public pages, admin dashboard, all users list, all appointments list, appointment status updates | Password/hash/salt display or password modification |

### Route guard design

- `/profile`: `meta.requiresAuth`
- `/appointments`: `meta.requiresAuth`
- `/admin`: `meta.requiresAuth` and `meta.roles = ["admin"]`
- `/unauthorized`: friendly access-denied page
- Guests visiting protected routes redirect to `/login?redirect=...`
- Logged-in users visiting `/login` or `/register` redirect to `/profile` or `/admin`
- Standard users visiting `/admin` redirect to `/unauthorized`

### Appointment userId connection

- New appointments use `userId: currentUser.id`.
- `fullName` and `email` are prefilled from the current user but remain editable for appointment contact details.
- The trusted owner link comes from auth state, not form input.
- Standard users only see appointments where `appointment.userId === currentUser.id`.
- Delete operations re-check `userId` in the composable, not only through UI hiding.
- Phase 2 appointments with `userId: null` are preserved. Standard users do not see them by default. Admin Dashboard displays them as `Unlinked demonstration appointment`.

### Admin Dashboard

The admin dashboard now displays:

- Total users
- Standard users
- Admin users
- Total appointments
- Pending appointments
- Confirmed appointments
- Completed appointments
- Total resources
- Total events
- User list without password fields
- Appointment list with status update to `pending`, `confirmed`, `completed`, or `cancelled`

### Front-end authentication limitations

This authentication system is only for FIT5032 coursework demonstration. Accounts, hashes, salts, sessions, and appointments are stored in the current browser's Local Storage. A person with local device/browser access can inspect or modify Local Storage. This must be discussed in the later security reflection.
