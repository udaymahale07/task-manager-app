# Practical 13: AI API Integration into a Web Application

**Objective:** To integrate an external AI service into the existing Task Management web application, ensure secure API key management on the backend, handle external service failures gracefully, and understand responsible AI usage.

---

## 1. Architectural Overview & Responsible AI Concepts

Integrating Large Language Model (LLM) APIs (such as OpenAI or Google Gemini) into web applications introduces key architectural and ethical considerations:

### A. Backend Proxy Pattern (Secure Key Management)
- **Principle:** API keys (`OPENAI_API_KEY`) represent sensitive billing and authentication credentials.
- **Security Rule:** The API key is stored exclusively in the backend `.env` file and accessed via `process.env.OPENAI_API_KEY`. It is **never** bundled or exposed to the frontend browser network tab.
- **Flow:** The React frontend sends a request with only the `title` to the Express backend (`POST /api/ai/generate-description`). The backend securely forwards the prompt to OpenAI and relays the text back to the frontend.

### B. Graceful Degradation & Failure Handling
- External AI APIs can experience rate limits, network timeouts, or invalid keys.
- If the AI request fails, the backend catches the exception in a `try...catch` block and returns a fallback response (`{ fallback: true, error: ... }`) instead of a 500 error.
- The React application continues functioning normally, allowing users to enter task descriptions manually without interruption or crashes.

### C. Responsible AI Principles
1. **Editable Suggestions:** AI outputs are populated into editable input fields rather than permanently committed, giving users full agency to accept, revise, or discard suggestions.
2. **Loading States:** Clear visual feedback (`✨ Generating…` state with disabled buttons) informs the user that an asynchronous AI request is in progress.
3. **Transparent Disclaimers:** A prominent disclaimer alerts the user that the content was machine-generated and must be verified for accuracy before submission.

---

## 2. Implementation Files

### A. Backend AI Router (`backend/routes/aiRoutes.js`)
Handles the description generation, interacts with the OpenAI SDK, and implements graceful failure handling:

```javascript
const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

router.post('/generate-description', async (req, res) => {
  const { title, simulateFailure } = req.body || {};

  if (!title || !title.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Please enter a task title first to generate an AI description.'
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  try {
    if (simulateFailure || !apiKey || apiKey.startsWith('sk-invalid')) {
      throw new Error('401 Unauthorized: Invalid API key provided (Failure Path Demonstration).');
    }

    const client = new OpenAI({ apiKey, timeout: 10000 });
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant in a task management app. Generate a single, concise (1-2 sentences), actionable task description based on the title.'
        },
        {
          role: 'user',
          content: `Write a short task description for: "${title.trim()}"`
        }
      ],
      max_tokens: 80
    });

    const description = completion.choices[0]?.message?.content?.trim() || '';

    return res.status(200).json({
      success: true,
      description,
      fallback: false,
      disclaimer: 'AI-generated content. Please review and edit before saving.'
    });
  } catch (err) {
    console.error(`[AI Service Notice] Error generating description: ${err.message}`);

    // Graceful fallback: Core application continues working smoothly
    return res.status(200).json({
      success: false,
      description: '',
      fallback: true,
      error: 'AI service unavailable. Please write a description manually.',
      disclaimer: 'AI generation failed. Fallback to manual entry.'
    });
  }
});

module.exports = router;
```

### B. Backend Environment Variable (`backend/.env`)
Stores the secret key securely:
```env
JWT_SECRET=supersecretjwtkey_awdf_practical7
OPENAI_API_KEY=your_key_here
```

### C. Frontend API Client (`frontend/src/api/taskApi.js`)
```javascript
export const generateAiDescription = (title, options = {}) =>
  axios.post("http://localhost:5000/api/ai/generate-description", { title, ...options });
```

### D. Frontend Component with AI Integration (`frontend/src/components/NewTaskForm.jsx`)
Features:
- **`✨ AI Generate`** button triggering the backend AI route.
- **Loading State:** Disabled button with `"✨ Generating…"` label during network roundtrip.
- **Editable Suggestion:** Fills the input field for direct editing.
- **Responsible AI Disclaimer:** Visible badge informing users that content was AI-generated.
- **`🧪 Test Failure Path` Button:** Demonstrates graceful fallback message without server/app crash.

---

## 3. How to Run and Test

1. Start the Backend:
   ```powershell
   cd backend
   node server.js
   ```
2. Start the Frontend:
   ```powershell
   cd frontend
   npm run dev
   ```
3. Open `http://localhost:5173` (or `http://localhost:3000`) in your browser.

---

## 4. Required Screenshots for Practical 13 Report

Capture the following screenshots for your lab submission:

| Figure # | Caption | What to Capture in the Screenshot |
|---|---|---|
| **Figure 1** | *Backend AI Route & Secure `.env` Storage* | Split view in VS Code showing [`backend/routes/aiRoutes.js`](file:///c:/Users/udaym/Documents/SEM5/AWDF/task-manager-app/backend/routes/aiRoutes.js) using `process.env.OPENAI_API_KEY` and [`backend/.env`](file:///c:/Users/udaym/Documents/SEM5/AWDF/task-manager-app/backend/.env) (proving the key is never sent to the browser). |
| **Figure 2** | *Frontend AI Loading State* | Browser screenshot at `http://localhost:5173` showing the task creation form with the title entered and the AI button in the loading state: **`✨ Generating…`** (disabled). |
| **Figure 3** | *AI Generated Description & Responsible AI Disclaimer* | Browser screenshot showing: <br>1. Auto-generated description populated into the editable field.<br>2. Purple success notification.<br>3. **Responsible AI Disclaimer banner** stating: *"This description was generated by an AI model. Please review, edit, and ensure accuracy before saving."* |
| **Figure 4** | *Graceful Error Handling / Fallback Path* | Browser screenshot after clicking **`🧪 Test Failure Path`** (or testing with an invalid API key in `.env`) showing the amber alert: <br>*"⚠️ AI service unavailable. Please enter a manual description."* and demonstrating that the app remains fully functional without crashing. |
| **Figure 5** | *Postman API Test (`POST /api/ai/generate-description`)* | Postman sending `POST http://localhost:5000/api/ai/generate-description` with JSON body `{"title": "Implement User Authentication"}` returning status `200 OK` and generated description. |
| **Figure 6** | *Terminal Test Suite Verification* | Terminal running `npm test` in the `backend` directory showing all 4 tests passing (including the Practical 13 AI integration test). |
