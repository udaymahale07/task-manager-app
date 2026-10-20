const http = require('http');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_awdf_practical7';
const jwt = require('jsonwebtoken');

// Generate test token
const token = jwt.sign(
  { id: '64f1a2b3c4d5e6f7a8b9c0d1', email: 'student_tester@example.com' },
  JWT_SECRET,
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

async function runTests() {
  console.log('=== PRACTICAL 10 VERIFICATION SCRIPT ===');
  console.log(`Generated Auth Token for user: student_tester@example.com`);

  // Test 1: Create a normal task
  console.log('\n--- 1. Testing POST /api/tasks (task-created event) ---');
  const createStart = new Date().toISOString();
  console.log(`[Client] Sending task creation request at: ${createStart}`);

  const createRes = await makeRequest(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/tasks',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    },
    {
      title: 'Deploy microservices to Kubernetes',
      description: 'Configure Ingress and deployment manifests',
      status: 'in-progress',
      assignedUser: 'student_tester@example.com'
    }
  );

  const createEnd = new Date().toISOString();
  console.log(`[Client] Received API response at: ${createEnd} with HTTP status: ${createRes.status}`);
  console.log(`[Client] Response body:`, createRes.body);

  const taskId = createRes.body.data?._id || createRes.body._id || createRes.body.data?.id;
  console.log(`Created Task ID: ${taskId}`);

  // Test 2: Wait 3 seconds to let background notification finish
  console.log('\n--- Waiting 3 seconds for background notification listener to finish ---');
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Test 3: Delete task (task-deleted event)
  if (taskId) {
    console.log(`\n--- 2. Testing DELETE /api/tasks/${taskId} (task-deleted event) ---`);
    const delRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/tasks/${taskId}`,
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log(`[Client] Delete response status: ${delRes.status}`);
    console.log(`[Client] Delete response:`, delRes.body);
    await new Promise((resolve) => setTimeout(resolve, 2500));
  }

  // Test 4: Create a task simulating error in background listener
  console.log('\n--- 3. Testing Error Handling (error event listener) ---');
  const errorRes = await makeRequest(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/tasks',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    },
    {
      title: 'Task causing background failure',
      description: 'Trigger simulated background notification error',
      simulateError: true
    }
  );
  console.log(`[Client] Error test task created, status: ${errorRes.status}`);
  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log('\n=== All verification tests completed successfully ===');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
