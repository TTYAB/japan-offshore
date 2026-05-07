// crawler/parsers/rss.mjs
// RSS/Atomフィード用パーサー（アイランドクルーズの jugem.jp ブログ等）。
// item内のtitle/description/dateからキャッチ情報を抽出する。

import * as cheerio from 'cheerio';
import { fetchFeed } from '../lib/fetch.mjs';
import {
  extractDate,
  extractFishCounts,
  extractSize,
  compactText,
} from '../lib/normalize.mjs';

export async function parse(boat) {
  const { html, status, error } = await fetchFeed(boat.crawl.url);

  if (error || !html) {
    return { ok: false, error: error || `status ${status}`, catches: [] };
  }

  // XMLとしてパース
  const $ = cheerio.load(html, { xmlMode: true });

  const items = [];
  // RSS 2.0
  $('item').each((_, el) => {
    const $el = $(el);
    items.push({
      title: $el.find('title').text(),
      desc: $el.find('description').text(),
      pubDate: $el.find('pubDate').text(),
    });
  });
  // Atom
  $('entry').each((_, el) => {
    const $el = $(el);
    items.push({
      title: $el.find('title').text(),
      desc: $el.find('summary, content').text(),
      pubDate: $el.find('updated, published').text(),
    });
  });

  const catches = [];
  const now = new Date();
  const seenKey = new Set();

  for (const item of items) {
    // pubDate優先で日付取得（RSSは標準的）
    let date = null;
    if (item.pubDate) {
      const d = new Date(item.pubDate);
      if (!isNaN(d.getTime())) {
        date = d.toISOString().slice(0, 10);
      }
    }
    // フォールバック: タイトルや本文から抽出
    if (!date) {
      date = extractDate(item.title + ' ' + item.desc, now);
    }
    if (!date) continue;

    const text = item.title + ' ' + item.desc;
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
