# Seed Scripts - Workaround

## 🔴 Problem

Seed skripte ne rade jer Prisma Client dobija "User collector was denied access" grešku, iako direktni psql INSERT radi.

## ✅ Rešenje: Direktan SQL Seed

Umesto seed skripti kroz Prisma, koristite direktne SQL INSERT komande kroz Docker postgres kontejner.

### Primer za Offers:

```bash
docker exec -i collector-postgres psql -U collector -d collector_offers_db << 'EOF'
-- Kreirajte 25 offers direktno u bazi
-- (SQL komande...)
EOF
```

## 📝 Trenutni Status

- Seed skripte postoje u svim servisima
- Generišu po 25 objekata (6 od 8 servisa)
- Problem: Prisma permissions error
- Rešenje: Potrebno rešiti database permissions ili koristiti SQL direktno

## 🎯 Preporuka

Za sada, podaci su već u bazi (25 offers, 25 orders) jer smo ih ranije dodali direktno.

Za buduće seed-ovanje, treba:
1. Dodati `tsx` u Dockerfile production stage
2. ILI koristiti kompajlovanu verziju seed.ts
3. ILI rešiti database permissions problem

