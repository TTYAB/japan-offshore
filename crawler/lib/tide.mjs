// crawler/fetch-tide.mjs
// 潮汐データ取得スクリプト。
// - 各船宿の最寄り港について、今日〜7日先までの潮汐情報を tide736.net から取得
// - 結果を data/tide.json に保存
// - 失敗しても既存データを保持（壊れない設計）

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

import { fetchTide } from './lib/tide.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const DAYS_AHEAD = 7;  // 今日から何日先まで取得するか
const CONCURRENCY = 3;

function parseArgs() {
  const args = process.argv.slice(2);
  const r = { dryRun: false };
  for (const a of args) if (a === '--dry-run') r.dryRun = true;
  return r;
}

function getDateRange(daysAhead) {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < daysAhead; i++) {
    const d = new Date(today.getTime() + i * 86400000);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

async function main() {
  const args = parseArgs();
  const startedAt = new Date();
  console.log(`[${startedAt.toISOString()}] Tide fetcher started`);

  // マスターから港リストを抽出（重複排除）
  const masterPath = path.join(ROOT, 'data', 'boats-master.json');
  const master = JSON.parse(readFileSync(masterPath, 'utf-8'));

  const portMap = new Map();
  for (const boat of master.boats) {
    if (!boat.tidePort) continue;
    const key = `${boat.tidePort.prefcode}-${boat.tidePort.harborcode}`;
    if (!portMap.has(key)) portMap.set(key, boat.tidePort);
  }
  console.log(`Unique ports: ${portMap.size}`);

  // 既存tide.jsonをロード（フォールバック用）
  const tidePath = path.join(ROOT, 'data', 'tide.json');
  let existing = { ports: {} };
  if (existsSync(tidePath)) {
    try {
      existing = JSON.parse(readFileSync(tidePath, 'utf-8'));
    } catch (e) {
      console.warn('warn: existing tide.json broken, ignoring');
    }
  }

  const dates = getDateRange(DAYS_AHEAD);
  console.log(`Fetching ${dates.length} days × ${portMap.size} ports = ${dates.length * portMap.size} requests`);

  const result = {
    _lastFetched: startedAt.toISOString(),
    _version: '1.0.0',
    ports: { ...(existing.ports || {}) },
    summary: { ok: 0, failed: 0 },
  };

  // 港ごとに取得
  for (const [key, port] of portMap.entries()) {
    if (!result.ports[key]) {
      result.ports[key] = {
        portInfo: port,
        days: {},
      };
    }

    // 並列度を抑えながら日別取得
    for (let i = 0; i < dates.length; i += CONCURRENCY) {
      const chunk = dates.slice(i, i + CONCURRENCY);
      await Promise.all(chunk.map(async date => {
        try {
          const tideData = await fetchTide(port, date);
          if (tideData.ok) {
            result.ports[key].days[date] = tideData;
            result.summary.ok++;
            console.log(`  [${key}] ${date} OK (${tideData.hourly.length}h, moon=${tideData.moonTitle || '?'})`);
          } else {
            result.summary.failed++;
            console.error(`  [${key}] ${date} FAIL: ${tideData.error}`);
            // 既存データを保持（result.ports[key].days[date] はそのまま既存があれば残る）
          }
        } catch (err) {
          result.summary.failed++;
          console.error(`  [${key}] ${date} EXCEPTION: ${err.message}`);
        }
      }));
    }

    // 古いデータ（昨日以前）を削除
    const today = new Date().toISOString().slice(0, 10);
    for (const day of Object.keys(result.ports[key].days)) {
      if (day < today) {
        delete result.ports[key].days[day];
      }
    }
  }

  console.log(`\nSummary: ${result.summary.ok} ok, ${result.summary.failed} failed`);

  if (!args.dryRun) {
    writeFileSync(tidePath, JSON.stringify(result, null, 2), 'utf-8');
    console.log(`Wrote ${tidePath}`);
  } else {
    console.log('[dry-run] no write');
  }

  // 全失敗のときだけ exit 1
  if (result.summary.ok === 0 && result.summary.failed > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
