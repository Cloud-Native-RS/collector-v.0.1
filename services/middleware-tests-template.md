# Middleware Test Template

Ovaj template može biti korišćen za testiranje middleware-a u svim mikroservisima.

## Testovi koji treba da budu implementirani

### 1. Auth Middleware
- ✅ Validacija JWT tokena
- ✅ Odbijanje zahteva bez tokena
- ✅ Odbijanje nevažećeg tokena
- ✅ Postavljanje user objekta u request

### 2. Tenant Middleware
- ✅ Ekstrakcija tenant ID iz headera
- ✅ Postavljanje tenant ID u request
- ✅ Odbijanje zahteva bez tenant ID

### 3. Error Handler
- ✅ Hvatanje AppError i vraćanje odgovarajućeg status koda
- ✅ Hvatanje nepoznatih grešaka i vraćanje 500
- ✅ Formatiranje error response-a

