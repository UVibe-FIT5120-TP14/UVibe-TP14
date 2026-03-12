# UVibe — Frontend

Nuxt 4 (Vue 3) frontend for UVibe. See the [root README](../README.md) for full project setup.

## Stack

- [Nuxt 4](https://nuxt.com) — Vue 3 framework
- [Pinia](https://pinia.vuejs.org) — auth state
- [Tailwind CSS](https://tailwindcss.com) — styling

## Dev

```bash
npm install
npm run dev        # http://localhost:3000
```

## Production Build

```bash
npm run build
npm run preview    # locally preview the production build
```

## Environment

| Variable | Description |
|---|---|
| `NUXT_PUBLIC_API_BASE` | Backend URL. Defaults to `http://localhost:8000` in dev. |
