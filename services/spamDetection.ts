import { SpamResult } from '../types';

// ==================== UNICODE MAP (500+ karakter) ====================
const UNICODE_MAP: Record<string, string> = {
  // Small Caps
  'ᴀ': 'a', 'ʙ': 'b', 'ᴄ': 'c', 'ᴅ': 'd', 'ᴇ': 'e', 'ꜰ': 'f', 'ɢ': 'g',
  'ʜ': 'h', 'ɪ': 'i', 'ᴊ': 'j', 'ᴋ': 'k', 'ʟ': 'l', 'ᴍ': 'm', 'ɴ': 'n',
  'ᴏ': 'o', 'ᴘ': 'p', 'ǫ': 'q', 'ʀ': 'r', 'ꜱ': 's', 'ᴛ': 't', 'ᴜ': 'u',
  'ᴠ': 'v', 'ᴡ': 'w', 'ʏ': 'y', 'ᴢ': 'z',
  // Circled
  'ⓐ': 'a', 'ⓑ': 'b', 'ⓒ': 'c', 'ⓓ': 'd', 'ⓔ': 'e', 'ⓕ': 'f', 'ⓖ': 'g',
  'ⓗ': 'h', 'ⓘ': 'i', 'ⓙ': 'j', 'ⓚ': 'k', 'ⓛ': 'l', 'ⓜ': 'm', 'ⓝ': 'n',
  'ⓞ': 'o', 'ⓟ': 'p', 'ⓠ': 'q', 'ⓡ': 'r', 'ⓢ': 's', 'ⓣ': 't', 'ⓤ': 'u',
  'ⓥ': 'v', 'ⓦ': 'w', 'ⓧ': 'x', 'ⓨ': 'y', 'ⓩ': 'z',
  // Fullwidth
  'ａ': 'a', 'ｂ': 'b', 'ｃ': 'c', 'ｄ': 'd', 'ｅ': 'e', 'ｆ': 'f', 'ｇ': 'g',
  'ｈ': 'h', 'ｉ': 'i', 'ｊ': 'j', 'ｋ': 'k', 'ｌ': 'l', 'ｍ': 'm', 'ｎ': 'n',
  'ｏ': 'o', 'ｐ': 'p', 'ｑ': 'q', 'ｒ': 'r', 'ｓ': 's', 'ｔ': 't', 'ｕ': 'u',
  'ｖ': 'v', 'ｗ': 'w', 'ｘ': 'x', 'ｙ': 'y', 'ｚ': 'z',
  // Bold
  '𝐚': 'a', '𝐛': 'b', '𝐜': 'c', '𝐝': 'd', '𝐞': 'e', '𝐟': 'f', '𝐠': 'g',
  '𝐡': 'h', '𝐢': 'i', '𝐣': 'j', '𝐤': 'k', '𝐥': 'l', '𝐦': 'm', '𝐧': 'n',
  '𝐨': 'o', '𝐩': 'p', '𝐪': 'q', '𝐫': 'r', '𝐬': 's', '𝐭': 't', '𝐮': 'u',
  '𝐯': 'v', '𝐰': 'w', '𝐱': 'x', '𝐲': 'y', '𝐳': 'z',
  '𝐀': 'a', '𝐁': 'b', '𝐂': 'c', '𝐃': 'd', '𝐄': 'e', '𝐅': 'f', '𝐆': 'g',
  '𝐇': 'h', '𝐈': 'i', '𝐉': 'j', '𝐊': 'k', '𝐋': 'l', '𝐌': 'm', '𝐍': 'n',
  '𝐎': 'o', '𝐏': 'p', '𝐐': 'q', '𝐑': 'r', '𝐒': 's', '𝐓': 't', '𝐔': 'u',
  '𝐕': 'v', '𝐖': 'w', '𝐗': 'x', '𝐘': 'y', '𝐙': 'z',
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
  // Squared/Negative
  '🄰': 'a', '🄱': 'b', '🄲': 'c', '🄳': 'd', '🄴': 'e', '🄵': 'f', '🄶': 'g',
  '🄷': 'h', '🄸': 'i', '🄹': 'j', '🄺': 'k', '🄻': 'l', '🄼': 'm', '🄽': 'n',
  '🄾': 'o', '🄿': 'p', '🅀': 'q', '🅁': 'r', '🅂': 's', '🅃': 't', '🅄': 'u',
  '🅅': 'v', '🅆': 'w', '🅇': 'x', '🅈': 'y', '🅉': 'z',
  '🅰': 'a', '🅱': 'b', '🅲': 'c', '🅳': 'd', '🅴': 'e', '🅵': 'f', '🅶': 'g',
  '🅷': 'h', '🅸': 'i', '🅹': 'j', '🅺': 'k', '🅻': 'l', '🅼': 'm', '🅽': 'n',
  '🅾': 'o', '🅿': 'p', '🆀': 'q', '🆁': 'r', '🆂': 's', '🆃': 't', '🆄': 'u',
  '🆅': 'v', '🆆': 'w', '🆇': 'x', '🆈': 'y', '🆉': 'z',
  // Symbols
  '@': 'a', '$': 's', '!': 'i', '|': 'l',
};

