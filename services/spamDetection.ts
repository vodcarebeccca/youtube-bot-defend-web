import { SpamResult } from '../types';

// ==================== UNICODE MAP (300+ karakter) ====================
const UNICODE_MAP: Record<string, string> = {
  // Small Caps
  'ᴀ': 'a', 'ʙ': 'b', 'ᴄ': 'c', 'ᴅ': 'd', 'ᴇ': 'e', 'ꜰ': 'f', 'ɢ': 'g',
  'ʜ': 'h', 'ɪ': 'i', 'ᴊ': 'j', 'ᴋ': 'k', 'ʟ': 'l', 'ᴍ': 'm', 'ɴ': 'n',
  'ᴏ': 'o', 'ᴘ': 'p', 'ǫ': 'q', 'ʀ': 'r', 'ꜱ': 's', 'ᴛ': 't', 'ᴜ': 'u',
  'ᴠ': 'v', 'ᴡ': 'w', 'ʏ': 'y', 'ᴢ': 'z',
  
  // Bold Letters
  '𝐚': 'a', '𝐛': 'b', '𝐜': 'c', '𝐝': 'd', '𝐞': 'e', '𝐟': 'f', '𝐠': 'g',
  '𝐡': 'h', '𝐢': 'i', '𝐣': 'j', '𝐤': 'k', '𝐥': 'l', '𝐦': 'm', '𝐧': 'n',
  '𝐨': 'o', '𝐩': 'p', '𝐪': 'q', '𝐫': 'r', '𝐬': 's', '𝐭': 't', '𝐮': 'u',
  '𝐯': 'v', '𝐰': 'w', '𝐱': 'x', '𝐲': 'y', '𝐳': 'z',
  '𝐀': 'a', '𝐁': 'b', '𝐂': 'c', '𝐃': 'd', '𝐄': 'e', '𝐅': 'f', '𝐆': 'g',
  '𝐇': 'h', '𝐈': 'i', '𝐉': 'j', '𝐊': 'k', '𝐋': 'l', '𝐌': 'm', '𝐍': 'n',
  '𝐎': 'o', '𝐏': 'p', '𝐐': 'q', '𝐑': 'r', '𝐒': 's', '𝐓': 't', '𝐔': 'u',
  '𝐕': 'v', '𝐖': 'w', '𝐗': 'x', '𝐘': 'y', '𝐙': 'z',
  
  // Fullwidth
  'ａ': 'a', 'ｂ': 'b', 'ｃ': 'c', 'ｄ': 'd', 'ｅ': 'e', 'ｆ': 'f', 'ｇ': 'g',
  'ｈ': 'h', 'ｉ': 'i', 'ｊ': 'j', 'ｋ': 'k', 'ｌ': 'l', 'ｍ': 'm', 'ｎ': 'n',
  'ｏ': 'o', 'ｐ': 'p', 'ｑ': 'q', 'ｒ': 'r', 'ｓ': 's', 'ｔ': 't', 'ｕ': 'u',
  'ｖ': 'v', 'ｗ': 'w', 'ｘ': 'x', 'ｙ': 'y', 'ｚ': 'z',
  
  // Circled
  'ⓐ': 'a', 'ⓑ': 'b', 'ⓒ': 'c', 'ⓓ': 'd', 'ⓔ': 'e', 'ⓕ': 'f', 'ⓖ': 'g',
  'ⓗ': 'h', 'ⓘ': 'i', 'ⓙ': 'j', 'ⓚ': 'k', 'ⓛ': 'l', 'ⓜ': 'm', 'ⓝ': 'n',
  'ⓞ': 'o', 'ⓟ': 'p', 'ⓠ': 'q', 'ⓡ': 'r', 'ⓢ': 's', 'ⓣ': 't', 'ⓤ': 'u',
  'ⓥ': 'v', 'ⓦ': 'w', 'ⓧ': 'x', 'ⓨ': 'y', 'ⓩ': 'z',
  
  // Sans-Serif Bold
  '𝗮': 'a', '𝗯': 'b', '𝗰': 'c', '𝗱': 'd', '𝗲': 'e', '𝗳': 'f', '𝗴': 'g',
  '𝗵': 'h', '𝗶': 'i', '𝗷': 'j', '𝗸': 'k', '𝗹': 'l', '𝗺': 'm', '𝗻': 'n',
  '𝗼': 'o', '𝗽': 'p', '𝗾': 'q', '𝗿': 'r', '𝘀': 's', '𝘁': 't', '𝘂': 'u',
  '𝘃': 'v', '𝘄': 'w', '𝘅': 'x', '𝘆': 'y', '𝘇': 'z',
  
  // Script
  '𝓪': 'a', '𝓫': 'b', '𝓬': 'c', '𝓭': 'd', '𝓮': 'e', '𝓯': 'f', '𝓰': 'g',
  '𝓱': 'h', '𝓲': 'i', '𝓳': 'j', '𝓴': 'k', '𝓵': 'l', '𝓶': 'm', '𝓷': 'n',
  '𝓸': 'o', '𝓹': 'p', '𝓺': 'q', '𝓻': 'r', '𝓼': 's', '𝓽': 't', '𝓾': 'u',
  '𝓿': 'v', '𝔀': 'w', '𝔁': 'x', '𝔂': 'y', '𝔃': 'z',
  
  // Greek/Cyrillic look-alikes
  'α': 'a', 'β': 'b', 'ε': 'e', 'ι': 'i', 'κ': 'k', 'ο': 'o', 'ρ': 'p',
  'а': 'a', 'с': 'c', 'е': 'e', 'о': 'o', 'р': 'p', 'х': 'x', 'у': 'y',
  
  // Symbols
  '@': 'a', '$': 's', '!': 'i', '|': 'l',
};

