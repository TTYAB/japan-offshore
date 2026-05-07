// crawler/parsers/gyo-ne-jp.mjs
// 関東沖釣り情報 (gyo.ne.jp) 用パーサー。
// 多くの東京湾老舗船宿（米元・忠彦丸・吉久など）がここに釣果を投稿しており
// HTML構造がほぼ統一されている。Shift_JISエンコーディングに注意。

import * as cheerio from 'cheerio';
import { fetchHtml } from '../lib/fetch.mjs';
import {
  extractDate,
  extractFishCounts,
  extractSize,
  compactText,
} from '../lib/normalize.mjs';

export async function parse(boat) {
  const { html, status, error } = await fetchHtml(boat.crawl.url, 'shift_jis');

  if (error || !html) {
    return { ok: false, error: error || `status ${status}`, catches: [] };
  }

  const $ = cheerio.load(html);

  // gyo.ne.jpの釣果ページは、各日付の釣果が <table> または <div> に分割されている。
  // 確実なのは「ページ全体のテキストから日付ブロックを切り出す」アプローチ。
  const fullText = $('body').text();

  // 日付パターン「○月○日(○)」または「2026/○/○」で分割
  const dateBlocks = splitByDate(fullText);

  const catches = [];
  const now = new Date();

  for (const block of dateBlocks) {
    const date = extractDate(block.dateText, now);
    if (!date) continue;

    const fishCounts = extractFishCounts(block.body);
    if (fishCounts.length === 0) continue;

    for (const fc of fishCounts) {
      catches.push({
        date,
        fish: fc.fish,
        countMin: fc.countMin,
        countMax: fc.countMax,
        sizeRange: extractSize(block.body),
        comment: compactText(block.body, 100),
      });
    }
  }

  // 日付の新しい順、同じ日は魚種ごとに残す
  catches.sort((a, b) => b.date.localeCompare(a.date));

  return {
    ok: true,
    catches: catches.slice(0, 50), // 直近50件まで
    crawledAt: new Date().toISOString(),
  };
}

/**
 * テキストを日付ブロックに分割。
 * 日付パターンを見つけたら、次の日付パターンまでを「その日のブロック」とする。
 */
function splitByDate(text) {
  const datePattern = /(\d{1,2}月\d{1,2}日|20\d{2}[\/\-]\d{1,2}[\/\-]\d{1,2})/g;
  const matches = [];
  let m;
  while ((m = datePattern.exec(text)) !== null) {
    matches.push({ index: m.index, dateText: m[1] });
  }

  const blocks = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : Math.min(start + 1500, text.length);
    blocks.push({
      dateText: matches[i].dateText,
      body: text.slice(start, end),
    });
  }
  return blocks;
}