const LEET_MAP: Record<string, string> = {
  '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's',
  '6': 'g', '7': 't', '8': 'b', '9': 'g',
};


// ==================== JUDOL KEYWORDS (300+ dari Python tools) ====================
const JUDOL_KEYWORDS = [
  // Slot Keywords
  'slot', 'slots', 'sl0t', 'slott', 'gacor', 'gacorr', 'gac0r', 'gacoor',
  'maxwin', 'max win', 'maxwinn', 'm4xwin', 'scatter', 'scater', 'sc4tter',
  'jackpot', 'jp', 'j4ckpot', 'jackp0t', 'jekpot', 'rtp', 'rtp live', 'rtplive',
  'pragmatic', 'pragmat1c', 'pgsoft', 'pg soft', 'habanero', 'joker', 'joker123',
  'spadegaming', 'microgaming', 'playtech', 'cq9', 'jili', 'fachai',
  
  // Slot Games 2025
  'gates of olympus', 'gatesofolympus', 'gatot', 'gatot kaca', 'gatotkaca',
  'starlight princess', 'starlightprincess', 'starlight', 'sweet bonanza',
  'sweetbonanza', 'bonanza', 'mahjong ways', 'mahjongways', 'mahjong',
  'wild west gold', 'wildwestgold', 'sugar rush', 'sugarrush', 'aztec gems',
  'great rhino', 'wolf gold', 'dog house', 'doghouse', 'floating dragon',
  'wisdom of athena', 'lucky neko', 'luckyneko', 'fortune tiger', 'fortunetiger',
  'fortune ox', 'fortuneox', 'fortune rabbit', 'fortune mouse', 'fortune dragon',
  'mega888', 'mega 888', '918kiss', '918 kiss', 'xe88', 'pussy888',
  
  // Money/Transaction
  'deposit', 'depo', 'dep0', 'dp', 'depo50', 'depo100', 'depo10k', 'minimal depo',
  'withdraw', 'wd', 'w1thdraw', 'tarik', 'penarikan', 'wd cepat',
  'bonus', 'b0nus', 'promo', 'prom0', 'promosi', 'bonus new member',
  'freebet', 'freespin', 'free spin', 'freechip', 'free chip', 'gratis',
  'bocoran', 'boc0ran', 'pola', 'pola slot', 'pola gacor', 'pola hari ini',
  'modal', 'mod4l', 'receh', 'rec3h', 'cuan', 'cu4n', 'profit', 'untung',
  'modal kecil', 'modal receh', 'turnover', 'cashback', 'rebate',
  
  // Gambling Types
  'togel', 'toto', 't0gel', 'togelonline', 'totomacau', 'togelsgp', 'togelhk',
  'casino', 'cas1no', 'live casino', 'livecasino', 'kasino',
  'poker', 'p0ker', 'domino', 'dom1no', 'dominoqq', 'qq', 'pkv',
  'baccarat', 'bacc4rat', 'roulette', 'r0ulette', 'rolet',
  'sicbo', 'sic bo', 'dadu', 'dice', 'sportsbook', 'taruhan', 'betting',
  'parlay', 'mix parlay', 'handicap', 'sabung ayam', 'sv388', 's128',
  'tembak ikan', 'fish hunter', 'fishing',
  
  // Payment Methods
  'dana', 'd4na', 'ovo', '0vo', 'gopay', 'g0pay', 'linkaja', 'link aja',
  'pulsa', 'puls4', 'qris', 'shopeepay', 'ewallet', 'e-wallet',
  'slot pulsa', 'slot dana', 'slot ovo', 'slot gopay', 'slot qris',
  'deposit pulsa', 'depo pulsa', 'tanpa potongan',
  
  // Action Words
  'daftar', 'd4ftar', 'register', 'regis', 'registrasi', 'daftar sekarang',
  'login', 'log1n', 'masuk', 'gabung', 'join', 'sign up', 'signup',
  'link', 'l1nk', 'alternatif', 'alt', 'mirror', 'link alt',
  'klik', 'click', 'bio', 'b1o', 'cek bio', 'link di bio', 'dm aja',
  'main', 'bermain', 'play', 'spin', 'sp1n', 'putar',
  'wa', 'whatsapp', 'telegram', 'tele', 'hubungi', 'kontak',
  
  // Descriptors
  'resmi', 'r3smi', 'official', 'terpercaya', 'terbesar', 'terbaik',
  'gampang', 'g4mpang', 'mudah', 'menang', 'm3nang', 'jp paus', 'paus',
  'sensational', 'sens4tional', 'x500', 'x1000', 'x5000', 'x10000',
  'petir', 'pet1r', 'zeus', 'olympus', 'gates', 'kakek zeus',
  'lucky', 'fortune', 'hoki', 'h0ki', 'sultan', 'sult4n',
  'auto', 'aut0', 'pasti', 'past1', 'anti rungkad', 'antirungkad',
  'anti boncos', 'antiboncos', 'pasti menang', 'pasti jp',
  'aman', '4man', 'terjamin', 'berlisensi', 'lisensi',
  'server luar', 'server thailand', 'server kamboja', 'server filipina',
  'winrate', 'win rate', 'winrate tinggi', 'viral', 'trending',
  
  // Site Names (100+)
  'garudahoki', 'garuda hoki', 'mpo', 'mpo777', 'mpo888', 'mpo123',
  'dewahoki', 'dewa hoki', 'dewabet', 'rajahoki', 'raja hoki', 'rajaslot',
  'sultanplay', 'sultan play', 'sultanbet', 'sultan88',
  'bos88', 'bosslot', 'bosku', 'gacor88', 'gacor777', 'gacor99',
  'mantap88', 'mantap777', 'cuan88', 'cuan777', 'cuanslot',
  'jp88', 'jp777', 'jpslot', 'jppaus', 'maxwin88', 'maxwin777',
  'scatter88', 'scatter777', 'zeus88', 'zeus777', 'zeusslot',
  'olympus88', 'olympus777', 'naga88', 'naga777', 'nagaslot',
  'macan88', 'macan777', 'tiger88', 'tiger777', 'dragon88', 'dragon777',
  'panda88', 'panda777', 'kuda88', 'ayam88', 'ikan88',
  'receh88', 'receh777', 'indo88', 'indo777', 'indoslot',
  'asia88', 'asia777', 'asiaslot', 'win88', 'win777', 'winslot',
  'bet88', 'bet777', 'betslot', 'play88', 'play777', 'playslot',
  'vip88', 'vip777', 'vipslot', 'pro88', 'pro777', 'proslot',
  'top88', 'top777', 'super88', 'super777', 'mega88', 'mega777',
  'giga88', 'ultra88', 'turbo88', 'speed88', 'fast88', 'quick88',
  'lucky88', 'lucky777', 'happy88', 'fun88', 'joy88',
  'gold88', 'gold777', 'silver88', 'diamond88', 'royal88', 'royal777',
  'king88', 'king777', 'queen88', 'prince88', 'princess88',
  
  // Spam Phrases 2025
  'wede', 'w3de', 'wed3', 'wede besar', 'wede jutaan',
  'lisensi web', 'lisensi resmi', 'web terbaik', 'web resmi',
  'menang mudah', 'menang gampang', 'menang terus', 'gampang menang',
  'langsung cair', 'cair cepat', 'proses cepat', 'tanpa ribet',
  'buruan daftar', 'buruan gabung', 'ayo gabung', 'ayo daftar',
  'modal kecil untung besar', 'dijamin aman', 'dijamin menang', 'dijamin cair',
  'terbukti membayar', 'terbukti aman', 'terbukti gacor',
  'ribuan member', 'jutaan member', 'bonus melimpah', 'bonus besar',
  'anti rungkat', 'anti rugi', 'pola rahasia', 'pola jitu',
  'bocoran admin', 'bocoran slot', 'akun pro', 'akun vip', 'akun premium',
  'cheat slot', 'hack slot', 'bug slot', 'trik slot', 'tips slot',
  'jam gacor', 'waktu gacor', 'bandar togel', 'bandar slot', 'situs gacor',
  'judi online', 'judol', 'jud0l', 'judii',
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

// ==================== #49 REPEATED CHAR DETECTOR ====================
interface RepeatedCharResult {
  hasRepeatedBypass: boolean;
  originalText: string;
  cleanedText: string;
  detectedWord: string;
  score: number;
}

function detectRepeatedChars(text: string): RepeatedCharResult {
  let score = 0;
  let detectedWord = '';
  
  // Step 1: Remove repeated consecutive characters (sssslot -> slot, sloooot -> slot)
  const deduped = text.replace(/(.)\1{2,}/g, '$1');
  
  // Step 2: Remove separators between chars (s.l.o.t -> slot, s-l-o-t -> slot, s_l_o_t -> slot)
  const separatorPatterns = [
    /([a-zA-Z])[\.\-_\s]+(?=[a-zA-Z])/g,  // a.b.c -> abc
    /([a-zA-Z])\s+(?=[a-zA-Z])/g,          // a b c -> abc (single spaces)
  ];
  
  let cleaned = deduped;
  for (const pattern of separatorPatterns) {
    cleaned = cleaned.replace(pattern, '$1');
  }
  
  // Normalize for keyword matching
  const normalized = normalizeLeet(cleaned.toLowerCase());
  
  // Check if cleaned text contains spam keywords
  const spamKeywordsToCheck = [
    'slot', 'gacor', 'maxwin', 'jackpot', 'scatter', 'bonus', 'depo',
    'togel', 'casino', 'poker', 'judol', 'judi', 'rtp', 'jp',
    'pragmatic', 'zeus', 'olympus', 'bonanza', 'mahjong', 'starlight',
    'fortune', 'tiger', 'dragon', 'sultan', 'hoki', 'cuan', 'wede',
  ];
  
  for (const kw of spamKeywordsToCheck) {
    if (normalized.includes(kw)) {
      detectedWord = kw;
      
      // Check if original text had bypass patterns
      const originalLower = text.toLowerCase();
      
      // Pattern 1: Repeated chars (sssslot, sloooot, gaaaacor)
      const repeatedPattern = new RegExp(`[${kw[0]}]{2,}|${kw.split('').map(c => `${c}+`).join('')}`, 'i');
      if (repeatedPattern.test(originalLower) && originalLower !== normalized) {
        score = Math.max(score, 75);
      }
      
      // Pattern 2: Dotted/separated chars (s.l.o.t, s-l-o-t, s_l_o_t)
      const dottedPattern = new RegExp(kw.split('').join('[.\\-_\\s]+'), 'i');
      if (dottedPattern.test(text)) {
        score = Math.max(score, 80);
      }
      
      // Pattern 3: Mixed (s..l..o..t, sss.lll.ooo.ttt)
      const mixedPattern = new RegExp(kw.split('').map(c => `${c}+`).join('[.\\-_\\s]*'), 'i');
      if (mixedPattern.test(text) && text.length > kw.length * 1.5) {
        score = Math.max(score, 85);
      }
    }
  }
  
  // Additional check: excessive repeated characters in general (suspicious)
  const repeatedCount = (text.match(/(.)\1{3,}/g) || []).length;
  if (repeatedCount >= 2 && score === 0) {
    score = 20; // Suspicious but not confirmed spam
  }
  
  // Check for dotted pattern without keyword match (still suspicious)
  const hasDottedPattern = /[a-zA-Z][\.\-_][a-zA-Z][\.\-_][a-zA-Z][\.\-_][a-zA-Z]/i.test(text);
  if (hasDottedPattern && score === 0) {
    score = 30;
  }
  
  return {
    hasRepeatedBypass: score >= 30,
    originalText: text,
    cleanedText: cleaned,
    detectedWord,
    score
  };
}

// ==================== #46 PHONE NUMBER DETECTOR ====================
interface PhoneDetectionResult {
  hasPhone: boolean;
  numbers: string[];
  score: number;
}

function detectPhoneNumbers(text: string): PhoneDetectionResult {
  const numbers: string[] = [];
  let score = 0;
  
  // Normalize text - remove spaces, dots, dashes between digits
  const normalized = text.replace(/[\s.\-()]+/g, '');
  
  // Indonesian phone patterns
  const patterns = [
    // +62 format (WhatsApp international)
    /\+62[0-9]{9,12}/g,
    // 62 without plus
    /(?<!\d)62[0-9]{9,12}(?!\d)/g,
    // 08xx format (local)
    /(?<!\d)08[0-9]{8,11}(?!\d)/g,
    // wa.me links
    /wa\.me\/[0-9+]+/gi,
    // WhatsApp text patterns
    /(?:wa|whatsapp|whatsap|whatshap)[\s:]*[0-9+]{10,15}/gi,
    // Telegram patterns
    /(?:t\.me|telegram|tele)[\s:\/]*[a-zA-Z0-9_]+/gi,
  ];
  
  for (const pattern of patterns) {
    const matches = normalized.match(pattern) || text.match(pattern);
    if (matches) {
      numbers.push(...matches);
      score += 40; // Each phone number adds score
    }
  }
  
  // Detect obfuscated phone numbers: 0 8 1 2 3 4 5 6 7 8 9
  const spacedDigits = text.match(/(?:0\s*8|6\s*2)[\s\d]{15,}/g);
  if (spacedDigits) {
    const cleaned = spacedDigits[0].replace(/\s/g, '');
    if (cleaned.length >= 10 && cleaned.length <= 15) {
      numbers.push(`obfuscated:${cleaned}`);
      score += 50; // Obfuscated = more suspicious
    }
  }
  
  // Detect "hubungi" + number pattern
  const contactPattern = /(?:hubungi|kontak|chat|dm|pm)[\s:]*(?:\+?62|08)[0-9\s]{8,}/gi;
  const contactMatches = text.match(contactPattern);
  if (contactMatches) {
    numbers.push(...contactMatches);
    score += 60;
  }
  
  return {
    hasPhone: numbers.length > 0,
    numbers: [...new Set(numbers)], // Remove duplicates
    score: Math.min(score, 80)
  };
}

// ==================== #47 LINK SHORTENER DETECTOR ====================
interface LinkDetectionResult {
  hasShortener: boolean;
  links: string[];
  score: number;
}

function detectLinkShorteners(text: string): LinkDetectionResult {
  const links: string[] = [];
  let score = 0;
  
  // Common link shorteners used by spammers
  const shortenerPatterns = [
    // International shorteners
    /bit\.ly\/[a-zA-Z0-9]+/gi,
    /tinyurl\.com\/[a-zA-Z0-9]+/gi,
    /goo\.gl\/[a-zA-Z0-9]+/gi,
    /t\.co\/[a-zA-Z0-9]+/gi,
    /ow\.ly\/[a-zA-Z0-9]+/gi,
    /is\.gd\/[a-zA-Z0-9]+/gi,
    /v\.gd\/[a-zA-Z0-9]+/gi,
    /buff\.ly\/[a-zA-Z0-9]+/gi,
    /adf\.ly\/[a-zA-Z0-9]+/gi,
    /bc\.vc\/[a-zA-Z0-9]+/gi,
    /j\.mp\/[a-zA-Z0-9]+/gi,
    
    // Indonesian shorteners
    /s\.id\/[a-zA-Z0-9]+/gi,
    /klik\.gg\/[a-zA-Z0-9]+/gi,
    /link\.id\/[a-zA-Z0-9]+/gi,
    
    // Social/Bio links (often used for gambling)
    /linktr\.ee\/[a-zA-Z0-9_]+/gi,
    /linkin\.bio\/[a-zA-Z0-9_]+/gi,
    /bio\.link\/[a-zA-Z0-9_]+/gi,
    /heylink\.me\/[a-zA-Z0-9_]+/gi,
    /lynk\.id\/[a-zA-Z0-9_]+/gi,
    /msha\.ke\/[a-zA-Z0-9_]+/gi,
    /lnk\.to\/[a-zA-Z0-9]+/gi,
    /snip\.ly\/[a-zA-Z0-9]+/gi,
    
    // Telegram links
    /t\.me\/[a-zA-Z0-9_]+/gi,
    /telegram\.me\/[a-zA-Z0-9_]+/gi,
    
    // WhatsApp links
    /wa\.me\/[0-9+]+/gi,
    /chat\.whatsapp\.com\/[a-zA-Z0-9]+/gi,
    /api\.whatsapp\.com\/send\?[^\s]+/gi,
  ];
  
  for (const pattern of shortenerPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      links.push(...matches);
      score += 35; // Each shortener link adds score
    }
  }
  
  // Detect suspicious domain patterns (gambling sites often use these)
  const suspiciousDomains = [
    /[a-z]+slot[0-9]*\.[a-z]+/gi,
    /[a-z]+gacor[0-9]*\.[a-z]+/gi,
    /[a-z]+(88|77|99|777|888)\.[a-z]+/gi,
    /slot[a-z]+\.[a-z]+/gi,
    /gacor[a-z]+\.[a-z]+/gi,
    /maxwin[a-z]*\.[a-z]+/gi,
    /jp[a-z0-9]+\.[a-z]+/gi,
  ];
  
  for (const pattern of suspiciousDomains) {
    const matches = text.match(pattern);
    if (matches) {
      links.push(...matches.map(m => `suspicious:${m}`));
      score += 50; // Suspicious gambling domain
    }
  }
  
  return {
    hasShortener: links.length > 0,
    links: [...new Set(links)],
    score: Math.min(score, 80)
  };
}

