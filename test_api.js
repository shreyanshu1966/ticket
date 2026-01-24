import http from 'http';

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/admin/dashboard/stats',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer admin123'
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
