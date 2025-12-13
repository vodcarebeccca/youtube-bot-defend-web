/**
 * AI Detection Service - Uses Gemini AI for smarter spam detection
 * Only called when pattern matching doesn't detect spam but AI is enabled
 */

// Get Gemini API key from environment
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// Gemini API endpoint
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

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
 * Check if AI detection is available (API key configured)
 */
export function isAIDetectionAvailable(): boolean {
  return GEMINI_API_KEY.length > 0;
}

/**
 * Detect spam using Gemini AI
 * @param message - Chat message to analyze
 * @returns AI detection result
 */
export async function detectSpamWithAI(message: string): Promise<AIDetectionResult> {
  if (!GEMINI_API_KEY) {
    return {
      isSpam: false,
      confidence: 0,
      reason: 'API key not configured',
      error: 'GEMINI_API_KEY not set'
    };
  }

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
      console.error('[AIDetection] API error:', errorData);
      return {
        isSpam: false,
        confidence: 0,
        reason: 'API error',
        error: errorData.error?.message || `HTTP ${response.status}`
      };
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Parse JSON response from AI
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        isSpam: result.isSpam === true,
        confidence: Math.min(100, Math.max(0, result.confidence || 0)),
        reason: result.reason || 'AI detection'
      };
    }

    return {
      isSpam: false,
      confidence: 0,
      reason: 'Could not parse AI response',
      error: 'Invalid response format'
    };

  } catch (error: any) {
    console.error('[AIDetection] Error:', error);
    return {
      isSpam: false,
      confidence: 0,
      reason: 'Detection failed',
      error: error.message
    };
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
