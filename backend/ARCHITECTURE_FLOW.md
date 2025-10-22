# GET /auth/me - Architecture Flow

## Request Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser/App)                       │
│                                                                         │
│  const res = await fetch('/auth/me', { credentials: 'include' });     │
│  if (res.ok) { const user = await res.json(); }                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ GET /auth/me
                                    │ Cookie: access_token=eyJ...
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          EXPRESS MIDDLEWARE STACK                       │
│                                                                         │
│  1. correlationId       → Attach unique ID to request                  │
│  2. structuredLogger    → Log request (method, path, IP)               │
│  3. authenticate        → Verify JWT cookie                            │
│                           ├─ Extract access_token cookie                │
│                           ├─ Verify JWT signature                       │
│                           ├─ Check expiry                               │
│                           └─ Set req.user = { id, role, email }        │
│                                                                         │
│  ✅ If valid: continue to controller                                    │
│  ❌ If invalid: return 401 { code: "unauthorized" }                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ req.user = { id, role, email }
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        CONTROLLER (authController.js)                   │
│                                                                         │
│  async getMe(req, res) {                                               │
│    1. Extract userId from req.user.id                                  │
│    2. Call AuthService.getCurrentUserProfile(userId)                   │
│    3. Set Cache-Control: no-store header                               │
│    4. Return 200 with minimal DTO                                      │
│                                                                         │
│    Error Handling:                                                     │
│    - user_not_found → 401 unauthorized                                 │
│    - internal error → 500 internal_error                               │
│  }                                                                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ userId
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER (AuthService.js)                     │
│                                                                         │
│  async getCurrentUserProfile(userRepo, vehicleRepo, userId) {          │
│    1. Fetch user from database by ID                                   │
│    2. If not found: throw user_not_found error                         │
│    3. If role === 'driver':                                            │
│       └─ Check if vehicle exists for driver                            │
│    4. Build minimal DTO:                                               │
│       {                                                                │
│         id, role, firstName, lastName,                                 │
│         driver: { hasVehicle } // only for drivers                     │
│       }                                                                │
│    5. Return DTO                                                       │
│  }                                                                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
┌────────────────────────────────┐  ┌────────────────────────────────┐
│  MongoUserRepository           │  │  MongoVehicleRepository        │
│                                │  │                                │
│  findById(userId)              │  │  findByDriverId(driverId)      │
│    ↓                           │  │    ↓                           │
│  UserModel.findById()          │  │  VehicleModel.findOne()        │
│    ↓                           │  │    ↓                           │
│  User.fromDocument()           │  │  Vehicle.fromDocument()        │
│    ↓                           │  │    ↓                           │
│  return User entity            │  │  return Vehicle | null         │
└────────────────────────────────┘  └────────────────────────────────┘
                    │                               │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                            User + hasVehicle
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                             RESPONSE TO CLIENT                          │
│                                                                         │
│  HTTP/1.1 200 OK                                                       │
│  Cache-Control: no-store                                               │
│  Content-Type: application/json                                        │
│                                                                         │
│  {                                                                     │
│    "id": "665e2a...f1",                                                │
│    "role": "driver",                                                   │
│    "firstName": "John",                                                │
│    "lastName": "Doe",                                                  │
│    "driver": {                                                         │
│      "hasVehicle": true                                                │
│    }                                                                   │
│  }                                                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

## Error Flow (401 Unauthorized)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser/App)                       │
│                                                                         │
│  const res = await fetch('/auth/me'); // No cookie or invalid token   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ GET /auth/me
                                    │ Cookie: (missing or invalid)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          EXPRESS MIDDLEWARE STACK                       │
│                                                                         │
│  authenticate middleware:                                              │
│    ├─ No cookie found                                                  │
│    │  OR                                                                │
│    ├─ JWT signature invalid                                            │
│    │  OR                                                                │
│    └─ JWT expired                                                      │
│                                                                         │
│  ❌ Return 401 immediately (controller never called)                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                             RESPONSE TO CLIENT                          │
│                                                                         │
│  HTTP/1.1 401 Unauthorized                                             │
│  Content-Type: application/json                                        │
│                                                                         │
│  {                                                                     │
│    "code": "unauthorized",                                             │
│    "message": "Missing or invalid session",                            │
│    "correlationId": "abc-123-def-456"                                  │
│  }                                                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 1: Transport Security                                            │
│   ✅ HTTPS in production (Secure cookie flag)                           │
│   ✅ SameSite cookie (CSRF protection)                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 2: Authentication                                                │
│   ✅ JWT verification (signature + expiry)                              │
│   ✅ HttpOnly cookie (XSS protection)                                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 3: Authorization                                                 │
│   ✅ User can only see their own profile (implicit by JWT)              │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 4: Data Privacy                                                  │
│   ✅ Minimal data exposure (only 4-5 fields)                            │
│   ✅ No secrets in response                                             │
│   ✅ Cache-Control: no-store                                            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 5: Observability                                                 │
│   ✅ PII redaction in logs                                              │
│   ✅ Correlation IDs for tracing                                        │
│   ✅ Structured logging                                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

