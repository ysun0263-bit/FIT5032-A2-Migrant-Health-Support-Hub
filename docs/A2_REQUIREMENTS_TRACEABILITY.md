# FIT5032 Assessment 2 Requirements Traceability

Project: Migrant Health Support Hub  
Phase: 0 - Repository audit and project baseline  
Audit date: 2026-07-23

Phase 0 status meanings:

- Not started: no working implementation currently exists in the project folder.
- Existing: a working implementation already exists and was verified.
- Partially existing: some relevant implementation exists but is incomplete or unverified.
- Needs review: repository evidence is missing, unclear, or requires human confirmation.

| Requirement ID | Requirement description | Planned implementation | Planned source files | Verification method | Current status |
| --- | --- | --- | --- | --- | --- |
| BR A.1 | Vue.js 3 development stack | Build the application as a Vue 3 SPA using Vite, Vue Router, single-file components, and npm scripts. | `package.json`, `vite.config.js`, `src/main.js`, `src/App.vue`, `src/router/index.js`, `src/views/*.vue`, `src/components/*.vue` | Verify Vue version from `package.json`; run `npm install`; run `npm run build`. | Not started |
| BR A.2 | Responsive design | Implement mobile-first layouts for navigation, resource grids, forms, detail pages, and admin dashboard using defined breakpoints. | `src/assets/styles/main.css`, `src/App.vue`, `src/components/AppHeader.vue`, `src/views/*.vue` | Manual browser checks at mobile, tablet, and desktop widths; build verification. | Not started |
| BR B.1 | At least two types of input validation | Add required, email format, length, range, and future-date validation across registration, login, booking, and rating forms. | `src/utils/validation.js`, `src/views/RegisterView.vue`, `src/views/LoginView.vue`, `src/views/BookingView.vue`, `src/components/BookingForm.vue`, `src/components/RatingSummary.vue` | Manual form tests; unit tests if added; verify invalid input produces errors and blocks submission. | Not started |
| BR B.2 | Dynamic data from JavaScript structures, JSON, Vue state or binding | Use JavaScript data modules for resources, services, and events; use Vue state/computed bindings for search, filters, auth, bookings, and ratings. | `src/data/healthResources.js`, `src/data/localServices.js`, `src/data/healthEvents.js`, `src/stores/*.js`, `src/views/ResourcesView.vue`, `src/views/ResourceDetailView.vue` | Confirm rendered content comes from data structures; test search/filter state changes; run build. | Not started |
| BR C.1 | Registration, login and multiple user accounts | Implement account registration, login, logout, current user session, and support for multiple localStorage-backed accounts. | `src/stores/authStore.js`, `src/utils/storage.js`, `src/views/RegisterView.vue`, `src/views/LoginView.vue`, `src/views/AccountView.vue`, `src/components/AppHeader.vue` | Manual tests with at least two users; verify sessions persist/reload through localStorage. | Not started |
| BR C.2 | At least two roles with page access control | Implement `user` and `admin` roles; protect authenticated and admin-only routes with router guards and role-aware UI. | `src/router/index.js`, `src/stores/authStore.js`, `src/views/AdminDashboardView.vue`, `src/components/RoleGuardNotice.vue`, `src/components/AppHeader.vue` | Manual route access tests as guest, user, and admin; direct URL checks; run build. | Not started |
| BR C.3 | Aggregated rating scores | Store resource ratings and compute average rating score plus total count per resource. | `src/stores/ratingStore.js`, `src/components/RatingSummary.vue`, `src/views/ResourceDetailView.vue`, `src/data/healthResources.js` | Add multiple ratings and verify displayed average/count updates correctly. | Not started |
| BR C.4 | Basic security measures including XSS considerations | Avoid `v-html` for untrusted content; normalise and validate inputs; escape rendered user content through Vue interpolation; add route guards and session checks. | `src/utils/security.js`, `src/utils/validation.js`, `src/router/index.js`, `src/stores/authStore.js`, relevant form views/components | Manual XSS string checks; code search for `v-html`; route guard tests; build verification. | Not started |

## Current Repository Evidence

The current project directory does not contain source code, dependency manifests, lockfiles, or Git metadata. Because there is no existing application, no Assessment 2 requirement can be marked Existing or Complete at Phase 0.

## Planned Verification Commands

Once a Vue project manifest exists, the expected verification commands are:

```bash
npm install
npm run build
npm run lint
npm run test
```

Only commands present in `package.json` should be run. Commands should not be reported as passing unless they are executed successfully.
