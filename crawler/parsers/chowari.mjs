// crawler/parsers/chowari.mjs
// 釣割 (chowari.jp) 用パーサー。
// 各船宿の /ship/{id}/catch/ ページに釣果一覧が構造化されて掲載されている。
// 深川吉野屋（ID:00271）等が登録されている。

import * as cheerio from 'cheerio';
import { fetchHtml } from '../lib/fetch.mjs';
import {
  extractDate,
  extractFishCounts,
  extractSize,
  compactText,
} from '../lib/normalize.mjs';

export async function parse(boat) {
  const { html, status, error } = await fetchHtml(boat.crawl.url, 'utf-8');

  if (error || !html) {
    return { ok: false, error: error || `status ${status}`, catches: [] };
  }

  const $ = cheerio.load(html);

  // chowari.jpは釣果カードが繰り返し構造で並ぶ。
  // セレクタはサイト変更に耐えるよう緩めに：
  //  「日付 + 魚種 + 尾数」を含むテキストブロックを探す。
  const candidates = [];

  $('article, .catch-card, .catch-item, [class*="catch"], [class*="result"], li').each((_, el) => {
    const t = $(el).text();
    if (t.length > 20 && t.length < 1500) candidates.push(t);
  });

  // フォールバック: 全テキストを日付分割
  if (candidates.length === 0) {
    const fullText = $('body').text();
    return parseFromFullText(fullText);
  }

  const catches = [];
  const now = new Date();
  const seenKey = new Set();

  for (const text of candidates) {
    const date = extractDate(text, now);
    if (!date) continue;

    const fishCounts = extractFishCounts(text);
    for (const fc of fishCounts) {
      const key = `${date}-${fc.fish}-${fc.countMin}`;
      if (seenKey.has(key)) continue;
      seenKey.add(key);

      catches.push({
        date,
        fish: fc.fish,
        countMin: fc.countMin,
        countMax: fc.countMax,
        sizeRange: extractSize(text),
        comment: compactText(text, 100),
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

function parseFromFullText(text) {
  const datePattern = /(\d{1,2}月\d{1,2}日|20\d{2}[\/\-]\d{1,2}[\/\-]\d{1,2})/g;
  const matches = [];
  let m;
  while ((m = datePattern.exec(text)) !== null) {
    matches.push({ index: m.index, dateText: m[1] });
  }

  const catches = [];
  const now = new Date();
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : Math.min(start + 1000, text.length);
    const block = text.slice(start, end);
    const date = extractDate(matches[i].dateText, now);
    if (!date) continue;

    for (const fc of extractFishCounts(block)) {
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

  return {
    ok: true,
    catches: catches.slice(0, 50),
    crawledAt: new Date().toISOString(),
  };
}
