// Generate a temporary JWT for local testing
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET;
if (!secret) {
  console.error('JWT_SECRET is not set. Create backend/.env from .env.example and set a secret.');
  process.exit(1);
}

let sub = process.argv[2];
if (!sub) {
  const lastIdPath = path.resolve(__dirname, 'last_user_id.txt');
  if (fs.existsSync(lastIdPath)) {
    sub = fs.readFileSync(lastIdPath, 'utf8').trim();
  }
}
if (!sub) sub = '665e2a_testf1';

const payload = {
  sub,
  email: 'aruiz@uni.edu',
  role: 'passenger'
};

const token = jwt.sign(payload, secret, { expiresIn: '1h' });
fs.writeFileSync(path.resolve(__dirname, '..', 'token.txt'), token);
console.log(token);
