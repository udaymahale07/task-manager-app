const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

/**
 * Smart contextual fallback generator for lab testing without external API credits
 */
function generateContextualSuggestion(title) {
  const lower = title.toLowerCase();
  if (lower.includes('api') || lower.includes('endpoint')) {
    return 'Design and implement RESTful API endpoints with input validation and structured JSON responses.';
  }
  if (lower.includes('auth') || lower.includes('login') || lower.includes('jwt')) {
    return 'Implement secure user authentication, token generation, and password hashing using bcrypt and JWT.';
  }
  if (lower.includes('database') || lower.includes('mongo') || lower.includes('schema')) {
    return 'Define Mongoose schema, establish database connection, and configure document validation rules.';
  }
  if (lower.includes('docker') || lower.includes('container')) {
    return 'Containerize services using Dockerfiles and orchestrate multi-container stack via Docker Compose.';
  }
  if (lower.includes('test') || lower.includes('jest') || lower.includes('ci')) {
    return 'Write automated unit and integration tests, then verify pipeline execution in CI workflow.';
  }
  if (lower.includes('frontend') || lower.includes('ui') || lower.includes('react')) {
    return 'Develop responsive user interface components with state management and dynamic user feedback.';
  }
  return `Outline specifications, implement the required functionality, and verify end-to-end for "${title.trim()}".`;
}

/**
 * POST /api/ai/generate-description
 * Generates an AI-powered task description based on the provided task title.
 * - Stores API key securely on backend (.env)
 * - Handles errors gracefully without crashing the server
 */
router.post('/generate-description', async (req, res) => {
  const { title, simulateFailure, useFallback } = req.body || {};

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Please enter a task title first to generate an AI description.'
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  try {
    // Step 6 Test: Explicit failure simulation or testing with invalid placeholder key
    if (
      simulateFailure ||
      !apiKey ||
      apiKey === 'your_key_here' ||
      apiKey.startsWith('sk-invalid')
    ) {
      if (simulateFailure || apiKey?.startsWith('sk-invalid')) {
        throw new Error('401 Unauthorized: Invalid API key provided (Simulated Failure Path).');
      }

      // If key is not yet configured, provide contextual fallback suggestion for demonstration
      if (useFallback || !apiKey) {
        return res.status(200).json({
          success: true,
          description: generateContextualSuggestion(title),
          fallback: true,
          provider: 'Local AI Heuristic Fallback',
          disclaimer: 'AI-generated suggestion. Please review and edit before saving.'
        });
      }
    }

    // Call live OpenAI API
    const client = new OpenAI({ apiKey, timeout: 10000 });
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are an AI assistant in a task management app. Generate a single, concise (1-2 sentences), actionable task description based on the title. Do not wrap in quotes.'
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
      provider: 'OpenAI (gpt-4o-mini)',
      disclaimer: 'AI-generated content. Please review and edit before saving.'
    });
  } catch (err) {
    console.error(`[AI Service Notice] Error generating description: ${err.message}`);

    // Step 6: Graceful fallback error response - core application continues working
    return res.status(200).json({
      success: false,
      description: '',
      fallback: true,
      error: `AI service unavailable (${err.message.includes('401') ? 'Invalid API Key' : 'Network/Quota Issue'}). Please write a description manually.`,
      disclaimer: 'AI generation failed. Fallback to manual entry.'
    });
  }
});

module.exports = router;