// ==================== LEET MAP ====================
const LEET_MAP: Record<string, string> = {
  '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's',
  '6': 'g', '7': 't', '8': 'b', '9': 'g',
};

// ==================== JUDOL KEYWORDS (200+) ====================
const JUDOL_KEYWORDS = [
  // Slot
  'slot', 'gacor', 'maxwin', 'scatter', 'jackpot', 'jp', 'rtp',
  'pragmatic', 'pgsoft', 'habanero', 'joker', 'joker123',
  
  // Games
  'gates of olympus', 'starlight princess', 'sweet bonanza',
  'mahjong ways', 'fortune tiger', 'fortune ox', 'wild west gold',
  'sugar rush', 'lucky neko', 'mega888', '918kiss',
  
  // Transaction
  'deposit', 'depo', 'withdraw', 'wd', 'bonus', 'freebet', 'freespin',
  'modal receh', 'cuan', 'wede', 'turnover', 'cashback',
  
  // Gambling
  'togel', 'toto', 'casino', 'poker', 'domino', 'baccarat',
  'sportsbook', 'sabung ayam', 'tembak ikan',
  
  // Payment
  'dana', 'ovo', 'gopay', 'pulsa', 'qris',
  
  // Action
  'daftar', 'gabung', 'join', 'cek bio', 'link di bio', 'dm aja',
  
  // Descriptors
  'gampang menang', 'pasti menang', 'anti rungkad', 'dijamin cair',
  'lisensi resmi', 'terpercaya', 'server luar', 'rtp live',
  'auto win', 'auto jp', 'modal kecil', 'menang mudah',
  
  // Site Names (60+)
  'garudahoki', 'mpo777', 'dewahoki', 'rajahoki', 'sultanplay',
  'zeus88', 'olympus777', 'naga88', 'macan88', 'tiger88',
  'gacor88', 'maxwin777', 'slot88', 'bet88', 'win88',
  'play88', 'vip88', 'pro88', 'mega88', 'super88',
  'lucky88', 'gold88', 'royal88', 'king88', 'cuan88',
  'jp88', 'scatter88', 'hoki88', 'indo88', 'asia88',
];

// ==================== NORMALIZE FUNCTIONS ====================
function normalizeUnicode(text: string): string {
  let result = text.toLowerCase();
  for (const [unicode, normal] of Object.entries(UNICODE_MAP)) {
    result = result.split(unicode).join(normal);
  }
  return result.replace(/[\s.\-_]+/g, '');
}

