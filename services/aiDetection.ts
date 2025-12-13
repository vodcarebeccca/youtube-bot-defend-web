/**
 * AI Detection Service - Uses Gemini or Groq AI for smarter spam detection
 * Supports multiple API keys with rotation (comma-separated in env vars)
 * Only called when pattern matching doesn't detect spam but AI is enabled
 */

// Parse multiple API keys from environment (comma-separated)
const GEMINI_API_KEYS: string[] = (import.meta.env.VITE_GEMINI_API_KEY || '')
  .split(',')
  .map((k: string) => k.trim())
  .filter((k: string) => k.length > 0);

const GROQ_API_KEYS: string[] = (import.meta.env.VITE_GROQ_API_KEY || '')
  .split(',')
  .map((k: string) => k.trim())
  .filter((k: string) => k.length > 0);

// Key rotation indexes
let geminiKeyIndex = 0;
let groqKeyIndex = 0;

// Get next API key with rotation
function getNextGeminiKey(): string | null {
  if (GEMINI_API_KEYS.length === 0) return null;
  const key = GEMINI_API_KEYS[geminiKeyIndex];
  geminiKeyIndex = (geminiKeyIndex + 1) % GEMINI_API_KEYS.length;
  return key;
}

function getNextGroqKey(): string | null {
  if (GROQ_API_KEYS.length === 0) return null;
  const key = GROQ_API_KEYS[groqKeyIndex];
  groqKeyIndex = (groqKeyIndex + 1) % GROQ_API_KEYS.length;
  return key;
}

// API endpoints
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// AI Provider type
export type AIProvider = 'gemini' | 'groq' | 'auto';

// System prompt for spam detection - IMPROVED VERSION
const SPAM_DETECTION_PROMPT = `Kamu adalah AI detector spam judol (judi online) di live chat YouTube Indonesia.
Kamu HARUS sangat hati-hati untuk TIDAK salah mendeteksi chat normal sebagai spam.

## SPAM JUDOL (confidence 80-100):
- Promosi LANGSUNG slot, togel, casino, poker online
- Menyebut nama situs judi (zeus88, garuda777, pragmatic, dll)
- Ajakan daftar/deposit/main judi dengan link/kontak
- Kombinasi: bonus + maxwin + gacor + scatter + jackpot + link/WA
- Link WA/Telegram + ajakan main judi
- Menggunakan huruf unicode untuk bypass filter + promosi judi

## BUKAN SPAM (confidence 0-30):
- Chat gaming biasa: "100 rbx", "jual robux", "private server", "akun roblox"
- Jual beli item game: "jual diamond", "jual akun ML", "trade item"
- Viewer melaporkan judol: "ada judol", "ban judol", "spam judol"
- Komentar normal: sapaan, pertanyaan, reaksi stream
- Menyebut angka/harga tanpa konteks judi: "100k", "50rb", "harga berapa"
- Promosi channel/konten YouTube sendiri
- Jual jasa editing, design, dll (bukan judi)

## KONTEKS PENTING:
- "rbx" / "robux" = mata uang game Roblox, BUKAN judi
- "private server" dalam konteks game = server game, BUKAN judi
- "diamond" / "dm" = mata uang game Mobile Legends/Free Fire
- "akun" tanpa konteks judi = akun game biasa
- Angka + "rb"/"k" saja BUKAN indikator judi

## ATURAN KETAT:
1. Jika TIDAK ADA link/kontak WA/Telegram DAN tidak ada kata judi eksplisit → BUKAN SPAM
2. Jika konteksnya GAMING (roblox, ml, ff, valorant, dll) → BUKAN SPAM
3. Jika ragu, pilih BUKAN SPAM (false positive lebih buruk dari false negative)

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
  return GEMINI_API_KEYS.length > 0 || GROQ_API_KEYS.length > 0;
}

/**
 * Get available AI provider
 */
export function getAvailableProvider(): AIProvider | null {
  if (GROQ_API_KEYS.length > 0) return 'groq'; // Prefer Groq (faster)
  if (GEMINI_API_KEYS.length > 0) return 'gemini';
  return null;
}

/**
 * Get provider display name with key count
 */
export function getProviderName(): string {
  const groqCount = GROQ_API_KEYS.length;
  const geminiCount = GEMINI_API_KEYS.length;
  
  if (groqCount > 0 && geminiCount > 0) {
    return `Groq (${groqCount} keys) + Gemini (${geminiCount} keys)`;
  }
  if (groqCount > 0) return `Groq (${groqCount} key${groqCount > 1 ? 's' : ''})`;
  if (geminiCount > 0) return `Gemini (${geminiCount} key${geminiCount > 1 ? 's' : ''})`;
  return 'None';
}

/**
 * Get total key count
 */
export function getTotalKeyCount(): number {
  return GROQ_API_KEYS.length + GEMINI_API_KEYS.length;
}

/**
 * Detect spam using Groq API (Llama model - very fast!)
 */
async function detectWithGroq(message: string): Promise<AIDetectionResult> {
  const apiKey = getNextGroqKey();
  if (!apiKey) {
    return { isSpam: false, confidence: 0, reason: 'No Groq API key', error: 'No key available' };
  }
  
  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
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
  const apiKey = getNextGeminiKey();
  if (!apiKey) {
    return { isSpam: false, confidence: 0, reason: 'No Gemini API key', error: 'No key available' };
  }
  
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
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
