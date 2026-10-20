# Practical 12: Automated Testing and CI/CD Pipeline with GitHub Actions

**CO / PO Mapping:** CO4 / PO3, PO5  
**Objective:** To automate the building, testing, and continuous integration of the Task Management application using a GitHub Actions CI/CD pipeline triggered automatically on every push to the `main` branch, demonstrating both failed and passed pipeline states.

---

## 1. Architectural Overview & CI/CD Concepts

Continuous Integration (CI) and Continuous Delivery/Deployment (CD) are modern DevOps practices that automate software quality assurance:
1. **Automated Testing:** Every code change pushed to version control runs an automated test suite, catching regressions and breaking changes before merging to production.
2. **GitHub Actions Workflows:** Event-driven workflows defined declaratively in YAML under `.github/workflows/`.
3. **Runner Environment:** An isolated Ubuntu virtual machine (`ubuntu-latest`) spun up on demand with Node.js and a MongoDB service container.
4. **Pipeline Steps:**
   - **Checkout Code:** Retrieves repository commits.
   - **Environment Setup:** Installs Node.js runtime.
   - **Dependency Installation:** `npm install` for reproducible dependency trees.
   - **Automated Testing:** Executes `jest` and `supertest` against the Express REST API.
   - **Frontend Build Validation:** Runs `npm run build` to verify Vite bundle compilation.

---

## 2. Implementation Files

### A. Testing Suite (`backend/tests/tasks.test.js`)
Automated test suite using `jest` and `supertest` validating endpoint status codes and responses:

```javascript
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');

describe('Task Management API Tests (Practical 12 CI/CD Pipeline)', () => {
  beforeAll(async () => {
    const MONGO_URI =
      process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/taskmanager';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  // 1. Test GET /tasks endpoint status 200
  test('GET /tasks returns 200', async () => {
    const res = await request(app).get('/tasks');
    expect(res.statusCode).toBe(200);
  });

  // 2. Test GET /api/tasks endpoint structure
  test('GET /api/tasks returns 200 and array of tasks', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // 3. Test POST /tasks task creation
  test('POST /tasks creates a new task and returns 201', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({
        title: 'CI/CD Automated Test Task',
        description: 'Verify automated pipeline testing',
        status: 'pending'
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });
});
```

### B. CI/CD Pipeline Workflow (`.github/workflows/ci.yml`)
GitHub Actions configuration file defining the automated pipeline:

```yaml
name: CI Pipeline

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  build-and-test:
    name: Build & Test Full-Stack App
    runs-on: ubuntu-latest

    services:
      mongodb:
        image: mongo:latest
        ports:
          - 27017:27017

    steps:
      - name: 1. Checkout Code
        uses: actions/checkout@v4

      - name: 2. Setup Node.js 18
        uses: actions/setup-node@v4
        with:
          node-version: 18

      - name: 3. Install Backend Dependencies
        working-directory: backend
        run: npm install

      - name: 4. Run Automated Backend Tests
        working-directory: backend
        env:
          MONGO_URI: mongodb://127.0.0.1:27017/taskmanager_ci
          JWT_SECRET: supersecretjwtkey_awdf_practical7
          NODE_ENV: test
        run: npm test

      - name: 5. Install Frontend Dependencies
        working-directory: frontend
        run: npm install

      - name: 6. Build Frontend Production Bundle
        working-directory: frontend
        run: npm run build
```

---

## 3. Step-by-Step GitHub Execution Procedure

### Step 1: Push Workflow to GitHub
1. Create a repository on your GitHub account (e.g., `task-manager-app`).
2. In your terminal at `task-manager-app`:
   ```powershell
   git add .
   git commit -m "feat: initial commit with GitHub Actions CI pipeline"
   git remote add origin https://github.com/<YOUR-USERNAME>/task-manager-app.git
   git push -u origin main
   ```
3. Open GitHub in your browser, navigate to the **Actions** tab, and confirm that the `CI Pipeline` workflow is detected and running.

---

### Step 2: Demonstrate Failed Pipeline (Red ❌)
1. Open `backend/tests/tasks.test.js` in VS Code.
2. Deliberately modify the expected status code in test 1:
   ```javascript
   test('GET /tasks returns 200', async () => {
     const res = await request(app).get('/tasks');
     // DELIBERATE FAILURE: Expect 500 instead of 200
     expect(res.statusCode).toBe(500);
   });
   ```
3. Commit and push the broken test:
   ```powershell
   git commit -am "test: deliberate failure to demonstrate CI pipeline breakdown"
   git push
   ```
4. Open the **Actions** tab on GitHub:
   - Observe the **Red ❌** showing that `Run Automated Backend Tests` failed with an exit code of 1.
   - Click into the job to view the exact error details:
     `Expected: 500 | Received: 200`.

---

### Step 3: Demonstrate Fixed Pipeline (Green ✅)
1. Correct the test assertion back to `200`:
   ```javascript
   test('GET /tasks returns 200', async () => {
     const res = await request(app).get('/tasks');
     expect(res.statusCode).toBe(200);
   });
   ```
2. Commit and push the fix:
   ```powershell
   git commit -am "fix: restore expected status code to 200"
   git push
   ```
3. Refresh the **Actions** tab on GitHub:
   - Observe the workflow turn **Green ✅**.
   - All steps (`Install Backend Dependencies`, `Run Automated Backend Tests`, `Build Frontend Production Bundle`) pass successfully.

---

## 4. Required Screenshots for Practical 12 Report

| Figure # | Caption | What to Capture |
|---|---|---|
| **Figure 1** | *`tests/tasks.test.js` - Automated Test Suite* | VS Code showing the Jest & Supertest test cases for `GET /tasks`, `GET /api/tasks`, and `POST /tasks`. |
| **Figure 2** | *`.github/workflows/ci.yml` - CI Pipeline Specification* | VS Code showing the full GitHub Actions workflow YAML file with service container and steps. |
| **Figure 3** | *Local Terminal: Passing Jest Test Run* | Terminal running `npm test` in the `backend` folder showing `3 passed, 3 total`. |
| **Figure 4** | *GitHub Actions: Deliberate Pipeline Failure (Red ❌)* | GitHub browser view of the Actions tab showing the failed pipeline run with a **Red ❌** and the error log showing `Expected: 500 | Received: 200`. |
| **Figure 5** | *GitHub Actions: Corrected Passing Pipeline (Green ✅)* | GitHub browser view of the Actions tab showing the fixed pipeline run with a **Green ✅** and all steps completed. |
| **Figure 6** | *Git Commit History Showing Progression* | Terminal output of `git log --oneline -n 4` showing the commit sequence: setup CI -> deliberate failure -> fix test. |

---

## 5. Summary of CI/CD Benefits Demonstrated

1. **Immediate Feedback:** Developers receive automated feedback on regressions within 60 seconds of pushing code.
2. **Deterministic Build Verification:** Validates that dependencies install cleanly and the frontend compiles without syntax or TypeScript/Vite bundle errors.
3. **Continuous Quality Gate:** Prevents faulty or non-working code from reaching deployment branches.
