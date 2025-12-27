# TABLA BAKI - React Frontend (Vite)

React frontend application for the backgammon game, built with Vite.

## Setup

```bash
npm install
```

## Configuration

Create a `.env` file (already created) with:
```
VITE_API_URL=http://localhost:8000
```

## Run

```bash
npm run dev
```

The app will open at http://localhost:5173 (Vite default port)

## Build

```bash
npm run build
```

Build output will be in the `dist` folder.

## Preview Production Build

```bash
npm run preview
```

## Features

- Visual board representation
- Interactive point clicking
- Dice rolling
- Move selection and execution
- Legal moves display
- Manual move input
- Game state management
- Fast HMR (Hot Module Replacement) with Vite

## Project Structure

```
app/
├── src/
│   ├── components/
│   │   ├── Board.tsx          # Board visualization
│   │   ├── Board.css
│   │   ├── GameControls.tsx   # Game controls and actions
│   │   └── GameControls.css
│   ├── api.ts                 # API client
│   ├── App.tsx                # Main app component
│   ├── App.css
│   └── main.tsx               # Entry point
├── public/                     # Static assets
├── vite.config.ts              # Vite configuration
└── package.json
```

## Vite Benefits

- ⚡ Fast HMR (Hot Module Replacement)
- 🚀 Fast builds
- 📦 Optimized production builds
- 🔧 Simple configuration
- 🎯 Modern ES modules
