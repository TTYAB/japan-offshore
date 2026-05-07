// crawler/lib/normalize.mjs
// 日本語テキストから「日付」「魚種」「数」「サイズ」を抽出する共通ヘルパー。
// 多くの船宿サイトで使われる定型パターンを正規表現でカバーする。

/**
 * 既知の対象魚種リスト。マスターデータから抽出した上で、
 * バリエーション（LTアジ→アジ等）を吸収する。
 */
export const FISH_LEXICON = [
  'LTアジ', 'アジ', 'マアジ',
  'タチウオ', '太刀魚',
  'シーバス', 'スズキ',
  'シロギス', 'キス',
  'マゴチ', 'ヒラメ',
  'カワハギ', 'カサゴ', 'メバル', 'イシモチ',
  'ブリ', 'ワラサ', 'イナダ', 'サワラ', 'カツオ',
  'マダイ', 'タイ', 'クロダイ', 'チヌ',
  'アマダイ', 'アカムツ', 'クロムツ', 'キンメダイ', 'オニカサゴ', 'アラ',
  'アオリイカ', 'スミイカ', 'マルイカ', 'ヤリイカ', 'スルメイカ', 'マダコ',
  'トラフグ', 'ショウサイフグ', 'フグ', 'アナゴ', 'シイラ', '青物',
  'ホウボウ', 'メダイ', 'イサキ', 'ハタ',
];

/**
 * 「アジ 30本」「タチウオ 5-10本」「アジ 25-50匹」のようなパターンをマッチさせる。
 * カウント単位は「本」「匹」「枚」「杯」「尾」のいずれか。
 */
const COUNT_UNIT = '本|匹|枚|杯|尾';
const FISH_COUNT_PATTERN = new RegExp(
  `(${FISH_LEXICON.join('|')})[^0-9０-９ー\\-〜~]{0,15}([0-9０-９]+)(?:[\\s]*[\\-〜~ー][\\s]*([0-9０-９]+))?[\\s]*(?:${COUNT_UNIT})`,
  'g'
);

/**
 * 「20-35cm」「指3-5本」のサイズパターン。
 */
const SIZE_PATTERN_CM = /([0-9０-９]+)[\s]*[\-〜~ー][\s]*([0-9０-９]+)[\s]*(?:cm|ｃｍ|センチ)/g;
const SIZE_PATTERN_FINGER = /指([0-9０-９]+)[\s]*[\-〜~ー][\s]*([0-9０-９]+)[\s]*本/g;

/**
 * 全角数字を半角に正規化。
 */
export function normalizeNumber(str) {
  if (!str) return '';
  return String(str).replace(/[０-９]/g, ch =>
    String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)
  );
}

/**
 * 「2026年5月3日」「5/3」「2026-05-03」「2026/05/03」「5月3日（土）」等を
 * ISO8601の YYYY-MM-DD に正規化。
 *
 * @param {string} text
 * @param {Date} now 解釈の起点（今日の日付）
 * @returns {string|null}
 */
export function extractDate(text, now = new Date()) {
  if (!text) return null;
  const t = normalizeNumber(text);

  // 1. ISO形式: 2026-05-06 / 2026/05/06
  const iso = t.match(/(20\d{2})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
  if (iso) return formatDate(+iso[1], +iso[2], +iso[3]);

  // 2. 年付き和式: 2026年5月6日
  const wa = t.match(/(20\d{2})年(\d{1,2})月(\d{1,2})日/);
  if (wa) return formatDate(+wa[1], +wa[2], +wa[3]);

  // 3. 年なし和式: 5月6日 → 今年または去年で推測
  const waNoYear = t.match(/(\d{1,2})月(\d{1,2})日/);
  if (waNoYear) {
    const m = +waNoYear[1], d = +waNoYear[2];
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      const year = inferYear(now, m, d);
      return formatDate(year, m, d);
    }
  }

  // 4. スラッシュ年なし: 5/6
  const slash = t.match(/(?:^|[^\d])(\d{1,2})\/(\d{1,2})(?:[^\d]|$)/);
  if (slash) {
    const m = +slash[1], d = +slash[2];
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      const year = inferYear(now, m, d);
      return formatDate(year, m, d);
    }
  }

  return null;
}

function inferYear(now, month, day) {
  // 月日が今日より「6か月以上未来」なら去年と判定
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth() + 1;
  const thisDay = now.getDate();

  const candidate = new Date(thisYear, month - 1, day);
  const diffDays = (candidate - now) / (1000 * 60 * 60 * 24);

  if (diffDays > 180) return thisYear - 1;
  return thisYear;
}

function formatDate(y, m, d) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/**
 * テキストから魚種＋数＋（範囲）を抽出。
 *
 * @param {string} text
 * @returns {Array<{fish: string, countMin: number, countMax: number}>}
 */
export function extractFishCounts(text) {
  if (!text) return [];
  const t = normalizeNumber(text);
  const results = [];
  const seen = new Set();

  const pattern = new RegExp(FISH_COUNT_PATTERN.source, 'g');
  let m;
  while ((m = pattern.exec(t)) !== null) {
    const fish = canonicalFish(m[1]);
    const min = parseInt(m[2], 10);
    const max = m[3] ? parseInt(m[3], 10) : min;
    const key = `${fish}-${min}-${max}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({ fish, countMin: min, countMax: max });
  }
  return results;
}

/**
 * テキストからサイズ範囲を抽出（最初の1つ）。
 */
export function extractSize(text) {
  if (!text) return null;
  const t = normalizeNumber(text);
  const cm = SIZE_PATTERN_CM.exec(t);
  if (cm) return `${cm[1]}-${cm[2]}cm`;
  SIZE_PATTERN_CM.lastIndex = 0;
  const finger = SIZE_PATTERN_FINGER.exec(t);
  if (finger) return `指${finger[1]}-${finger[2]}本`;
  SIZE_PATTERN_FINGER.lastIndex = 0;
  return null;
}

/**
 * 魚名のバリエーションを正規化。
 * 例: 太刀魚 → タチウオ、LTアジ → アジ
 */
function canonicalFish(name) {
  const map = {
    '太刀魚': 'タチウオ',
    'スズキ': 'シーバス',
    'マアジ': 'アジ',
    'LTアジ': 'アジ',
    'チヌ': 'クロダイ',
    'タイ': 'マダイ',
    'キス': 'シロギス',
  };
  return map[name] || name;
}

/**
 * テキストの空白を圧縮し、長すぎる場合は切り詰める。
 */
export function compactText(text, maxLen = 120) {
  if (!text) return '';
  const compact = text.replace(/\s+/g, ' ').trim();
  if (compact.length <= maxLen) return compact;
  return compact.slice(0, maxLen) + '…';
}
