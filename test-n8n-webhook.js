const http = require('http');

// Test webhook URL (local n8n instance)
const WEBHOOK_URL = 'http://localhost:5678/webhook-test/fcc3c895-f089-4bb6-a23e-3621110f11f7';

// Sample order payload matching your checkout format
const testPayload = {
    orderId: 'TEST-ORDER-' + Date.now(),
    customerName: 'John Doe',
    customerEmail: 'john.doe@example.com',
    productName: 'Modern Sofa Set',
    quantity: 2,
    price: 45000,
    totalAmount: 90000,
    orderDate: new Date().toISOString(),
    shippingAddress: {
        phone: '+91 98765 43210',
        country: 'India',
        address1: '123 Main Street',
        address2: 'Near Central Park',
        city: 'Mumbai',
        state: 'Maharashtra',
        postal: '400001'
    },
    grandTotal: 106470 // Including GST and shipping
};

console.log('🧪 Testing n8n webhook...\n');
console.log('Webhook URL:', WEBHOOK_URL);
console.log('\nPayload:');
console.log(JSON.stringify(testPayload, null, 2));
console.log('\n📡 Sending request...\n');

const payloadString = JSON.stringify(testPayload);

const options = {
    hostname: 'localhost',
    port: 5678,
    path: '/webhook-test/fcc3c895-f089-4bb6-a23e-3621110f11f7',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payloadString)
    }
};

const req = http.request(options, (res) => {
    console.log('✅ Response Status:', res.statusCode, res.statusMessage);
    
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('✅ Response Body:', data);
        console.log('\n✅ Webhook test completed successfully!');
    });
});

req.on('error', (err) => {
    console.error('❌ Webhook test failed:', err.message);
    console.error('\nMake sure:');
    console.error('1. n8n is running on localhost:5678');
    console.error('2. Webhook node is active in n8n workflow');
    console.error('3. Webhook path matches: /webhook-test/fcc3c895-f089-4bb6-a23e-3621110f11f7');
    process.exit(1);
});

req.write(payloadString);
req.end();
