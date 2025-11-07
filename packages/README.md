# Packages

This directory contains shared packages used across the Collector app monorepo.

## Available Packages

### [@midday/ui](./ui)
UI component library with React components, TipTap editor, and Tailwind CSS styling.

**Usage:**
```typescript
import { Button } from '@midday/ui/button';
import { Editor } from '@midday/ui/editor';
```

### [@midday/invoice](./invoice)
Invoice templates and utilities for generating HTML, PDF, and OG images.

**Usage:**
```typescript
import { InvoiceTemplate } from '@midday/invoice/templates/html';
import { generateToken } from '@midday/invoice/token';
```

### [@midday/utils](./utils)
Shared utility functions for formatting and data transformation.

**Usage:**
```typescript
import { formatAmount, formatNumber } from '@midday/utils/format';
```

## Adding a New Package

1. Create package directory:
```bash
mkdir packages/your-package
cd packages/your-package
```

2. Initialize package.json:
```json
{
  "name": "@midday/your-package",
  "version": "1.0.0",
  "private": true,
  "main": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "clean": "rm -rf .turbo node_modules",
    "lint": "biome check .",
    "typecheck": "tsc --noEmit"
  }
}
```

3. Install dependencies from root:
```bash
npm install
```

4. Use in other packages:
```json
{
  "dependencies": {
    "@midday/your-package": "workspace:*"
  }
}
```

## Development

Run all packages in development mode:
```bash
npm run dev
```

Build all packages:
```bash
npm run build
```

Lint all packages:
```bash
npm run lint
```

## Learn More

See [TURBOREPO_SETUP.md](../TURBOREPO_SETUP.md) for detailed documentation.






