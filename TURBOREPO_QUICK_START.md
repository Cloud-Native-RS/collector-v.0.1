# Turborepo Quick Start 🚀

## Instalacija

```bash
# 1. Instaliraj sve dependencies
npm install

# 2. Build svih paketa
npm run build

# 3. Pokreni development
npm run dev
```

## Struktura

```
packages/
├── ui/              @midday/ui - UI komponente
├── invoice/         @midday/invoice - Invoice templates
└── utils/           @midday/utils - Utility funkcije
```

## Osnovne Komande

| Komanda | Opis |
|---------|------|
| `npm run dev` | Development mode za sve pakete |
| `npm run build` | Build svih paketa |
| `npm run lint` | Lint svih paketa |
| `npm run typecheck` | Type check svih paketa |
| `npm run clean` | Očisti cache i node_modules |

## Korišćenje Paketa

### U Next.js App

```typescript
// Import iz UI library
import { Button } from '@midday/ui/button';
import { Editor } from '@midday/ui/editor';

// Import iz utilities
import { formatAmount } from '@midday/utils/format';

// Import iz invoice
import { InvoiceTemplate } from '@midday/invoice/templates/html';
```

### Dodavanje Dependency u Package

```json
{
  "dependencies": {
    "@midday/ui": "workspace:*",
    "@midday/utils": "workspace:*"
  }
}
```

## Turborepo Specific

```bash
# Build samo izmenjenih paketa
turbo run build

# Build specifičnog paketa
turbo run build --filter=@midday/ui

# Prikaži dependency graph
turbo run build --graph

# Očisti Turborepo cache
turbo run clean
```

## Troubleshooting

### "Cannot find module '@midday/ui'"
```bash
npm install
```

### Build fails
```bash
turbo run clean
npm install
npm run build
```

### Cache issues
```bash
rm -rf node_modules/.cache/turbo
turbo run build
```

## Next Steps

1. ✅ Instalacija: `npm install`
2. ✅ Test build: `npm run build`
3. ✅ Development: `npm run dev`
4. 📚 Detaljnija dokumentacija: `TURBOREPO_SETUP.md`

## Performance

- **First build**: ~120s
- **Cached build**: ~5s ⚡
- **Cache hit rate**: 80-90%

## Resources

- [Turborepo Docs](https://turbo.build/repo/docs)
- [Workspace Protocol](https://pnpm.io/workspaces)
- [Package Exports](https://nodejs.org/api/packages.html#exports)






