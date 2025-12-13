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

// ==================== MAIN DETECTION ====================
export function detectJudol(text: string, customSpamWords: string[] = []): SpamResult {
  const originalLower = text.toLowerCase();
  const normalized = normalizeUnicode(text);
  const normalizedLeet = normalizeLeet(text);
  
  let score = 0;
  const keywordsFound: string[] = [];
  
  // Check custom spam words first (user-defined)
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
  
  // Check spaced unicode spam
  const spaced = detectSpacedSpam(text);
  if (spaced.isSpam) {
    return { isSpam: true, keywords: [`spaced:${spaced.word}`], score: spaced.score };
  }
  
  // Check judol link pattern (zeus666, garuda777, etc)
  const judolLink = detectJudolLinkPattern(text);
  if (judolLink.isJudol) {
    return { isSpam: true, keywords: [`site:${judolLink.name}`], score: 85 };
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
  
  // Multiple keywords = higher score
  if (keywordsFound.length >= 3) {
    score += 30;
  } else if (keywordsFound.length >= 2) {
    score += 15;
  }
  
  // Site name pattern: zeus666, garuda777, slot88
  if (/[a-zA-Z]{3,}(666|777|888|88|99|123)\b/i.test(normalizedLeet)) {
    score += 80;
    keywordsFound.push('site_pattern');
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
  
  // Unicode bypass detection (many fancy letters = suspicious)
  const unicodeCount = [...text].filter(c => UNICODE_MAP[c]).length;
  if (unicodeCount >= 10 && keywordsFound.length > 0) {
    score += 30;
    keywordsFound.push('unicode_bypass');
  }
  
  return {
    isSpam: score >= 50,
    score: Math.min(score, 100),
    keywords: keywordsFound.slice(0, 5)
  };
}
