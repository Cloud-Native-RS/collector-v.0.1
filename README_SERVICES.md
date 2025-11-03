# Starting All Services

Ova skripta automatski pokreće sve microservise Collector platforme.

## Brzi Start

### Node.js verzija (preporučeno)
```bash
npm run services:start
```

### Bash verzija
```bash
npm run services:start:bash
# ili direktno:
./scripts/start-services.sh
```

## Šta skripta radi?

1. **Proverava Docker** - Da li je Docker pokrenut
2. **Pokreće servise** - Startuje sve docker-compose servise
3. **Čeka migracije** - Automatski pokreće database migracije
4. **Proverava health** - Testira da li su svi servisi zdravljeni
5. **Prikazuje rezultate** - Detaljan izveštaj o statusu svih servisa

## Servisi koje pokreće

- **registry-service** (port 3001) - Customer & Company Registry
- **invoices-service** (port 3002) - Invoices & Billing

## Rezultat

### Uspešno ✅
```
═══════════════════════════════════════════════════════
   ✓ All services are running successfully!
═══════════════════════════════════════════════════════

✓ Registry Service: http://localhost:3001
✓ Invoices Service: http://localhost:3002

ℹ You can now access the dashboard at http://localhost:3000
```

### Sa greškama ❌
```
═══════════════════════════════════════════════════════
   ✗ Some services failed to start
═══════════════════════════════════════════════════════

✗ Failed services:
  • invoices-service (health check)
    Error: Service not responding

ℹ Troubleshooting:
  1. Check if Docker is running: docker ps
  2. Check service logs: cd services/<service-name> && docker-compose logs
  3. Check service status: cd services/<service-name> && docker-compose ps
  4. Restart a service: cd services/<service-name> && docker-compose restart
  5. View all logs: cd services/<service-name> && docker-compose logs -f
```

## Troubleshooting

### Docker nije pokrenut
```bash
# Mac/Windows
# Pokreni Docker Desktop

# Linux
sudo systemctl start docker
```

### Servis ne startuje
```bash
# Proveri logove
cd services/invoices-service
docker-compose logs

# Restart servisa
docker-compose restart

# Obriši sve i kreni iz početka
docker-compose down -v
docker-compose up -d
```

### Port je zauzet
```bash
# Proveri šta koristi port
lsof -i :3001
lsof -i :3002

# Promeni port u docker-compose.yml
```

### Database migracije ne rade
```bash
# Ručno pokreni migracije
cd services/invoices-service
docker-compose exec invoices-service npm run db:migrate:deploy
```

## Dodatne komande

### Zaustavi sve servise
```bash
cd services/registry-service && docker-compose down
cd ../invoices-service && docker-compose down
```

### Restart jednog servisa
```bash
cd services/invoices-service
docker-compose restart
```

### Proveri status svih servisa
```bash
cd services/registry-service && docker-compose ps
cd ../invoices-service && docker-compose ps
```

## Karakteristike

✅ **Inteligentna** - Proverava da li servisi već rade
✅ **Robustna** - Ne staje ako jedan servis ne radi
✅ **Detaljna greška** - Jasno prikazuje šta ne radi
✅ **Auto-recovery** - Pokušava da popravi probleme
✅ **Health checks** - Proverava da li su servisi zdravljeni
✅ **Migrations** - Automatski pokreće database migracije

