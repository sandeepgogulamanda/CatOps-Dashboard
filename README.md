# CatOps

CatOps is a modern Angular dashboard for managing a cat roster with a polished UI, dark mode, quick stats, animated cards, and API-backed CRUD flows.

## Highlights

- Angular 18 standalone app with SCSS styling
- Responsive dashboard layout with sidebar insights
- Light and dark mode experience
- Infinite-scroll style rendering that shows 4 cat cards at a time
- Cat-themed card styling, gradients, and micro-interactions
- API integration for list, filtered list by IDs, create, update, and delete

## Tech Stack

- Angular 18
- Angular Material
- RxJS
- SCSS

## Getting Started

### Prerequisites

- Node.js 18+ recommended
- npm

### Install

```bash
npm install
```

### Run locally

```bash
npm start
```

The app runs on `http://localhost:4200/`.

### Production build

```bash
npm run build
```

Build output is generated in `dist/naya-practice`.

## API Notes

The frontend uses a proxy config in [proxy.conf.json](./proxy.conf.json) during local development.

Configured routes:

- `GET /api/list`
- `GET /api/list?id=...`
- `POST /api/create`
- `PUT /api/update?id=...`
- `DELETE /api/delete?id=...`

The current UI uses all available endpoints:

- Initial data load uses the list endpoint
- Visible card batches are refreshed through the list-by-IDs endpoint
- Add Cat uses create
- Edit uses update
- Delete uses delete

## Project Structure

```text
src/
  app/
    features/cats/
      components/
      data-access/
      models/
      pages/
```

## UI Features

- Premium gradient header with theme toggle
- Dark mode for the main application surfaces
- Animated cat cards with richer hover states
- Warm cat-inspired card palette
- Quick stats and roster summary side panels
- Custom CatOps favicon

## Public Repo Delivery Notes

This repo is suitable for public delivery with a few practical notes:

- No obvious secrets or API keys are committed in source files
- `node_modules` and `dist` are ignored by git
- The current proxy target points to a public AWS API Gateway URL
- Build passes successfully

Current known warnings:

- Angular production build shows bundle budget warnings
- One component stylesheet is above the warning budget, but below the error budget

## Suggested GitHub Repo Setup

Recommended repository name:

- `catops-dashboard`

Suggested short description:

- `Modern Angular cat management dashboard with animated UI, dark mode, and API-backed CRUD flows.`

Suggested topics:

- `angular`
- `angular-material`
- `dashboard`
- `scss`
- `rxjs`
- `frontend`
- `crud`

## Screenshots

Add screenshots of:

- Light mode dashboard
- Dark mode dashboard
- Add/Edit dialog

## License

If you want others to reuse this project, add a license file such as `MIT`.
