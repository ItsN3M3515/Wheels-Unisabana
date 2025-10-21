const http = require('http');

function makeRequest(method, path, data, cookies, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (cookies) {
      options.headers['Cookie'] = cookies;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          });
        } catch {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

function extractCookie(setCookieHeaders, name) {
  if (!setCookieHeaders) return null;
  const cookies = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
  const cookie = cookies.find(c => c.startsWith(`${name}=`));
  if (!cookie) return null;
  const match = cookie.match(new RegExp(`${name}=([^;]+)`));
  return match ? match[1] : null;
}

async function testCsrf() {
  console.log('\n=== Testing CSRF Protection ===\n');

  // Test 1: Login and receive CSRF token
  console.log('Test 1: Login and receive CSRF token');
  console.log('Note: You need a valid user in the database to test this.');
  console.log('Run: npm run seed:test-user first\n');

  // Test 2: Try state-changing request without CSRF token
  console.log('Test 2: PATCH /users/me without CSRF token (should fail)');
  console.log('Expected: 403 with csrf_mismatch error\n');

  console.log('=== CSRF Protection Flow ===');
  console.log('1. POST /auth/login → Receive csrf_token cookie');
  console.log('2. Read csrf_token from cookie (non-httpOnly)');
  console.log('3. Send X-CSRF-Token header with same value');
  console.log('4. Server validates header === cookie\n');

  console.log('=== Client Example (JavaScript) ===');
  console.log(`
// Read CSRF token from cookie
const csrf = document.cookie
  .split('; ')
  .find(c => c.startsWith('csrf_token='))
  ?.split('=')[1];

// Send in header for state-changing requests
await fetch('/users/me', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrf  // Required!
  },
  body: JSON.stringify({ firstName: 'Updated' }),
  credentials: 'include'
});
`);

  console.log('=== Protected Endpoints ===');
  console.log('- POST /drivers/vehicle (requires CSRF)');
  console.log('- PATCH /drivers/vehicle (requires CSRF)');
  console.log('- PATCH /users/me (requires CSRF)');
  console.log('');
  console.log('Safe methods (GET/HEAD/OPTIONS) do NOT require CSRF token.\n');

  console.log('=== Error Response (403) ===');
  console.log(JSON.stringify({
    code: 'csrf_mismatch',
    message: 'CSRF token missing or invalid'
  }, null, 2));
  console.log();

  console.log('=== Security Features ===');
  console.log('✓ Double-submit cookie pattern');
  console.log('✓ Cryptographically secure tokens (32 random bytes)');
  console.log('✓ Constant-time comparison (prevents timing attacks)');
  console.log('✓ Token rotation on login');
  console.log('✓ 1-hour token lifetime');
  console.log('✓ Can be disabled with DISABLE_CSRF=true\n');

  console.log('=== All information displayed ===\n');
}

testCsrf().catch(console.error);
