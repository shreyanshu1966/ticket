import http from 'http';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read .env file from backend directory
let ADMIN_TOKEN = 'admin123';
try {
  const envPath = join(__dirname, 'backend', '.env');
  const envContent = readFileSync(envPath, 'utf8');
  const tokenMatch = envContent.match(/ADMIN_TOKEN=(.+)/);
  if (tokenMatch) {
    ADMIN_TOKEN = tokenMatch[1].trim();
  }
  console.log(`Using ADMIN_TOKEN from .env: ${ADMIN_TOKEN}`);
} catch (err) {
  console.log(`Could not read .env file, using default token`);
}

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
