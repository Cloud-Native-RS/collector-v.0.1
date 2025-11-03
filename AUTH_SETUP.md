# Authentication Setup Guide

Ovaj vodič objašnjava kako da podesite i koristite autentifikacioni sistem.

## Pregled

Autentifikacija je implementirana u **Registry Service** i dostupna je kroz Next.js API routes:
- `/api/auth/login` - Login korisnika
- `/api/auth/signup` - Registracija novog korisnika
- `/api/auth/me` - Dobijanje trenutnog korisnika

## Baza podataka

### 1. Prisma Migracija

Prvo, morate da kreirate migraciju za User model:

```bash
cd services/registry-service
npm run db:migrate
```

Ovo će kreirati `users` tabelu u bazi podataka.

### 2. Seed Test Korisnici

Nakon migracije, pokrenite seed script da kreiramo test korisnike:

```bash
cd services/registry-service
npm run db:seed
```

### 3. Test Korisnici

Nakon seed-a, biće kreirani sledeći test korisnici:

| Email | Password | Opis |
|-------|----------|------|
| admin@example.com | Admin123! | Admin korisnik |
| user@example.com | User123! | Regular korisnik |
| test@example.com | Test123! | Test korisnik |

## Environment Variables

Proverite da su sledeće environment varijable podešene:

### Registry Service

U `services/registry-service/.env` ili `docker-compose.yml`:

```env
JWT_SECRET=your-secret-key-change-in-production
BCRYPT_SALT_ROUNDS=10
DATABASE_URL=postgresql://user:password@host:port/database
```

### Next.js App

U `.env.local` ili `.env`:

```env
NEXT_PUBLIC_REGISTRY_SERVICE_URL=http://localhost:3001
```

## Pokretanje Servisa

### 1. Pokrenite Registry Service

```bash
cd services/registry-service
npm run dev
```

Servis će biti dostupan na `http://localhost:3001`

### 2. Pokrenite Next.js App

```bash
npm run dev
```

Aplikacija će biti dostupna na `http://localhost:3000`

## Testiranje Login-a

1. Otvorite `http://localhost:3000/login`
2. Unesite email i password jednog od test korisnika
3. Kliknite na "Login"
4. Trebalo bi da budete preusmereni na `/collector/dashboard`

## API Endpoints

### POST /api/auth/login

```json
{
  "email": "admin@example.com",
  "password": "Admin123!"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@example.com",
      "name": "Admin User",
      "avatar": "/images/avatars/01.png",
      "tenantId": "default-tenant",
      "isActive": true
    },
    "accessToken": "jwt-token",
    "expiresIn": 604800
  }
}
```

### POST /api/auth/signup

```json
{
  "email": "newuser@example.com",
  "password": "Password123!",
  "name": "New User",
  "avatar": "/images/avatars/01.png"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "newuser@example.com",
      "name": "New User",
      "avatar": "/images/avatars/01.png",
      "tenantId": "default-tenant",
      "isActive": true
    },
    "accessToken": "jwt-token",
    "expiresIn": 604800
  }
}
```

### GET /api/auth/me

Headers:
```
Authorization: Bearer <jwt-token>
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "admin@example.com",
    "name": "Admin User",
    "avatar": "/images/avatars/01.png",
    "tenantId": "default-tenant",
    "isActive": true
  }
}
```

## Troubleshooting

### Problem: "Failed to connect to authentication service"

- Proverite da li je Registry Service pokrenut
- Proverite `NEXT_PUBLIC_REGISTRY_SERVICE_URL` environment varijablu
- Proverite da li je port 3001 slobodan

### Problem: "Invalid email or password"

- Proverite da li ste pokrenuli seed script
- Proverite da li koristite ispravne credentials iz tabele test korisnika
- Proverite database konekciju

### Problem: "User with this email already exists"

- Korisnik sa tim email-om već postoji u bazi
- Koristite drugi email ili obrišite postojećeg korisnika iz baze

### Problem: Database migration failed

- Proverite da li je database konekcija ispravna
- Proverite da li imate prava za kreiranje tabela
- Proverite Prisma schema za sintaksne greške

## Security Notes

⚠️ **VAŽNO:**
- Uvek promenite `JWT_SECRET` u produkciji
- Koristite jak JWT secret (minimum 32 karaktera)
- Ne commit-ujte `.env` fajlove sa pravim secretima
- Koristite HTTPS u produkciji
- Implementirajte rate limiting za login endpoints
- Razmotrite dodavanje 2FA za dodatnu sigurnost