// ==================== #48 UNICODE BYPASS DETECTOR ====================
interface UnicodeDetectionResult {
  hasUnicodeBypass: boolean;
  originalText: string;
  normalizedText: string;
  unicodeChars: string[];
  score: number;
}

function detectUnicodeBypass(text: string): UnicodeDetectionResult {
  const unicodeChars: string[] = [];
  let score = 0;
  
  // Count unicode characters used for bypass
  for (const char of text) {
    if (UNICODE_MAP[char]) {
      unicodeChars.push(char);
    }
  }
  
  const unicodeCount = unicodeChars.length;
  const textLength = text.length;
  const unicodeRatio = textLength > 0 ? unicodeCount / textLength : 0;
  
  // Normalize the text
  const normalized = normalizeLeet(text);
  
  // Check if normalized text contains spam keywords
  let containsSpamKeyword = false;
  for (const kw of JUDOL_KEYWORDS.slice(0, 50)) { // Check top 50 keywords
    if (normalized.includes(kw.replace(/\s/g, ''))) {
      containsSpamKeyword = true;
      break;
    }
  }
  
  // Scoring logic
  if (unicodeCount >= 3 && containsSpamKeyword) {
    // Unicode + spam keyword = highly suspicious
    score = 70;
  } else if (unicodeCount >= 5 && unicodeRatio > 0.3) {
    // Many unicode chars (>30% of text) = suspicious
    score = 50;
  } else if (unicodeCount >= 10) {
    // Very many unicode chars = suspicious
    score = 40;
  } else if (unicodeCount >= 3 && unicodeRatio > 0.2) {
    // Some unicode with high ratio
    score = 30;
  }
  
  // Check for specific bypass patterns
  const bypassPatterns = [
    /[ꜱѕ][lℓ][oоσ][tт]/i,  // slot with unicode
    /[gɢ][aаα][cс][oоσ][rг]/i, // gacor with unicode
    /[mм][aаα][xх][wω][iі][nп]/i, // maxwin with unicode
    /[jј][pр]/i, // jp with unicode
    /[bв][oоσ][nп][uυ][sѕ]/i, // bonus with unicode
  ];
  
  for (const pattern of bypassPatterns) {
    if (pattern.test(text)) {
      score = Math.max(score, 75);
      break;
    }
  }
  
  return {
    hasUnicodeBypass: score >= 30,
    originalText: text,
    normalizedText: normalized,
    unicodeChars: [...new Set(unicodeChars)],
    score
  };
}

