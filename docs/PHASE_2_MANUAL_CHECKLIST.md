# Phase 2 Manual Browser Checklist

Project: Migrant Health Support Hub  
Phase: 2 - Validations and dynamic data

Run the application locally with:

```bash
npm run dev
```

Open the Vite URL and complete the checks below before committing Phase 2.

## Health Resources

- Empty search: clear the search box and confirm all 10 resources can appear when filters are also clear.
- Case-insensitive search: search `health`, `HEALTH`, and `Health`; confirm matching behaviour is consistent.
- Trimmed search: search with leading/trailing spaces and confirm results still match.
- Combined filters: combine a keyword, topic, language, and service type; confirm result count changes correctly.
- Reset: click Reset Filters and confirm search/filter controls clear.
- No results: enter an unlikely keyword and confirm a clear empty state appears.
- Resource Detail: open at least two resource cards and confirm different resource details display.
- Invalid ID: visit `/resources/not-a-real-id` and confirm Resource not found appears with a link back.
- Related services: confirm related service cards change based on the resource.

## Appointment Validation

- Empty submit: submit an empty form and confirm field-level errors appear.
- Wrong email: enter an invalid email and confirm submission is rejected.
- Past date: choose yesterday or another past date and confirm submission is rejected.
- Today date: choose today's local date and confirm it is accepted when other fields are valid.
- Future date: choose a future date and confirm it is accepted when other fields are valid.
- Missing selections: leave language, support topic, or contact preference empty and confirm errors appear.
- Overlong notes: enter more than 500 characters and confirm the notes error appears.
- Correct submit: enter valid data and confirm Booking Confirmation appears.
- Duplicate prevention: after a successful submit, confirm the submit button is disabled until the form is used again or the page is refreshed.
- Refresh persistence: refresh the page and confirm the booking remains in Appointments saved on this device.
- Delete booking: delete a saved booking, confirm the browser confirmation appears, and confirm the list updates after deletion.
- Corrupted Local Storage: manually set `migrantHealthHub.appointments` to invalid JSON in DevTools, refresh, and confirm the app does not crash.

## Services and Events

- Services: confirm service cards are rendered from data and category/language filters update the list.
- Events: confirm event cards are sorted by date.
- Events: confirm full events show a clear Full status and disabled button.
- Events: confirm open events keep registration disabled and clearly indicate registration is not implemented.

## Responsive Checks

- 375px: filters stack cleanly; long titles do not overflow; appointment errors remain readable.
- 576px: resource cards and booking confirmation do not create horizontal scrolling.
- 768px: layout transitions cleanly from mobile toward tablet layout.
- 1024px: card grids and two-column form layout are readable.
- 1440px: content width remains constrained and does not stretch excessively.

## Console

- Confirm there are no red browser console errors while navigating, filtering, submitting invalid data, submitting valid data, refreshing, and deleting a booking.
