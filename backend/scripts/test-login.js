const http = require('http');

function makeRequest(data) {
  const postData = JSON.stringify(data);
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: JSON.parse(body)
        });
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function testLogin() {
  console.log('\n=== Testing POST /auth/login ===\n');

  // Test 1: Missing email
  console.log('Test 1: Missing corporateEmail');
  const test1 = await makeRequest({ password: 'test' });
  console.log(`Status: ${test1.status}`);
  console.log(`Body: ${JSON.stringify(test1.body, null, 2)}`);
  console.log(`Expected: 400 with invalid_schema`);
  console.log(`✓ Pass: ${test1.status === 400 && test1.body.code === 'invalid_schema'}\n`);

  // Test 2: Invalid email format
  console.log('Test 2: Invalid email format');
  const test2 = await makeRequest({ corporateEmail: 'not-an-email', password: 'test' });
  console.log(`Status: ${test2.status}`);
  console.log(`Body: ${JSON.stringify(test2.body, null, 2)}`);
  console.log(`Expected: 400 with invalid_schema`);
  console.log(`✓ Pass: ${test2.status === 400 && test2.body.code === 'invalid_schema'}\n`);

  // Test 3: Missing password
  console.log('Test 3: Missing password');
  const test3 = await makeRequest({ corporateEmail: 'test@uni.edu' });
  console.log(`Status: ${test3.status}`);
  console.log(`Body: ${JSON.stringify(test3.body, null, 2)}`);
  console.log(`Expected: 400 with invalid_schema`);
  console.log(`✓ Pass: ${test3.status === 400 && test3.body.code === 'invalid_schema'}\n`);

  // Test 4: Non-existent user
  console.log('Test 4: Non-existent user');
  const test4 = await makeRequest({ corporateEmail: 'nonexistent@uni.edu', password: 'test123' });
  console.log(`Status: ${test4.status}`);
  console.log(`Body: ${JSON.stringify(test4.body, null, 2)}`);
  console.log(`Expected: 401 with invalid_credentials`);
  console.log(`✓ Pass: ${test4.status === 401 && test4.body.code === 'invalid_credentials'}\n`);

  // Test 5: Rate limiting (make 6 requests)
  console.log('Test 5: Rate limiting (making 6 requests in quick succession)');
  for (let i = 1; i <= 6; i++) {
    const test = await makeRequest({ corporateEmail: 'ratelimit@uni.edu', password: 'test' });
    console.log(`Request ${i}: Status ${test.status}, Code: ${test.body.code}`);
    if (i === 6 && test.status === 429) {
      console.log(`✓ Pass: Rate limit triggered on 6th request\n`);
    }
  }

  console.log('=== All tests completed ===\n');
}

testLogin().catch(console.error);