// ==================== CONTACT INFO DETECTION (Enhanced) ====================
function hasContactInfo(text: string): boolean {
  const phoneResult = detectPhoneNumbers(text);
  const linkResult = detectLinkShorteners(text);
  
  if (phoneResult.hasPhone || linkResult.hasShortener) {
    return true;
  }
  
  // Additional patterns
  const patterns = [
    /https?:\/\/[^\s]+/i,
    /www\.[^\s]+/i,
    /cek\s*bio/i,
    /link\s*di\s*bio/i,
    /dm\s*(aja|saja|ya)/i,
    /[a-zA-Z]{3,}(666|777|888|88|99)\b/i,
  ];
  
  return patterns.some(p => p.test(text));
}

// ==================== JUDOL LINK PATTERN DETECTION ====================
function detectJudolLinkPattern(text: string): { isJudol: boolean; name: string } {
  const normalized = normalizeLeet(text.toLowerCase());
  const cleanText = normalized.replace(/[\s.\-_/\\]+/g, '');
  
  const gamblingBases = [
    'zeus', 'garuda', 'mahjong', 'domino', 'slot', 'gacor', 'maxwin',
    'olympus', 'bonanza', 'scatter', 'jackpot', 'poker', 'togel',
    'toto', 'casino', 'fortune', 'tiger', 'dragon', 'naga', 'sultan',
    'hoki', 'cuan', 'starlight', 'princess', 'gates', 'kakek',
    'pragmatic', 'joker', 'habanero', 'mega', 'super', 'royal',
    'king', 'queen', 'lucky', 'win', 'bet', 'depo', 'wd',
    'mpo', 'sbo', 'pg', 'rtp', 'jp', 'sensational',
  ];
  
  for (const base of gamblingBases) {
    // Pattern: gambling_word + 2+ digits
    const pattern1 = new RegExp(`${base}(\\d{2,})`, 'i');
    const match1 = cleanText.match(pattern1);
    if (match1) return { isJudol: true, name: `${base}${match1[1]}` };
    
    // Pattern: 2+ digits + gambling_word
    const pattern2 = new RegExp(`(\\d{2,})${base}`, 'i');
    const match2 = cleanText.match(pattern2);
    if (match2) return { isJudol: true, name: `${match2[1]}${base}` };
  }
  
  return { isJudol: false, name: '' };
}