## Database Schema

```
┌────────────────────────────────┐
│         users collection       │
├────────────────────────────────┤
│ _id: ObjectId                  │
│ firstName: String              │ ◄── Included in response
│ lastName: String               │ ◄── Included in response
│ role: 'driver' | 'passenger'   │ ◄── Included in response
│ universityId: String           │
│ corporateEmail: String         │
│ phone: String                  │
│ password: String (bcrypt)      │ ◄── NEVER exposed
│ profilePhoto: String           │
│ createdAt: Date                │
│ updatedAt: Date                │
└────────────────────────────────┘
                │
                │ If role === 'driver'
                │ Check vehicles collection
                ▼
┌────────────────────────────────┐
│      vehicles collection       │
├────────────────────────────────┤
│ _id: ObjectId                  │
│ driverId: ObjectId             │ ◄── Query by this
│ plate: String                  │
│ brand: String                  │
│ model: String                  │
│ year: Number                   │
│ color: String                  │
│ soatExpiry: Date               │
│ tecnicomechanicaExpiry: Date   │
└────────────────────────────────┘
                │
                ▼
    vehicle ? hasVehicle=true : hasVehicle=false
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              LOAD BALANCER                              │
│                         (HTTPS termination)                             │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
        ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
        │ Node.js      │  │ Node.js      │  │ Node.js      │
        │ Instance 1   │  │ Instance 2   │  │ Instance 3   │
        │              │  │              │  │              │
        │ GET /auth/me │  │ GET /auth/me │  │ GET /auth/me │
        │ (Stateless)  │  │ (Stateless)  │  │ (Stateless)  │
        └──────────────┘  └──────────────┘  └──────────────┘
                    │               │               │
                    └───────────────┼───────────────┘
                                    │
                                    ▼
                    ┌─────────────────────────────┐
                    │   MongoDB Atlas Cluster     │
                    │   (users + vehicles)        │
                    │                             │
                    │   - Automatic scaling       │
                    │   - Replication             │
                    │   - Backups                 │
                    └─────────────────────────────┘
```

## Key Design Decisions

### 1. Why httpOnly Cookie?
```
✅ XSS Protection: JavaScript cannot access token
✅ Automatic: Browser sends cookie on every request
✅ Secure: Can't be stolen via client-side code
❌ CORS: Requires credentials: 'include'
```

### 2. Why Cache-Control: no-store?
```
✅ Security: Prevents caching of sensitive data
✅ Fresh Data: Always fetches current session
❌ Performance: Small latency increase (acceptable)
```

### 3. Why Minimal DTO?
```
✅ Performance: Small payload (< 200 bytes)
✅ Privacy: Less data exposure = less risk
✅ Simplicity: Easy to understand and test
❌ Limited: May need separate endpoints for more data
```

### 4. Why Service Layer?
```
✅ Testability: Business logic isolated
✅ Reusability: Can be called from other controllers
✅ Maintainability: Single source of truth
❌ Complexity: Extra layer (minimal overhead)
```

## Monitoring Dashboard (Suggested)

```
┌───────────────────────────────────────────────────────────────┐
│ GET /auth/me - Live Metrics                                  │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  Requests/sec:  ████████░░░░  245 req/s                      │
│  Success Rate:  ████████████  99.8% (200)                    │
│  Error Rate:    ░░░░░░░░░░░░   0.2% (401/500)               │
│                                                               │
│  Response Time:                                               │
│    p50:  12ms  ████░░░░░░░░                                  │
│    p95:  35ms  ██████████░░                                  │
│    p99:  78ms  ████████████████░░                            │
│                                                               │
│  Status Codes (last 5min):                                    │
│    200: ████████████████████████████  14,567                 │
│    401: ██░░░░░░░░░░░░░░░░░░░░░░░░░░     29                 │
│    500: ░░░░░░░░░░░░░░░░░░░░░░░░░░░░      0                 │
│                                                               │
│  Top Errors:                                                  │
│    - unauthorized (29 occurrences)                            │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

## Future Enhancements

### Phase 1: Current Implementation ✅
- JWT-based authentication
- Minimal identity DTO
- hasVehicle flag for drivers

### Phase 2: Possible Additions
- Include profile photo URL
- Add email verification status
- Return last login timestamp

### Phase 3: Advanced Features
- Real-time updates (WebSocket)
- Token refresh mechanism
- Multi-device session management
- Push notification preferences

---

**Last Updated:** October 21, 2025  
**Status:** ✅ Production Ready
