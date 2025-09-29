# Alongside Frontend

> Dashboard and settlement interface for the Alongside backend challenge

## 📋 Overview

This is a Next.js Single Page Application (SPA) that serves as the frontend for the settlement processing system. It provides a dashboard interface for viewing settlements, and managing mint requests.

## 🛠️ Tech Stack

- **Framework:** Next.js 15.5.4 with App Router
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **Build Tool:** Turbopack (Next.js bundler)
- **Deployment:** Static export for AWS S3 + CloudFront

## Getting Started

### Prerequisites

- Node.js ≥20
- npm ≥10

### Installation

```bash
# From the monorepo root
npm install
```

### **Deployment**
- **[AWS S3](https://aws.amazon.com/s3/)** - Static file hosting
- **[AWS CloudFront](https://aws.amazon.com/cloudfront/)** - Global CDN
- **[AWS Route 53](https://aws.amazon.com/route53/)** - DNS management

### **Installation**

```bash
# Clone the repository
git clone https://github.com/MatiNav/alongside-challenge.git
cd alongside-challenge

# Install dependencies (from monorepo root)
npm install

# Verify installation
npm run frontend:dev
```

### **Development**

```bash
# Start development server
npm run frontend:dev

# Open in browser
open http://localhost:3000
```

### **Environment Configuration**

Create a `.env.local` file in the `apps/frontend` directory:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://alongside-api.matiasnavarrodev.com
```

## Deployment

This app is configured for **static export** to AWS S3 + CloudFront:

### **Build Process**

```bash
# Build static export
npm run frontend:build

# Output directory
ls apps/frontend/dist/
# ├── _next/          # Next.js assets
# ├── index.html      # Home page
# ├── mint/           # Mint page
# └── dashboard/      # Dashboard page
```

### **Deployment Architecture**
User Request → Route 53 → CloudFront → S3 Bucket

↓

Global Edge Locations (CDN)

↓

Cached Static Files


### **AWS Infrastructure**

The deployment is managed by AWS CDK in the `infrastructure/` directory:
- **S3 Bucket** - Hosts static files
- **CloudFront Distribution** - Global CDN with custom domain
- **Route 53** - DNS management for custom domain
- **ACM Certificate** - SSL/TLS encryption


## 🔌 API Integration

### **API Client**

The app communicates with the backend API using a custom client:

```typescript
export const api = {
  // Create new mint request
  createMint: async (data: MintRequest) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // Get all mints
  getMints: async () => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mint`);
    return response.json();
  },
};
```

### **Rate Limiting**

The API implements rate limiting (20 requests per 10 minutes)