// ==================== VULGAR/TOXIC WORDS ====================
const VULGAR_WORDS = [
  'ngentot', 'ng3ntot', 'ngent0t', 'ngentt0t',
  'memek', 'm3m3k', 'mem3k', 'mmek', 'mek',
  'kontol', 'k0nt0l', 'kont0l', 'k0ntol', 'kontl', 'ktl',
  'pepek', 'p3p3k', 'pep3k',
  'jembut', 'j3mbut',
  'titit', 't1t1t',
  'toket', 't0k3t',
];

// ==================== MAIN DETECTION ====================
export function detectJudol(text: string, customSpamWords: string[] = []): SpamResult {
  const originalLower = text.toLowerCase();
  const normalized = normalizeUnicode(text);
  const normalizedLeet = normalizeLeet(text);
  
  let score = 0;
  const keywordsFound: string[] = [];
  
  // Check vulgar/toxic words first (highest priority)
  for (const word of VULGAR_WORDS) {
    const wordNorm = word.toLowerCase().replace(/\s/g, '');
    if (normalized.includes(wordNorm) || normalizedLeet.includes(wordNorm) || originalLower.includes(word)) {
      keywordsFound.push(`toxic:${word}`);
      score += 100; // Vulgar words = instant spam
    }
  }
  
  // If vulgar word found, return immediately
  if (keywordsFound.length > 0 && keywordsFound.some(k => k.startsWith('toxic:'))) {
    return {
      isSpam: true,
      score: 100,
      keywords: keywordsFound.slice(0, 5)
    };
  }
  
  // Check custom spam words (user-defined)
  if (customSpamWords.length > 0) {
    for (const word of customSpamWords) {
      const wordNorm = word.toLowerCase().replace(/\s/g, '');
      if (normalized.includes(wordNorm) || normalizedLeet.includes(wordNorm) || originalLower.includes(word.toLowerCase())) {
        keywordsFound.push(`custom:${word}`);
        score += 60; // Custom words get high score
      }
    }
  }
  
  // Check viewer reporting judol (NOT SPAM)
  const reportPatterns = [/ada\s+judol/i, /judol\s+lagi/i, /ban\s+judol/i, /report\s+judol/i];
  if (reportPatterns.some(p => p.test(originalLower))) {
    return { isSpam: false, keywords: [], score: 0 };
  }
  
  // ==================== #46 PHONE NUMBER DETECTION ====================
  const phoneResult = detectPhoneNumbers(text);
  if (phoneResult.hasPhone) {
    score += phoneResult.score;
    keywordsFound.push(`phone:${phoneResult.numbers[0]}`);
  }
  
  // ==================== #47 LINK SHORTENER DETECTION ====================
  const linkResult = detectLinkShorteners(text);
  if (linkResult.hasShortener) {
    score += linkResult.score;
    keywordsFound.push(`link:${linkResult.links[0]}`);
  }
  
  // ==================== #48 UNICODE BYPASS DETECTION ====================
  const unicodeResult = detectUnicodeBypass(text);
  if (unicodeResult.hasUnicodeBypass) {
    score += unicodeResult.score;
    if (unicodeResult.unicodeChars.length > 0) {
      keywordsFound.push(`unicode:${unicodeResult.unicodeChars.slice(0, 3).join('')}`);
    }
  }
  
  // ==================== #49 REPEATED CHAR DETECTION ====================
  const repeatedResult = detectRepeatedChars(text);
  if (repeatedResult.hasRepeatedBypass) {
    score += repeatedResult.score;
    if (repeatedResult.detectedWord) {
      keywordsFound.push(`repeated:${repeatedResult.detectedWord}`);
    } else {
      keywordsFound.push('repeated:bypass');
    }
  }
  
  // Check spaced unicode spam
  const spaced = detectSpacedSpam(text);
  if (spaced.isSpam) {
    return { isSpam: true, keywords: [`spaced:${spaced.word}`], score: spaced.score };
  }
  
  // Check judol link pattern (zeus666, garuda777, etc)
  const judolLink = detectJudolLinkPattern(text);
  if (judolLink.isJudol) {
    keywordsFound.push(`site:${judolLink.name}`);
    score += 85;
  }
  
  // Check keywords
  for (const kw of JUDOL_KEYWORDS) {
    const kwNorm = kw.replace(/\s/g, '');
    if (normalized.includes(kwNorm) || normalizedLeet.includes(kwNorm)) {
      if (!keywordsFound.includes(kw)) {
        keywordsFound.push(kw);
      }
    }
  }
  
  // SPAM = keyword + contact (phone or link)
  const hasContact = phoneResult.hasPhone || linkResult.hasShortener || hasContactInfo(text);
  if (keywordsFound.length > 0 && hasContact) {
    score += 40;
  }
  
  // Multiple keywords = higher score
  if (keywordsFound.length >= 4) {
    score += 40;
  } else if (keywordsFound.length >= 3) {
    score += 30;
  } else if (keywordsFound.length >= 2) {
    score += 15;
  }
  
  // Site name pattern: zeus666, garuda777, slot88
  if (/[a-zA-Z]{3,}(666|777|888|88|99|123)\b/i.test(normalizedLeet)) {
    if (!keywordsFound.includes('site_pattern')) {
      score += 60;
      keywordsFound.push('site_pattern');
    }
  }
  
  // Promo phrases
  const promoPatterns = [
    'pasti menang', 'auto win', 'dijamin cair', 'daftar sekarang',
    'bonus new member', 'rtp live', 'modal kecil', 'gampang menang',
    'anti rungkad', 'server luar', 'akun pro', 'akun vip'
  ];
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

// Export individual detectors for testing/debugging
export { detectPhoneNumbers, detectLinkShorteners, detectUnicodeBypass, detectRepeatedChars };