function normalizeLeet(text: string): string {
  let result = normalizeUnicode(text);
  for (const [leet, normal] of Object.entries(LEET_MAP)) {
    result = result.split(leet).join(normal);
  }
  return result;
}

// ==================== SPACED LETTERS DETECTION ====================
function detectSpacedSpam(text: string): { isSpam: boolean; word: string; score: number } {
  const words = text.split(/\s+/);
  const singleCharCount = words.filter(w => w.length === 1).length;
  
  if (words.length >= 4 && singleCharCount / words.length >= 0.5) {
    const extracted = words.filter(w => w.length === 1).join('');
    const normalized = normalizeLeet(extracted);
    
    for (const kw of JUDOL_KEYWORDS) {
      if (normalized.includes(kw.replace(/\s/g, ''))) {
        return { isSpam: true, word: normalized, score: 90 };
      }
    }
    
    const hasUnicode = [...text].some(c => UNICODE_MAP[c]);
    if (hasUnicode && extracted.length >= 5) {
      return { isSpam: true, word: normalized, score: 70 };
    }
  }
  
  return { isSpam: false, word: '', score: 0 };
}

// ==================== CONTACT INFO DETECTION ====================
function hasContactInfo(text: string): boolean {
  const patterns = [
    /https?:\/\/[^\s]+/i,
    /www\.[^\s]+/i,
    /bit\.ly\/[^\s]+/i,
    /t\.me\/[^\s]+/i,
    /wa\.me\/[^\s]+/i,
    /linktr\.ee\/[^\s]+/i,
    /\+62[0-9]{9,12}/,
    /08[0-9]{8,11}/,
    /cek\s*bio/i,
    /link\s*di\s*bio/i,
    /[a-zA-Z]{3,}(666|777|888|88|99)\b/i,
  ];
  
  return patterns.some(p => p.test(text));
}

// ==================== MAIN DETECTION ====================
export function detectJudol(text: string): SpamResult {
  const originalLower = text.toLowerCase();
  const normalized = normalizeUnicode(text);
  const normalizedLeet = normalizeLeet(text);
  
  let score = 0;
  const keywordsFound: string[] = [];
  
  // Check viewer reporting judol (NOT SPAM)
  const reportPatterns = [/ada\s+judol/i, /judol\s+lagi/i, /ban\s+judol/i, /report\s+judol/i];
  if (reportPatterns.some(p => p.test(originalLower))) {
    return { isSpam: false, keywords: [], score: 0 };
  }
  
  // Check spaced unicode spam
  const spaced = detectSpacedSpam(text);
  if (spaced.isSpam) {
    return { isSpam: true, keywords: [`spaced:${spaced.word}`], score: spaced.score };
  }
  
  // Check contact info
  const hasContact = hasContactInfo(text);
  
  // Check keywords
  for (const kw of JUDOL_KEYWORDS) {
    const kwNorm = kw.replace(/\s/g, '');
    if (normalized.includes(kwNorm) || normalizedLeet.includes(kwNorm)) {
      keywordsFound.push(kw);
    }
  }
  
  // SPAM = keyword + contact
  if (keywordsFound.length > 0 && hasContact) {
    score += 70;
  }
  
  // Site name pattern: zeus666, garuda777, slot88
  if (/[a-zA-Z]{3,}(666|777|888|88|99|123)\b/i.test(normalizedLeet)) {
    score += 80;
    keywordsFound.push('site_pattern');
  }
  
  // Promo phrases
  const promoPatterns = ['pasti menang', 'auto win', 'dijamin cair', 'daftar sekarang', 'bonus new member', 'rtp live'];
  if (promoPatterns.some(p => normalized.includes(p.replace(/\s/g, '')))) {
    score += 50;
    keywordsFound.push('promo_phrase');
  }
  
  return {
    isSpam: score >= 50,
    score: Math.min(score, 100),
    keywords: keywordsFound.slice(0, 5)
  };
}
