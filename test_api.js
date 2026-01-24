import http from 'http';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from backend/.env
dotenv.config({ path: join(__dirname, 'backend', '.env') });

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin123';

console.log(`Using ADMIN_TOKEN from .env: ${ADMIN_TOKEN}`);

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/admin/dashboard/stats',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${ADMIN_TOKEN}`
  }
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:');
    console.log(JSON.stringify(JSON.parse(data), null, 2));
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
  process.exit(1);
});

req.end();
