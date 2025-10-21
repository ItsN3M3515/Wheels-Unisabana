import openapi from '../src/openapi.json';
import jestOpenAPI from 'jest-openapi';

// Set up test environment variables
process.env.JWT_SECRET = 'test-secret-key-for-jwt-signing';
process.env.JWT_EXPIRES_IN = '2h';
process.env.JWT_ISSUER = 'wheels-unisabana-test';
process.env.BCRYPT_ROUNDS = '4'; // Lower rounds for faster tests

jestOpenAPI(openapi as any);
