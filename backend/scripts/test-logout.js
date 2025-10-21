const http = require('http');

function makeRequest(method, path, data, cookie) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (cookie) {
      options.headers['Cookie'] = `access_token=${cookie}`;
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

async function testLogout() {
  console.log('\n=== Testing POST /auth/logout ===\n');

  // Test 1: Basic logout (no session)
  console.log('Test 1: Logout without session');
  const test1 = await makeRequest('POST', '/auth/logout');
  console.log(`Status: ${test1.status}`);
  console.log(`Body: ${JSON.stringify(test1.body, null, 2)}`);
  console.log(`Expected: 200 with { ok: true }`);
  console.log(`✓ Pass: ${test1.status === 200 && test1.body.ok === true}`);
  
  // Check Set-Cookie header
  const setCookie = test1.headers['set-cookie'];
  if (setCookie) {
    console.log(`Set-Cookie header: ${setCookie[0]}`);
    console.log(`✓ Contains Max-Age=0: ${setCookie[0].includes('Max-Age=0')}`);
    console.log(`✓ Contains HttpOnly: ${setCookie[0].includes('HttpOnly')}`);
    console.log(`✓ Contains Path=/: ${setCookie[0].includes('Path=/')}`);
  }
  console.log();

  // Test 2: Logout with valid token
  console.log('Test 2: Logout with existing token (if you have one)');
  console.log('To test with a real token:');
  console.log('1. Login first: POST /auth/login with valid credentials');
  console.log('2. Extract the access_token from Set-Cookie header');
  console.log('3. Call POST /auth/logout with that cookie');
  console.log('4. Verify the cookie is cleared with Max-Age=0\n');

  console.log('=== Integration Flow Example ===');
  console.log('1. POST /auth/login → Receive access_token cookie');
  console.log('2. GET /users/me → Works with cookie');
  console.log('3. POST /auth/logout → Cookie cleared with Max-Age=0');
  console.log('4. GET /users/me → 401 unauthorized (no cookie)\n');

  console.log('Note: For stateless JWT, the token remains valid until expiry.');
  console.log('To enforce immediate invalidation, implement a token denylist.');
  console.log();

  console.log('=== All tests completed ===\n');
}

testLogout().catch(console.error);
