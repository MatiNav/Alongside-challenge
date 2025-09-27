# Alongside Frontend

> Dashboard and settlement interface for the Alongside backend challenge

## 📋 Overview

This is a Next.js Single Page Application (SPA) that serves as the frontend for the settlement processing system. It provides a dashboard interface for viewing settlements, analytics, and managing mint requests.

## ✨ Features

- 🎯 **Settlement Dashboard** - View and track settlement status
- 📊 **Analytics Interface** - Monitor system metrics and performance
- 🔄 **Real-time Updates** - Live settlement status tracking
- 📱 **Responsive Design** - Mobile-friendly interface with Tailwind CSS
- 🚀 **Static Export** - Optimized for S3 + CloudFront deployment

## 🛠️ Tech Stack

- **Framework:** Next.js 15.5.4 with App Router
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **Build Tool:** Turbopack (Next.js bundler)
- **Deployment:** Static export for AWS S3 + CloudFront

## 🚀 Getting Started

### Prerequisites

- Node.js ≥20
- npm ≥10

### Installation

```bash
# From the monorepo root
npm install
```

### Development

```bash
# From the monorepo root
npm run frontend:dev

# Open http://localhost:3000 in your browser
```

### Build & Export

```bash
# From the monorepo root
# Build for production (static export)
npm run frontend:build

# The static files will be in the `out` directory
```
