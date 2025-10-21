# Wheels-Unisabana Backend API

Express + TypeScript backend with JWT cookie authentication, profile management, and file uploads.

## Features

- 🔐 **JWT Cookie Auth**: httpOnly cookies, secure in production, CORS with credentials
- 👤 **Profile API**: GET and PATCH `/users/me` with sanitized DTOs
- 📸 **Photo Uploads**: Multipart form-data with MIME validation, size caps, atomic replacement
- 📋 **OpenAPI**: Swagger UI at `/docs`, spec at `/openapi.json`
- ✅ **Contract Tests**: Jest + supertest + jest-openapi for CI

## Quick Start

### 1. Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
PORT=3001
JWT_SECRET=your_secret_here
MONGODB_URI=mongodb+srv://user:pass@cluster/db
FRONTEND_ORIGIN=http://localhost:5173
MAX_PROFILE_PHOTO_MB=5
```

### 2. Install & Run

```cmd
cd backend
npm install
npm run dev
```

API starts at http://localhost:3001
- Swagger UI: http://localhost:3001/docs
- OpenAPI spec: http://localhost:3001/openapi.json

### 3. Generate Test JWT

```cmd
npm run seed:test-user
npm run token
```

Token saved to `backend/token.txt`

---

## API Endpoints

### Authentication

#### POST /auth/login

Public endpoint for login with corporate email and password.

**Request:**
```json
{
  "corporateEmail": "jdoe@uni.edu",
  "password": "CorrectHorseBatteryStaple!"
}
```

**Response (200):**
```json
{
  "id": "665e2a...f1",
  "role": "driver",
  "firstName": "John",
  "lastName": "Doe"
}
```

Sets httpOnly cookie:
```
Set-Cookie: access_token=eyJ...; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=7200
```

**Errors:**
- `400 invalid_schema`: Validation failed (invalid email, missing fields)
- `401 invalid_credentials`: Email or password is incorrect (generic error for security)
- `429 too_many_attempts`: Rate limit exceeded (5 attempts/min per IP, 5 attempts/min per email)

**Features:**
- ✅ Zero PII in logs (passwords/tokens never logged)
- ✅ Generic error message for invalid credentials (prevents user enumeration)
- ✅ Soft rate limiting (5/min per IP and per email)
- ✅ bcrypt password verification via auth service
- ✅ JWT issued with claims: sub, role, email, iat, exp

**Example (fetch):**
```javascript
const res = await fetch('http://localhost:3001/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    corporateEmail: 'jdoe@uni.edu',
    password: 'CorrectHorseBatteryStaple!'
  }),
  credentials: 'include'
});

if (!res.ok) {
  const error = await res.json();
  throw error; // { code, message, details? }
}

const profile = await res.json();
console.log(profile); // { id, role, firstName, lastName }
```

**Example (curl):**
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"corporateEmail":"jdoe@uni.edu","password":"secret"}' \
  -c cookies.txt -i
```

---

#### POST /auth/logout

Clears the session cookie for stateless JWT logout.

**Request:** No body required (can be called with or without existing session)

**Response (200):**
```json
{
  "ok": true
}
```

Clears cookie:
```
Set-Cookie: access_token=; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=0
```

**Features:**
- ✅ Stateless logout (no server-side state needed)
- ✅ Cookie cleared with Max-Age=0 and matching attributes
- ✅ Design allows future token denylist implementation
- ✅ Works even without existing session (idempotent)

**Example (fetch):**
```javascript
const res = await fetch('http://localhost:3001/auth/logout', {
  method: 'POST',
  credentials: 'include'
});

if (res.ok) {
  const data = await res.json();
  console.log(data); // { ok: true }
  // Redirect to login page
  window.location.href = '/login';
}
```

**Example (curl):**
```bash
# With existing session cookie
curl -X POST http://localhost:3001/auth/logout \
  -b cookies.txt \
  -c cookies.txt \
  -i

# Without session (also works)
curl -X POST http://localhost:3001/auth/logout -i
```

**Integration flow:**
```javascript
// 1. Login
await fetch('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ corporateEmail, password }),
  credentials: 'include'
});

// 2. Access protected routes (cookie automatically sent)
await fetch('/users/me', { credentials: 'include' });

// 3. Logout
await fetch('/auth/logout', { method: 'POST', credentials: 'include' });

// 4. Protected routes now return 401 (cookie cleared)
await fetch('/users/me', { credentials: 'include' }); // → 401
```

