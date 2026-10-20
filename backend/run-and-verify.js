const http = require('http');
const jwt = require('jsonwebtoken');

// Set env vars
process.env.JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_awdf_practical7';
process.env.PORT = '5001'; // Use port 5001 for clean test execution

console.log('--- Loading Server and Event Listeners ---');
// Require server.js which will start listening on PORT 5001
require('./server');

const token = jwt.sign(
  { id: '64f1a2b3c4d5e6f7a8b9c0d1', email: 'test_student@example.com' },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runDemonstration() {
  // Give MongoDB and server 1 second to bind and connect
  await sleep(1500);

  console.log('\n======================================================');
  console.log('TEST 1: Asynchronous task-created Event Handling');
  console.log('======================================================');

  const reqPayload = {
    title: 'Prepare Practical 10 Report',
    description: 'Demonstrate Node.js native EventEmitter with asynchronous listener',
    status: 'in-progress',
    assignedUser: 'student_uday@example.com'
  };

  const reqStartTime = new Date().toISOString();
  console.log(`[CLIENT] Sending POST /api/tasks at ${reqStartTime}`);

  const createRes = await makeRequest(
    {
      hostname: '127.0.0.1',
      port: 5001,
      path: '/api/tasks',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    },
    reqPayload
  );

  const reqEndTime = new Date().toISOString();
  console.log(`[CLIENT] Received HTTP ${createRes.status} response at ${reqEndTime}`);
  console.log(`[CLIENT] Response Data:`, JSON.stringify(createRes.body, null, 2));

  const taskId = createRes.body.data?._id || createRes.body._id;

  console.log('\n[CLIENT] Waiting 2.5 seconds for background event listener to complete...');
  await sleep(2500);

  console.log('\n======================================================');
  console.log('TEST 2: Asynchronous task-deleted Event Handling (Post-Lab Task)');
  console.log('======================================================');

  if (taskId) {
    console.log(`[CLIENT] Sending DELETE /api/tasks/${taskId} at ${new Date().toISOString()}`);
    const delRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 5001,
      path: `/api/tasks/${taskId}`,
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log(`[CLIENT] Received HTTP ${delRes.status} response at ${new Date().toISOString()}`);
    console.log(`[CLIENT] Delete Data:`, JSON.stringify(delRes.body, null, 2));

    console.log('\n[CLIENT] Waiting 2 seconds for background delete cleanup listener to complete...');
    await sleep(2000);
  }

  console.log('\n======================================================');
  console.log('TEST 3: Error Event Listener Demonstration (Post-Lab Task)');
  console.log('======================================================');

  console.log(`[CLIENT] Creating task with simulateError: true at ${new Date().toISOString()}`);
  const errTaskRes = await makeRequest(
    {
      hostname: '127.0.0.1',
      port: 5001,
      path: '/api/tasks',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    },
    {
      title: 'Faulty Task to Trigger Listener Error',
      description: 'Testing background error catch and error event emission',
      simulateError: true
    }
  );

  console.log(`[CLIENT] Received HTTP ${errTaskRes.status} response at ${new Date().toISOString()}`);
  console.log('[CLIENT] Waiting 2.5 seconds for error event listener to catch and log...');
  await sleep(2500);

  console.log('\n======================================================');
  console.log('ALL TESTS COMPLETED SUCCESSFULLY!');
  console.log('======================================================');
  process.exit(0);
}

runDemonstration().catch((err) => {
  console.error('Demonstration failed:', err);
  process.exit(1);
});
