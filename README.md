# Contractor Management System

A browser-based contract dashboard for an electrical contractor business. It tracks the company that hired you, tender value, payments received, outstanding balance, and project duration.

## Current App

- `index.html` - live dashboard entry point.

Open `index.html` in a browser to use the app.

## Version History

- `versions/v1-basic-contract-calculator.html` - first working calculator with company, tender amount, amount paid, balance, and project duration.
- `index.html` - upgraded contractor management dashboard with filters, payment register, CSV export, print reports, project statuses, and richer summaries.
- `manifest.webmanifest` and `service-worker.js` - mobile install and offline support.

GitHub commits show the technical version history. The `versions/` folder keeps visitor-friendly snapshots.

## Main Features

- Track multiple client companies and contracts.
- Record tender totals and payment history.
- Calculate outstanding balances automatically.
- Show project duration from start and end dates.
- Mark projects as active, completed, on hold, paid, or overdue.
- Search, filter, and sort contracts.
- Export contract data to CSV.
- Print a clean contract report.
- Install on a phone as a mobile web app.
- Cache app files for offline use after the first load.
- Includes example electrical business contracts.

## Data Storage

The app stores data in the browser using `localStorage`. It works without a backend server, but saved data stays on the browser and device where it was entered.

## Mobile Use

Open the app on a phone browser and add it to the home screen. After the first load, the service worker caches the app shell so the calculator can reopen offline on the same device.

## Project Goal

The goal is to grow this into a practical contractor management system for small electrical businesses that need a simple way to monitor contracts, payments, and project progress.