**Note on stateless JWT:**
- For stateless JWT, the token remains technically valid until expiry
- Client-side cookie is cleared immediately (browser won't send it)
- To enforce immediate server-side invalidation, implement a token denylist
- Current design supports future denylist without API changes

---

## CSRF Protection

### Double-Submit Cookie Pattern

The API implements CSRF protection for state-changing operations (POST/PATCH/DELETE) using the double-submit cookie pattern.

**How it works:**
1. On login, server sets two cookies:
   - `access_token` (httpOnly) - JWT for authentication
   - `csrf_token` (non-httpOnly) - Random token for CSRF protection
2. Client reads `csrf_token` cookie and sends value in `X-CSRF-Token` header
3. Server validates that header matches cookie (constant-time comparison)

**Protected endpoints:**
- `POST /drivers/vehicle`
- `PATCH /drivers/vehicle`
- `PATCH /users/me`

**Safe methods (no CSRF required):**
- `GET /users/me`
- `GET /drivers/vehicle`
- All other GET/HEAD/OPTIONS requests

### Client Implementation

**JavaScript example:**
```javascript
// 1. Login (receives csrf_token cookie)
await fetch('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ corporateEmail, password }),
  credentials: 'include'
});

// 2. Read csrf_token cookie (non-httpOnly, so accessible)
const csrf = document.cookie
  .split('; ')
  .find(c => c.startsWith('csrf_token='))
  ?.split('=')[1];

// 3. Send CSRF token in header for state-changing requests
await fetch('/users/me', {
  method: 'PATCH',
  headers: { 
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrf  // Double-submit pattern
  },
  body: JSON.stringify({ firstName: 'Updated' }),
  credentials: 'include'
});
```

**FormData/Multipart example:**
```javascript
const formData = new FormData();
formData.append('firstName', 'John');
formData.append('profilePhoto', fileInput.files[0]);

const csrf = document.cookie
  .split('; ')
  .find(c => c.startsWith('csrf_token='))
  ?.split('=')[1];

await fetch('/users/me', {
  method: 'PATCH',
  headers: { 'X-CSRF-Token': csrf },
  body: formData,
  credentials: 'include'
});
```

**React helper:**
```javascript
function getCsrfToken() {
  return document.cookie
    .split('; ')
    .find(c => c.startsWith('csrf_token='))
    ?.split('=')[1] || '';
}

// Usage
const response = await fetch('/drivers/vehicle', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': getCsrfToken()
  },
  body: JSON.stringify({ vehicleId: 'ABC123' }),
  credentials: 'include'
});
```

### Error Response

**403 CSRF Mismatch:**
```json
{
  "code": "csrf_mismatch",
  "message": "CSRF token missing or invalid"
}
```

**Common causes:**
- Missing `X-CSRF-Token` header
- Header value doesn't match cookie value
- CSRF token expired (rotated on login, 1-hour lifetime)

### Security Features

1. **Cryptographically secure tokens**: 32 random bytes (64 hex chars)
2. **Constant-time comparison**: Prevents timing attacks
3. **Token rotation**: New token on each login
4. **Non-httpOnly cookie**: Client can read (required for double-submit)
5. **Same-origin protection**: Cookie + header must match
6. **Can be disabled**: Set `DISABLE_CSRF=true` for SameSite=Strict environments

### Environment Configuration

```bash
# Disable CSRF protection (optional, for SameSite=Strict environments)
DISABLE_CSRF=false  # default: false (protection enabled)
```

**When to disable:**
- Pure SameSite=Strict cookie policy
- Internal APIs behind VPN/firewall
- Development/testing (not recommended for production)


---

## Authentication & Authorization

### requireAuth Middleware

Extracts `access_token` from httpOnly cookie and verifies via auth service.

**On success**: Attaches `req.user = { sub, role, email, iat, exp }`  
**On failure**: Returns `401 unauthorized`

**Usage:**
```typescript
import { requireAuth } from './middleware/auth';

router.get('/users/me', requireAuth, (req, res) => {
  const userId = req.user!.sub;
  const role = req.user!.role;
  // ...
});
```

### requireRole Middleware (RBAC)

Enforces role-based access control. Requires specific role(s) for access.

**Usage:**
```typescript
import { requireAuth, requireRole } from './middleware/auth';

// Single role
router.post('/drivers/vehicle', requireAuth, requireRole('driver'), handler);

// Multiple roles (OR logic)
router.get('/admin/reports', requireAuth, requireRole('admin', 'driver'), handler);
```

**Convenience helper:**
```typescript
import { authWithRole } from './middleware/auth';

// Combines requireAuth + requireRole
router.patch('/drivers/vehicle', ...authWithRole('driver'), handler);
```

**Error responses:**
- `401 unauthorized`: Missing or invalid session
- `403 forbidden`: Valid session but insufficient permissions

---

### Profile Management


### GET /users/me

**Get current user profile**

**Auth**: Cookie `access_token=<JWT>` (httpOnly)

**Response (200 OK)**:
```json
{
  "id": "665e2a...f1",
  "role": "passenger",
  "firstName": "Ana",
  "lastName": "Ruiz",
  "universityId": "202420023",
  "corporateEmail": "aruiz@uni.edu",
  "phone": "+573001112233",
  "profilePhotoUrl": "/uploads/u_665e2a_1729468800123_avatar.jpg",
  "driver": { "hasVehicle": false }
}
```

**cURL Example**:
```cmd
curl -X GET http://localhost:3001/users/me ^
  -b "access_token=eyJ..." ^
  -H "Accept: application/json"
```

**Browser Fetch**:
```js
const res = await fetch('/users/me', { credentials: 'include' });
if (res.status === 401) {
  // redirect to /login
}
const profile = await res.json();
```

**Axios**:
```js
import axios from 'axios';
const { data } = await axios.get('/users/me', { withCredentials: true });
```

---

### PATCH /users/me

**Update current user profile**

**Auth**: Cookie `access_token=<JWT>`

**Allowed Fields**:
- `firstName` (string, min 2 chars)
- `lastName` (string, min 2 chars)
- `phone` (E.164 format)
- `profilePhoto` (file: image/jpeg|png|webp, max 5MB)

**Immutable Fields** (403 error):
- `corporateEmail`, `universityId`, `role`, `id`

#### JSON Request

**Content-Type**: `application/json`

```cmd
curl -X PATCH http://localhost:3001/users/me ^
  -b "access_token=eyJ..." ^
  -H "Content-Type: application/json" ^
  -d "{\"firstName\":\"Ana María\",\"phone\":\"+573001112244\"}"
```

**Axios**:
```js
import axios from 'axios';
const { data } = await axios.patch('/users/me', 
  { firstName: 'Ana María', phone: '+573001112244' },
  { withCredentials: true }
);
```

#### Multipart Request (with Photo)

**Content-Type**: `multipart/form-data`

**cURL** (use Postman/Insomnia for files):
```cmd
curl -X PATCH http://localhost:3001/users/me ^
  -b "access_token=eyJ..." ^
  -F "firstName=Ana María" ^
  -F "profilePhoto=@./avatar.jpg;type=image/jpeg"
```

**Browser FormData**:
```js
const fd = new FormData();
fd.set('firstName', 'Ana María');
fd.set('profilePhoto', fileInput.files[0]); // must be jpeg/png/webp
const res = await fetch('/users/me', {
  method: 'PATCH',
  body: fd,
  credentials: 'include'
});
const profile = await res.json();
```

**Axios**:
```js
import axios from 'axios';
const fd = new FormData();
fd.set('firstName', 'Ana María');
fd.set('profilePhoto', fileInput.files[0]);
const { data } = await axios.patch('/users/me', fd, { withCredentials: true });
```

---

## Error Responses

### 400 - Invalid Schema
```json
{
  "code": "invalid_schema",
  "message": "Validation failed",
  "details": [
    { "field": "firstName", "issue": "min length 2" },
    { "field": "phone", "issue": "invalid E.164 phone" }
  ]
}
```

### 400 - Invalid File Type
```json
{
  "code": "invalid_file_type",
  "message": "Unsupported MIME type"
}
```

### 401 - Unauthorized
```json
{
  "code": "unauthorized",
  "message": "Missing or invalid session"
}
```

### 403 - Immutable Field
```json
{
  "code": "immutable_field",
  "message": "One or more fields cannot be updated",
  "details": [
    { "field": "corporateEmail", "issue": "immutable" }
  ]
}
```

### 413 - Payload Too Large
```json
{
  "code": "payload_too_large",
  "message": "File exceeds limit"
}
```

---

## Driver Endpoints

### GET /drivers/vehicle

**Get current driver's vehicle information**

**Auth**: Cookie `access_token=<JWT>` (httpOnly)  
**Required Role**: `driver`

**Response (200 OK)**:
```json
{
  "vehicleId": "ABC123",
  "hasVehicle": true
}
```

**Errors**:
- `401 unauthorized`: Missing or invalid session
- `403 forbidden`: User is not a driver

**Example:**
```javascript
const res = await fetch('/drivers/vehicle', { credentials: 'include' });
if (res.status === 403) {
  console.error('Only drivers can access this endpoint');
}
const vehicle = await res.json();
```

---

### POST /drivers/vehicle

**Register a new vehicle for the current driver**

**Auth**: Cookie `access_token=<JWT>`  
**Required Role**: `driver`

**Request Body:**
```json
{
  "vehicleId": "ABC123"
}
```

**Response (201 Created)**:
```json
{
  "vehicleId": "ABC123",
  "hasVehicle": true
}
```

**Errors**:
- `400 invalid_schema`: Missing or invalid vehicleId
- `401 unauthorized`: Missing or invalid session
- `403 forbidden`: User is not a driver

**Example (fetch):**
```javascript
const res = await fetch('/drivers/vehicle', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ vehicleId: 'ABC123' }),
  credentials: 'include'
});

if (res.status === 201) {
  const vehicle = await res.json();
  console.log('Vehicle registered:', vehicle);
}
```

---

### PATCH /drivers/vehicle

**Update current driver's vehicle information**

**Auth**: Cookie `access_token=<JWT>`  
**Required Role**: `driver`

**Request Body:**
```json
{
  "vehicleId": "XYZ789"
}
```

**Response (200 OK)**:
```json
{
  "vehicleId": "XYZ789",
  "hasVehicle": true
}
```

**Errors**:
- `400 invalid_schema`: Missing or invalid vehicleId
- `401 unauthorized`: Missing or invalid session
- `403 forbidden`: User is not a driver

**Example (curl):**
```bash
curl -X PATCH http://localhost:3001/drivers/vehicle \
  -H "Content-Type: application/json" \
  -d '{"vehicleId":"XYZ789"}' \
  -b cookies.txt
```

---

## Error Responses

### Middleware Stack

1. **CORS**: `FRONTEND_ORIGIN` with `credentials: true`
2. **Cookie Parser**: Reads `access_token` httpOnly cookie
3. **Auth** (`requireAuth`): Verifies JWT, attaches `req.user`
4. **Upload Adapter** (`profilePhotoUpload`): Multer with MIME/size validation
5. **Validation** (`validatePatchMe`): Allow-list, immutables, normalization
6. **Route Handler**: DB access, atomic photo replace, sanitized DTO

### Upload Storage

- **Path**: `uploads/<NODE_ENV>/` (or `UPLOADS_ROOT` if set)
- **Naming**: `u_<userId>_<timestamp>_<sanitizedBase>.<ext>`
- **Atomic Replace**: Write new → save doc → delete old
- **Cleanup**: Removes temp file on validation errors

### Security

- **JWT**: Signed with `JWT_SECRET`, 1h expiry
- **Cookies**: HttpOnly, Secure (prod), SameSite lax/none per env
- **CORS**: Restricted to `FRONTEND_ORIGIN`
- **Trust Proxy**: Enabled for secure cookies behind load balancers

---

## Testing

### Run Tests
```cmd
npm test
```

### Contract Tests
Uses `jest-openapi` to validate responses against OpenAPI spec:
- `tests/users.me.openapi.test.ts`: GET 401 unauthorized

### Coverage
- JWT auth (401 unauthorized)
- More tests TBD: PATCH validation, immutable fields, file errors

---

## Development

### Scripts
```cmd
npm run dev          # Start dev server (ts-node-dev)
npm run build        # Compile TypeScript
npm start            # Run compiled JS
npm run typecheck    # TS lint
npm test             # Run Jest tests
npm run token        # Generate JWT for last seeded user
npm run seed:test-user # Seed test user to MongoDB
```

### Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `JWT_SECRET` | *(required)* | JWT signing secret |
| `MONGODB_URI` | *(optional)* | MongoDB connection string |
| `FRONTEND_ORIGIN` | `http://localhost:5173` | CORS allowed origin |
| `MAX_PROFILE_PHOTO_MB` | `5` | Max photo file size |
| `UPLOADS_ROOT` | `uploads/<NODE_ENV>` | Upload storage path |
| `NODE_ENV` | `development` | Environment (affects cookies, uploads) |

---

## Production Deployment

1. Set environment variables:
   - `NODE_ENV=production`
   - `JWT_SECRET` (strong random string)
   - `MONGODB_URI` (Atlas or self-hosted)
   - `FRONTEND_ORIGIN` (your SPA domain)
   - Ensure HTTPS termination (secure cookies require it)

2. Build and run:
   ```bash
   npm run build
   npm start
   ```

3. CORS: Frontend must use `credentials: 'include'` or `withCredentials: true`

4. Uploads: Consider S3/CDN for production (current impl uses local filesystem)

---

## Notes

- **DTO Sanitization**: No internal fields (passwordHash, flags) leaked
- **Immutable Fields**: `corporateEmail`, `universityId`, `role` cannot be changed via PATCH
- **Phone Normalization**: Auto-converts to E.164 using `libphonenumber-js`
- **Allow-list**: Only `firstName`, `lastName`, `phone`, `profilePhoto` accepted; unknown fields rejected
- **Single Source of Truth**: Allow-list and validations centralized in `patchMeValidation.ts`

---

## License

Private - Universidad de La Sabana
