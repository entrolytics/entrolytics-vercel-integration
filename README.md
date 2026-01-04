<div align="center">
  <img src="https://raw.githubusercontent.com/entrolytics/.github/main/media/entrov2.png" alt="Entrolytics" width="64" height="64">

  [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
  [![Vercel](https://img.shields.io/badge/Vercel-Marketplace-000000.svg?logo=vercel)](https://vercel.com/integrations)
  [![Next.js](https://img.shields.io/badge/Next.js-15-000000.svg?logo=next.js)](https://nextjs.org/)

</div>

---

## Overview

**Entrolytics Vercel Integration** is the official Vercel Marketplace integration for Entrolytics - first-party growth analytics for the edge. One-click install with automatic environment configuration.

**Why use this integration?**
- One-click setup from Vercel Marketplace
- Automatic environment variable injection
- Resource management for analytics websites
- Edge-optimized for sub-50ms response times

## Key Features

<table>
<tr>
<td width="50%">

### Integration
- One-click Marketplace install
- Automatic env var configuration
- Works in all environments
- Resource management UI

</td>
<td width="50%">

### Edge Optimization
- Edge-to-edge communication
- <50ms response times globally
- Fast cold starts
- Vercel Edge Network powered

</td>
</tr>
</table>

## Quick Start

<table>
<tr>
<td align="center" width="25%">
<img src="https://api.iconify.design/lucide:download.svg?color=%236366f1" width="48"><br>
<strong>1. Install</strong><br>
Vercel Marketplace
</td>
<td align="center" width="25%">
<img src="https://api.iconify.design/lucide:link.svg?color=%236366f1" width="48"><br>
<strong>2. Connect</strong><br>
Authorize with Vercel
</td>
<td align="center" width="25%">
<img src="https://api.iconify.design/lucide:settings.svg?color=%236366f1" width="48"><br>
<strong>3. Configure</strong><br>
Create analytics resource
</td>
<td align="center" width="25%">
<img src="https://api.iconify.design/lucide:bar-chart-3.svg?color=%236366f1" width="48"><br>
<strong>4. Track</strong><br>
View analytics in dashboard
</td>
</tr>
</table>

## Features

- **One-click Setup**: Install from Vercel Marketplace
- **Automatic Configuration**: Environment variables set automatically
- **Resource Management**: Create and manage analytics websites
- **All Environments**: Works in production, preview, and development

## How It Works

1. User installs integration from Vercel Marketplace
2. Vercel calls our v1 API endpoints to provision the integration
3. User creates an Entrolytics "resource" (analytics website)
4. Environment variables are automatically injected:
   - `NEXT_PUBLIC_ENTROLYTICS_WEBSITE_ID` - Your website tracking ID
   - `NEXT_PUBLIC_ENTROLYTICS_HOST` - Entrolytics API URL
   - `NEXT_PUBLIC_ENTROLYTICS_ENDPOINT` - Collection endpoint (defaults to `/api/send-native` for edge optimization)

## Edge Optimization

The integration automatically configures your app to use the **Edge Runtime endpoint** (`/api/send-native`) for analytics collection. This provides:

- **Lower Latency**: Edge-to-edge communication with <50ms response times
- **Global Distribution**: Automatic routing to the nearest edge location
- **Fast Cold Starts**: Optimized for serverless environments
- **Scalability**: Built on Vercel's global edge network

For apps requiring advanced features like ClickHouse exports or MaxMind GeoIP lookups, you can override the endpoint by setting:

```bash
NEXT_PUBLIC_ENTROLYTICS_ENDPOINT=/api/collect  # Use intelligent routing
# or
NEXT_PUBLIC_ENTROLYTICS_ENDPOINT=/api/send     # Use Node.js runtime
```

## API Endpoints

### v1 API (Called by Vercel)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/installations/[id]` | PUT | Install integration |
| `/v1/installations/[id]` | GET | Get installation details |
| `/v1/installations/[id]` | DELETE | Uninstall integration |
| `/v1/installations/[id]/resources` | GET | List resources |
| `/v1/installations/[id]/resources` | POST | Create resource |
| `/v1/installations/[id]/resources/[rid]` | GET | Get resource |
| `/v1/installations/[id]/resources/[rid]` | DELETE | Delete resource |
| `/v1/installations/[id]/plans` | GET | Get billing plans |

### Other Endpoints

| Endpoint | Description |
|----------|-------------|
| `/webhook` | Vercel webhook handler |
| `/callback` | OAuth callback |
| `/dashboard` | User dashboard |

## Development

### Prerequisites

- Node.js 18+
- pnpm
- Vercel account with integration console access

### Setup

1. Clone and install:

```bash
cd integrations/vercel
pnpm install
```

2. Create integration in [Vercel Console](https://vercel.com/dashboard/integrations/console):
   - Set Base URL to your deployment URL
   - Set Redirect Login URL to `{base-url}/callback`
   - Note your Client ID and Secret

3. Deploy to Vercel and add environment variables:

```bash
vercel link
vercel env add INTEGRATION_CLIENT_ID
vercel env add INTEGRATION_CLIENT_SECRET
vercel env add ENTROLYTICS_API_URL
vercel env add ENTROLYTICS_INTEGRATION_SECRET
```

4. Connect Vercel KV (Upstash Redis):
   - Go to your project's Storage tab
   - Create a new Upstash Redis database
   - Connect to project

5. Update Marketplace Integration Settings:
   - Set Base URL to deployment URL
   - Create a product (type: "storage" for databases or appropriate type)

### Local Development

```bash
pnpm dev
```

The integration runs on `http://localhost:3001`.

For webhook testing, use [ngrok](https://ngrok.com/) or similar.

## Architecture

```
integrations/vercel/
├── app/
│   ├── v1/
│   │   └── installations/
│   │       └── [installationId]/
│   │           ├── route.ts          # Install/uninstall/get
│   │           ├── resources/
│   │           │   ├── route.ts      # List/create resources
│   │           │   └── [resourceId]/
│   │           │       └── route.ts  # Get/delete resource
│   │           └── plans/
│   │               └── route.ts      # Get billing plans
│   ├── webhook/
│   │   └── route.ts                  # Webhook handler
│   ├── callback/
│   │   └── route.ts                  # OAuth callback
│   └── dashboard/
│       └── page.tsx                  # User dashboard
├── lib/
│   ├── auth.ts                       # JWT verification
│   ├── env.ts                        # Environment validation
│   ├── partner.ts                    # Business logic
│   └── schemas.ts                    # Zod schemas
└── package.json
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `INTEGRATION_CLIENT_ID` | Vercel integration client ID |
| `INTEGRATION_CLIENT_SECRET` | Vercel integration secret |
| `ENTROLYTICS_API_URL` | Entrolytics backend URL |
| `ENTROLYTICS_INTEGRATION_SECRET` | Secret for Entrolytics API calls |
| `KV_*` | Vercel KV credentials (auto-set when connected) |

## Billing Plans

| Plan | Price | Features |
|------|-------|----------|
| Free | $0 | 10K views/mo, 1 website, 3 months retention |
| Pro | $9/mo | 100K views/mo, 10 websites, 12 months retention |

## Using with Next.js

After installation, add the tracking script:

```tsx
// app/layout.tsx
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Script
          src={`${process.env.NEXT_PUBLIC_ENTROLYTICS_HOST}/script.js`}
          data-website-id={process.env.NEXT_PUBLIC_ENTROLYTICS_WEBSITE_ID}
          strategy="afterInteractive"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

Or use `@entrolytics/nextjs` for a more integrated experience.

## License

MIT
