// crawler/parsers/aggregator.mjs
// マリネス釣り情報 (marines-net.co.jp) と 釣りビジョン (fishing-v.jp) 用パーサー。
// 集約サイトはchowariと似た構造で、釣果情報がカード形式で並んでいる。

import * as cheerio from 'cheerio';
import { fetchHtml } from '../lib/fetch.mjs';
import {
  extractDate,
  extractFishCounts,
  extractSize,
  compactText,
} from '../lib/normalize.mjs';

/**
 * 共通実装: HTMLからテキスト抽出 → 日付分割 → 魚種抽出。
 */
async function parseAggregator(boat) {
  const enc = boat.crawl.encoding || 'utf-8';
  const { html, status, error } = await fetchHtml(boat.crawl.url, enc);

  if (error || !html) {
    return { ok: false, error: error || `status ${status}`, catches: [] };
  }

  const $ = cheerio.load(html);
  $('script, style, nav, footer, header, .header, .footer, .nav').remove();

  const fullText = $('body').text();

  const datePattern = /(20\d{2}年\s*\d{1,2}月\s*\d{1,2}日|\d{1,2}月\s*\d{1,2}日|20\d{2}[\/\-]\d{1,2}[\/\-]\d{1,2})/g;
  const matches = [];
  let m;
  while ((m = datePattern.exec(fullText)) !== null) {
    matches.push({ index: m.index, dateText: m[1] });
  }

  const catches = [];
  const now = new Date();
  const seenKey = new Set();

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : Math.min(start + 1200, fullText.length);
    const block = fullText.slice(start, end);

    const date = extractDate(matches[i].dateText, now);
    if (!date) continue;

    const fishCounts = extractFishCounts(block);
    for (const fc of fishCounts) {
      const key = `${date}-${fc.fish}-${fc.countMin}`;
      if (seenKey.has(key)) continue;
      seenKey.add(key);

      catches.push({
        date,
        fish: fc.fish,
        countMin: fc.countMin,
        countMax: fc.countMax,
        sizeRange: extractSize(block),
        comment: compactText(block, 100),
      });
    }
  }

  catches.sort((a, b) => b.date.localeCompare(a.date));

  return {
    ok: true,
    catches: catches.slice(0, 50),
    crawledAt: new Date().toISOString(),
  };
}

export const parseMarinesNet = parseAggregator;
export const parseFishingV = parseAggregator;
export { parseAggregator as parse };
