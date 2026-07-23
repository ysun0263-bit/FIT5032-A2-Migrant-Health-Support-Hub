# Phase 1 Manual Browser Checklist

Project: Migrant Health Support Hub  
Phase: 1 - Vue 3/Vite foundation and responsive layout

Run the application locally with:

```bash
npm run dev
```

Then open the local Vite URL shown in the terminal and complete the checks below. Record any failures before moving to Phase 2.

## 375px Width

- Navigation: mobile menu button is visible and can open/close the menu.
- Navigation: menu button has a clear label and updates expanded state.
- Navigation: Escape closes the mobile menu.
- Navigation: clicking a link closes the mobile menu.
- Horizontal scrolling: no unnecessary horizontal scroll appears.
- Card layout: cards display in a single column.
- Form layout: fields use the available width and do not overflow.
- Text readability: headings, buttons, and body text remain readable.
- Page jumping: each route loads correctly.
- Footer: footer content stacks cleanly.
- Console errors: no browser console errors appear.

## 576px Width

- Navigation: mobile menu remains usable.
- Horizontal scrolling: no unnecessary horizontal scroll appears.
- Card layout: cards remain readable and aligned.
- Form layout: disabled fields remain full-width and readable.
- Text readability: text contrast and spacing remain clear.
- Page jumping: Home, Resources, Services, Appointments, Events, Login, Register, Profile, Admin, and a fake route all load.
- Footer: footer does not overflow.
- Console errors: no browser console errors appear.

## 768px Width

- Navigation: desktop navigation appears or mobile navigation transitions cleanly at the breakpoint.
- Horizontal scrolling: no unnecessary horizontal scroll appears.
- Card layout: cards adapt without overlap.
- Form layout: fields align cleanly.
- Text readability: line lengths remain comfortable.
- Page jumping: route transitions work through navigation and direct URLs.
- Footer: footer remains readable.
- Console errors: no browser console errors appear.

## 1024px Width

- Navigation: desktop navigation shows Home, Health Resources, Find Services, Appointments, Events, and Login.
- Navigation: current page state is visible.
- Horizontal scrolling: no unnecessary horizontal scroll appears.
- Card layout: multi-column grids display correctly.
- Form layout: two-column form layout appears where appropriate.
- Text readability: content width remains constrained.
- Page jumping: all configured routes load.
- Footer: footer uses desktop layout cleanly.
- Console errors: no browser console errors appear.

## 1440px Width

- Navigation: desktop navigation remains aligned and readable.
- Horizontal scrolling: no unnecessary horizontal scroll appears.
- Card layout: grid content does not look excessively stretched.
- Form layout: forms remain constrained rather than expanding indefinitely.
- Text readability: paragraphs do not become too wide.
- Page jumping: all routes remain accessible.
- Footer: footer content is balanced and not overly stretched.
- Console errors: no browser console errors appear.

## Accessibility Spot Checks

- Skip to main content link appears on keyboard focus.
- Each page has one visible main `h1`.
- Forms have visible labels.
- Buttons are real `button` elements where actions are placeholders.
- Navigation links are keyboard accessible.
- Focus styles are visible on links, buttons, and fields.
- Decorative visual elements do not add unnecessary screen-reader content.
