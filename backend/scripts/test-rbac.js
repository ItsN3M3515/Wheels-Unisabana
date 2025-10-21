const http = require('http');

// Helper to make HTTP requests
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

async function testRBAC() {
  console.log('\n=== Testing RBAC Middleware ===\n');

  // Test 1: Access protected endpoint without token
  console.log('Test 1: GET /users/me without token');
  const test1 = await makeRequest('GET', '/users/me');
  console.log(`Status: ${test1.status}`);
  console.log(`Body: ${JSON.stringify(test1.body, null, 2)}`);
  console.log(`✓ Expected 401: ${test1.status === 401}\n`);

  // Test 2: Access driver endpoint without token
  console.log('Test 2: GET /drivers/vehicle without token');
  const test2 = await makeRequest('GET', '/drivers/vehicle');
  console.log(`Status: ${test2.status}`);
  console.log(`Body: ${JSON.stringify(test2.body, null, 2)}`);
  console.log(`✓ Expected 401: ${test2.status === 401}\n`);

  // Test 3: Invalid token
  console.log('Test 3: GET /users/me with invalid token');
  const test3 = await makeRequest('GET', '/users/me', null, 'invalid-token');
  console.log(`Status: ${test3.status}`);
  console.log(`Body: ${JSON.stringify(test3.body, null, 2)}`);
  console.log(`✓ Expected 401: ${test3.status === 401}\n`);

  console.log('=== RBAC Tests Completed ===');
  console.log('\nTo test with valid tokens:');
  console.log('1. Run: npm run seed:test-user');
  console.log('2. Run: npm run token');
  console.log('3. Use the generated token in your requests\n');
  console.log('Example:');
  console.log('  curl -X GET http://localhost:3001/users/me -b "access_token=YOUR_TOKEN"\n');
}

testRBAC().catch(console.error);
