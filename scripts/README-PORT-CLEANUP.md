# Port Cleanup Scripts

Skripte za automatsko oslobađanje zauzetih portova i pokretanje Collector Platform servisa.

## Skripte

### 1. `start-with-port-cleanup.sh`

Kompletna skripta koja:
- Oslobađa sve zauzete portove
- **Automatski pokreće Docker Desktop** ako nije pokrenut (macOS)
- Zaustavlja postojeće Docker kontejnere
- Pokreće infrastrukturne servise (PostgreSQL, Redis, RabbitMQ)
- Pokreće sve mikroservise
- Pokreće Next.js aplikaciju

**Korišćenje:**
```bash
./scripts/start-with-port-cleanup.sh
```

Ili preko npm:
```bash
npm run start:clean
```

### 2. `free-ports.sh`

Skripta samo za oslobađanje portova (bez pokretanja servisa).

**Korišćenje:**
```bash
./scripts/free-ports.sh
```

Ili preko npm:
```bash
npm run ports:free
```

**Opcije:**
```bash
# Normalno oslobađanje (graceful shutdown)
./scripts/free-ports.sh

# Force kill (nema graceful shutdown)
./scripts/free-ports.sh --force

# Pomoć
./scripts/free-ports.sh --help
```

## Portovi koje skripte upravljaju

### Frontend
- **3000** - Next.js Application

### Mikroservisi
- **3001** - Registry Service
- **3002** - Orders Service
- **3003** - Invoices Service
- **3004** - Offers Service
- **3005** - Inventory Service
- **3006** - HR Service
- **3007** - Project Management Service
- **3008** - Delivery Service

### Infrastruktura
- **5432** - PostgreSQL
- **6379** - Redis
- **5672** - RabbitMQ AMQP
- **15672** - RabbitMQ Management UI

### Opciono (ako se koriste)
- **80** - HAProxy
- **8000** - Kong Gateway
- **8001** - Kong Admin
- **1337** - Konga UI

## Kako radi

1. **Auto-start Docker Desktop**: Ako Docker nije pokrenut, automatski pokušava da pokrene Docker Desktop (macOS)
2. **Docker Container Detection**: Prvo proverava da li port koristi Docker kontejner - ako da, zaustavlja kontejner umesto ubijanja procesa
3. **Docker Process Protection**: Preskače Docker backend procese (ne može ih bezbedno zaustaviti)
4. **Provera portova**: Koristi `lsof` komandu da proveri koji procesi koriste određene portove
5. **Graceful shutdown**: Prvo šalje SIGTERM signal (mogućnost graceful shutdown)
6. **Force kill**: Ako proces ne odgovori, šalje SIGKILL signal
7. **Verifikacija**: Proverava da li je port oslobođen nakon pokušaja
8. **Database Warnings**: Posebno upozorava kada se pokušava zaustaviti PostgreSQL ili Redis instance koje mogu biti korišćene drugim aplikacijama

## Primeri

### Pokretanje celog sistema
```bash
npm run start:clean
```

### Samo oslobađanje portova
```bash
npm run ports:free
```

### Oslobađanje portova sa force kill
```bash
./scripts/free-ports.sh --force
```

### Rucno oslobađanje specifičnog porta
```bash
# Pronađi proces
lsof -ti:3000

# Zaustavi proces
kill -9 $(lsof -ti:3000)
```

## Rešavanje problema

### Port je još uvek zauzet posle pokušaja oslobađanja

1. Proverite da li je proces zaista zaustavljen:
```bash
lsof -i:PORT_NUMBER
```

2. Proverite Docker kontejnere:
```bash
docker ps
docker ps --format "{{.Names}}\t{{.Ports}}" | grep PORT_NUMBER
docker stop $(docker ps -q --filter "label=app=collector")
```

3. Ako je Docker backend proces (ne kontejner), zaustavite kontejner ručno:
```bash
docker stop CONTAINER_NAME
```

4. Pokušajte sa force kill opcijom (ne radi za Docker procese):
```bash
./scripts/free-ports.sh --force
```

### Docker procesi se ne zaustavljaju

Skripta automatski preskače Docker backend procese jer ih ne može bezbedno zaustaviti. Umesto toga:
1. Zaustavite Docker kontejnere koji koriste port:
```bash
docker ps
docker stop CONTAINER_NAME
```

2. Ili zaustavite sve Collector kontejnere:
```bash
docker stop $(docker ps -q --filter "label=app=collector")
```

### PostgreSQL/Redis upozorenja

Ako vidite upozorenja o PostgreSQL ili Redis procesima:
- Skripta će pokušati da ih zaustavi, ali upozorava vas da to može uticati na druge aplikacije
- Ako koristite lokalne PostgreSQL/Redis instance za druge projekte, možda ćete morati da ih zaustavite ručno ili da promenite portove

### Docker se ne pokreće automatski

Skripta automatski pokušava da pokrene Docker Desktop na macOS-u. Ako to ne radi:

1. **Ručno pokrenite Docker Desktop** pre pokretanja skripte
2. **Proverite da li je Docker instaliran**:
```bash
which docker
docker --version
```
3. **Proverite Docker Desktop aplikaciju**:
   - Otvorite Applications folder
   - Proverite da li Docker.app postoji
   - Ako ne postoji, instalirajte ga sa https://www.docker.com/products/docker-desktop

### Next.js se ne pokreće

1. Proverite logove:
```bash
tail -f /tmp/nextjs.log
```

2. Proverite da li je port 3000 zauzet:
```bash
lsof -i:3000
```

3. Pokrenite Next.js ručno:
```bash
npm run dev
```

## Napomene

- Skripte rade na macOS i Linux sistemima
- Za Windows, koristite WSL ili Git Bash
- Skripte pokušavaju graceful shutdown pre force kill-a
- Next.js se pokreće u pozadini - logovi su u `/tmp/nextjs.log`
- PID Next.js procesa se čuva u `/tmp/collector-nextjs.pid`

