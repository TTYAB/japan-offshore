// crawler/crawl.mjs
// メインクローラー。
// 1. boats-master.json を読み込む
// 2. 各船宿に対し、指定されたパーサーで釣果を取得
// 3. 結果を catches.json に書き出す
// 4. エラーは個別にロギング、1軒失敗しても他は続行
//
// 実行: node crawl.mjs                # 全船宿
//      node crawl.mjs --boat yonemoto # 1軒のみ
//      node crawl.mjs --dry-run       # 書き込みなし（テスト）

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

import * as gyoNeJp from './parsers/gyo-ne-jp.mjs';
import * as chowari from './parsers/chowari.mjs';
import * as generic from './parsers/generic.mjs';
import * as rss from './parsers/rss.mjs';
import * as aggregator from './parsers/aggregator.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const PARSERS = {
  'gyo-ne-jp': gyoNeJp.parse,
  'chowari': chowari.parse,
  'generic': generic.parse,
  'rss': rss.parse,
  'marines-net': aggregator.parseMarinesNet,
  'fishing-v': aggregator.parseFishingV,
};

function parseArgs() {
  const args = process.argv.slice(2);
  const result = { boat: null, dryRun: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--boat') result.boat = args[++i];
    else if (args[i] === '--dry-run') result.dryRun = true;
  }
  return result;
}

async function main() {
  const args = parseArgs();
  const startedAt = new Date();

  console.log(`[${startedAt.toISOString()}] Crawler started`);
  if (args.boat) console.log(`  filter: boat=${args.boat}`);
  if (args.dryRun) console.log('  mode: dry-run (no write)');

  // マスター読み込み
  const masterPath = path.join(ROOT, 'data', 'boats-master.json');
  const master = JSON.parse(readFileSync(masterPath, 'utf-8'));
  const allBoats = master.boats;

  // 既存catches.jsonを読み込み（失敗時のフォールバック用）
  const catchesPath = path.join(ROOT, 'data', 'catches.json');
  let existing = { boats: {}, errors: [] };
  if (existsSync(catchesPath)) {
    try {
      existing = JSON.parse(readFileSync(catchesPath, 'utf-8'));
    } catch (e) {
      console.warn(`  warn: existing catches.json broken, ignoring`);
    }
  }

  const targetBoats = args.boat
    ? allBoats.filter(b => b.id === args.boat)
    : allBoats.filter(b => b.crawl?.enabled);

  if (targetBoats.length === 0) {
    console.error('No target boats found.');
    process.exit(1);
  }

  const result = {
    _lastCrawled: startedAt.toISOString(),
    _crawlerVersion: '1.0.0',
    boats: { ...(existing.boats || {}) },
    errors: [],
    summary: { ok: 0, failed: 0, total: targetBoats.length },
  };

  // 並列度を抑える（5並列）
  const concurrency = 5;
  for (let i = 0; i < targetBoats.length; i += concurrency) {
    const chunk = targetBoats.slice(i, i + concurrency);
    await Promise.all(chunk.map(async boat => {
      const tag = `[${boat.id}]`;
      try {
        const parser = PARSERS[boat.crawl.parser];
        if (!parser) {
          throw new Error(`Unknown parser: ${boat.crawl.parser}`);
        }

        console.log(`${tag} crawling ${boat.crawl.url}`);
        const t0 = Date.now();
        const out = await parser(boat);
        const elapsed = Date.now() - t0;

        if (!out.ok) {
          throw new Error(out.error || 'parse failed');
        }

        const prev = existing.boats[boat.id]?.catches || [];
        const merged = mergeCatches(prev, out.catches);

        result.boats[boat.id] = {
          lastSuccess: new Date().toISOString(),
          catches: merged,
          source: boat.crawl.url,
          parser: boat.crawl.parser,
        };
        result.summary.ok++;
        console.log(`${tag} OK — ${out.catches.length} catches (${elapsed}ms)`);
      } catch (err) {
        result.summary.failed++;
        result.errors.push({ boatId: boat.id, error: err.message });
        // 既存データは残す
        if (existing.boats[boat.id]) {
          result.boats[boat.id] = {
            ...existing.boats[boat.id],
            lastError: err.message,
            lastErrorAt: new Date().toISOString(),
          };
        }
        console.error(`${tag} FAIL — ${err.message}`);
      }
    }));
  }

  // 書き込み
  if (!args.dryRun) {
    writeFileSync(catchesPath, JSON.stringify(result, null, 2), 'utf-8');
    console.log(`\nWrote ${catchesPath}`);
  } else {
    console.log('\n[dry-run] would write:');
    console.log(JSON.stringify(result.summary, null, 2));
  }

  const elapsed = ((Date.now() - startedAt.getTime()) / 1000).toFixed(1);
  console.log(`\nDone in ${elapsed}s — ${result.summary.ok}/${result.summary.total} ok, ${result.summary.failed} failed`);
  if (result.errors.length) {
    console.log('\nErrors:');
    result.errors.forEach(e => console.log(`  ${e.boatId}: ${e.error}`));
  }

  // 全失敗時のみ exit 1（部分成功は ok 扱い、運用継続）
  if (result.summary.ok === 0) {
    process.exit(1);
  }
}

/**
 * 既存釣果と新規釣果をマージ。
 * 同じ (date, fish) の組み合わせは新しい方を優先。
 * 直近30日のデータのみ保持。
 */
function mergeCatches(prev, fresh) {
  const map = new Map();

  // 古いものから入れて、新しいもので上書き
  for (const c of prev) {
    const key = `${c.date}|${c.fish}`;
    map.set(key, c);
  }
  for (const c of fresh) {
    const key = `${c.date}|${c.fish}`;
    map.set(key, c);
  }

  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 86400000);
  const cutoff = thirtyDaysAgo.toISOString().slice(0, 10);

  return [...map.values()]
    .filter(c => c.date >= cutoff)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 100);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
