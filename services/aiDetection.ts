/**
 * AI Detection Service - Uses Gemini or Groq AI for smarter spam detection
 * Only called when pattern matching doesn't detect spam but AI is enabled
 */

// Get API keys from environment
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';

// API endpoints
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// AI Provider type
export type AIProvider = 'gemini' | 'groq' | 'auto';

// System prompt for spam detection
const SPAM_DETECTION_PROMPT = `Kamu adalah AI detector spam judol (judi online) di live chat YouTube Indonesia.

Analisis pesan berikut dan tentukan apakah ini SPAM JUDOL atau bukan.

Ciri-ciri spam judol:
- Promosi slot, togel, casino, poker online
- Menyebut nama situs judi (zeus88, garuda777, dll)
- Ajakan daftar/deposit/main judi
- Menyebut bonus, maxwin, gacor, scatter, jackpot
- Link atau kontak (WA, Telegram, "cek bio")
- Menggunakan huruf unicode/fancy untuk bypass filter

BUKAN spam jika:
- Viewer biasa yang melaporkan ada judol ("ada judol nih", "ban judol")
- Komentar normal tentang konten stream
- Pertanyaan atau sapaan biasa

Jawab HANYA dengan format JSON:
{"isSpam": true/false, "confidence": 0-100, "reason": "alasan singkat"}`;

interface AIDetectionResult {
  isSpam: boolean;
  confidence: number;
  reason: string;
  error?: string;
}

/**
 * Check if AI detection is available (any API key configured)
 */
export function isAIDetectionAvailable(): boolean {
  return GEMINI_API_KEY.length > 0 || GROQ_API_KEY.length > 0;
}

/**
 * Get available AI provider
 */
export function getAvailableProvider(): AIProvider | null {
  if (GROQ_API_KEY.length > 0) return 'groq'; // Prefer Groq (faster)
  if (GEMINI_API_KEY.length > 0) return 'gemini';
  return null;
}

/**
 * Get provider display name
 */
export function getProviderName(): string {
  const provider = getAvailableProvider();
  if (provider === 'groq') return 'Groq (Llama)';
  if (provider === 'gemini') return 'Gemini';
  return 'None';
}

/**
 * Detect spam using Groq API (Llama model - very fast!)
 */
async function detectWithGroq(message: string): Promise<AIDetectionResult> {
  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: SPAM_DETECTION_PROMPT },
          { role: 'user', content: `Pesan untuk dianalisis:\n"${message}"` }
        ],
        temperature: 0.1,
        max_tokens: 100,
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[AIDetection/Groq] API error:', errorData);
      return {
        isSpam: false,
        confidence: 0,
        reason: 'Groq API error',
        error: errorData.error?.message || `HTTP ${response.status}`
      };
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    
    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        isSpam: result.isSpam === true,
        confidence: Math.min(100, Math.max(0, result.confidence || 0)),
        reason: `Groq: ${result.reason || 'AI detection'}`
      };
    }

    return { isSpam: false, confidence: 0, reason: 'Could not parse Groq response', error: 'Invalid format' };
  } catch (error: any) {
    console.error('[AIDetection/Groq] Error:', error);
    return { isSpam: false, confidence: 0, reason: 'Groq detection failed', error: error.message };
  }
}

/**
 * Detect spam using Gemini API
 */
async function detectWithGemini(message: string): Promise<AIDetectionResult> {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${SPAM_DETECTION_PROMPT}\n\nPesan untuk dianalisis:\n"${message}"`
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 100,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[AIDetection/Gemini] API error:', errorData);
      return {
        isSpam: false,
        confidence: 0,
        reason: 'Gemini API error',
        error: errorData.error?.message || `HTTP ${response.status}`
      };
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        isSpam: result.isSpam === true,
        confidence: Math.min(100, Math.max(0, result.confidence || 0)),
        reason: `Gemini: ${result.reason || 'AI detection'}`
      };
    }

    return { isSpam: false, confidence: 0, reason: 'Could not parse Gemini response', error: 'Invalid format' };
  } catch (error: any) {
    console.error('[AIDetection/Gemini] Error:', error);
    return { isSpam: false, confidence: 0, reason: 'Gemini detection failed', error: error.message };
  }
}

/**
 * Detect spam using available AI provider (auto-select)
 * @param message - Chat message to analyze
 * @returns AI detection result
 */
export async function detectSpamWithAI(message: string): Promise<AIDetectionResult> {
  const provider = getAvailableProvider();
  
  if (!provider) {
    return {
      isSpam: false,
      confidence: 0,
      reason: 'No API key configured',
      error: 'Set VITE_GEMINI_API_KEY or VITE_GROQ_API_KEY'
    };
  }

  // Use Groq if available (faster), fallback to Gemini
  if (provider === 'groq') {
    return detectWithGroq(message);
  } else {
    return detectWithGemini(message);
  }
}

/**
 * Batch detect spam for multiple messages
 * Uses rate limiting to avoid API quota issues
 */
export async function batchDetectSpam(
  messages: string[],
  delayMs: number = 500
): Promise<AIDetectionResult[]> {
  const results: AIDetectionResult[] = [];
  
  for (const message of messages) {
    const result = await detectSpamWithAI(message);
    results.push(result);
    
    // Rate limiting
    if (messages.indexOf(message) < messages.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return results;
}
