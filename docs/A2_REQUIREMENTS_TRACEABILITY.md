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
| BR A.1 | Vue.js 3 development stack | Phase 1 implemented a Vue 3 SPA foundation using Vite, Vue Router 4, single-file components, and npm scripts. Installed versions verified: Vue `3.5.40`, Vue Router `4.6.4`, Vite `7.3.6`. | `package.json`, `package-lock.json`, `vite.config.js`, `index.html`, `src/main.js`, `src/App.vue`, `src/router/index.js`, `src/views/*.vue`, `src/components/*.vue` | `npm install` completed successfully; `npm run build` completed successfully after rerunning with permission for the Vite/esbuild child process; `npm list vue`; `npm list vue-router`. | Verified |
| BR A.2 | Responsive design | Phase 1 implemented responsive page structure, mobile navigation, card grids, form layouts, content width constraints, skip link, visible focus states, and breakpoint-specific CSS for small mobile through large desktop. Manual browser review is still required. | `src/assets/styles/main.css`, `src/assets/styles/base.css`, `src/assets/styles/layout.css`, `src/assets/styles/components.css`, `src/assets/styles/pages.css`, `src/assets/styles/responsive.css`, `src/App.vue`, `src/components/AppHeader.vue`, `src/views/*.vue` | `npm run build` completed successfully; manual checks documented in `docs/PHASE_1_MANUAL_CHECKLIST.md` for 375px, 576px, 768px, 1024px, and 1440px. | Implemented, pending manual verification |
| BR B.1 | At least two types of input validation | Phase 2 implemented appointment validation for required fields, email format, local-date rules, minimum name length, notes maximum length, and required select/radio choices. Errors display beside fields, use `aria-describedby` and `aria-invalid`, and the first invalid field receives focus on failed submit. | `src/utils/validation.js`, `src/utils/date.js`, `src/views/AppointmentView.vue`, `src/components/FormFieldError.vue` | `npm run build` passed; code-level validation check confirmed invalid email and past date are rejected; manual checks documented in `docs/PHASE_2_MANUAL_CHECKLIST.md`. | Verified |
| BR B.2 | Dynamic data from JavaScript structures, JSON, Vue state or binding | Phase 2 implemented JavaScript data modules for 10 health resources, 6 health services, and 6 health events; resource search and combined filters use Vue `ref`, `computed`, `v-model`, `v-for`, and dynamic route binding; appointment submissions are stored in Local Storage through a composable and utility wrapper. | `src/data/healthResources.js`, `src/data/healthServices.js`, `src/data/healthEvents.js`, `src/composables/useAppointments.js`, `src/utils/storage.js`, `src/views/ResourcesView.vue`, `src/views/ResourceDetailView.vue`, `src/views/ServicesView.vue`, `src/views/EventsView.vue`, `src/views/AppointmentView.vue`, `src/components/*.vue` | `npm run build` passed; `npm list vue`; `npm list vue-router`; code-level check confirmed 10 resources, working detail lookup, invalid ID handling path, combined filtering, and safe fallback for corrupted Local Storage JSON. | Verified |
| BR C.1 | Registration, login and multiple user accounts | Phase 3 implemented front-end coursework-demo registration, login, logout, multiple accounts, Local Storage session recovery, PBKDF2 password hashing with random salt, current user state, and user-linked appointments. | `src/stores/authStore.js`, `src/utils/password.js`, `src/utils/authValidation.js`, `src/utils/storage.js`, `src/views/RegisterView.vue`, `src/views/LoginView.vue`, `src/views/ProfileView.vue`, `src/views/AppointmentView.vue`, `src/components/AppHeader.vue` | `npm run build` passed; manual checks documented in `docs/PHASE_3_MANUAL_CHECKLIST.md`; code review required for `rg "password" src` output. | Implemented, pending manual verification |
| BR C.2 | At least two roles with page access control | Phase 3 implemented `user` and `admin` roles, route meta guards for `/profile`, `/appointments`, and `/admin`, `/unauthorized`, auth-aware header navigation, admin-only dashboard checks, user-only appointment visibility, and admin appointment status updates. | `src/router/index.js`, `src/stores/authStore.js`, `src/views/UnauthorizedView.vue`, `src/views/AdminDashboardView.vue`, `src/views/ProfileView.vue`, `src/components/AppHeader.vue`, `src/components/AdminUserList.vue`, `src/components/AdminAppointmentList.vue` | `npm run build` passed; manual role checks documented in `docs/PHASE_3_MANUAL_CHECKLIST.md`; direct URL checks required in browser. | Implemented, pending manual verification |
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
