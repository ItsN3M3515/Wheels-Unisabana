# Wheels-Unisabana Backend (Express)

Protected endpoint returning the current user's profile from a JWT in an httpOnly cookie.

## Endpoints

GET /users/me

- Auth: Cookie `access_token=<JWT>` (httpOnly)
- Returns sanitized user profile DTO with `driver.hasVehicle` summary

## Quick start

1. Create `.env` from example and set a strong JWT_SECRET
2. Install and run

```
# Windows CMD
cd backend
npm install
npm run dev
```

API will start at http://localhost:3001

## Example requests

cURL:

```
curl -X GET http://localhost:3001/users/me ^
  -b "access_token=eyJ..." ^
  -H "Accept: application/json"
```

Fetch:

```js
const res = await fetch('http://localhost:3001/users/me', { credentials: 'include' });
if (!res.ok) throw await res.json();
const me = await res.json();
```

### Response (200)

```json
{
  "id": "665e2a...f1",
  "role": "passenger",
  "firstName": "Ana",
  "lastName": "Ruiz",
  "universityId": "202420023",
  "corporateEmail": "aruiz@uni.edu",
  "phone": "+573001112233",
  "profilePhotoUrl": "https://cdn.example/u/665e2a/avatar.jpg",
  "driver": { "hasVehicle": false }
}
```

### Errors (401)

```json
{ "code": "unauthorized", "message": "Missing or invalid session" }
```

## Notes

- Replace the mock user lookup with your database access.
- No internal fields (password hashes, flags) are leaked; DTO is explicitly constructed.
- CORS is open for local dev; tighten in production.
