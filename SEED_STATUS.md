# Seed Scripts Status

## 📊 Trenutno Stanje

**Problem:** Seed skripte ne rade kroz Docker kontejnere jer `tsx` nije dostupan (devDependency).

**Rešenje:** Pokrećemo seed skripte lokalno sa DATABASE_URL koji povezuje na Docker PostgreSQL.

## ✅ Servisi sa 25 objekata

- ✅ **Offers Service** - generiše 25 offers
- ✅ **Orders Service** - generiše 25 orders  
- ✅ **Invoices Service** - generiše 25 invoices
- ✅ **Delivery Service** - generiše 25 delivery notes
- ✅ **HR Service** - generiše 25 employees
- ✅ **Project Management** - generiše 25 projects

## ⚠️ Trenutni Problem

Seed skripte pokušavaju da se povežu na bazu, ali Prisma Client ne može da piše u bazu (permissions error).

**Status:** Potrebno je rešiti database permissions.

## 🔧 Rešenje

Master script (`scripts/seed-all.sh`) je ažuriran da:
1. Pokreće seed lokalno (ne kroz Docker)
2. Koristi DATABASE_URL sa `localhost:5432`
3. Osigurava database permissions pre seed-a

**Napomena:** Verovatno je potrebno da se database owner promeni na `collector` user-a ili da se daju dodatna prava.

