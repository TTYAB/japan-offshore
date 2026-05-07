// crawler/lib/tide.mjs
// 潮汐・月齢・日の出入りデータを tide736.net から取得する。
// API: https://api.tide736.net/get_tide.php?pc={prefcode}&hc={harborcode}&yr=2026&mn=5&dy=8&rg=day
// 各船宿に最も近い港のコードを使い、24時間分の潮位を取得する。

const TIDE_API_BASE = 'https://api.tide736.net/get_tide.php';

/**
 * 指定の日付・港の潮汐データを取得。
 * @param {object} port - { prefcode, harborcode, name }
 * @param {string} date - 'YYYY-MM-DD'
 * @returns {Promise<object>} 正規化された潮汐データ
 */
export async function fetchTide(port, date) {
  const [yr, mn, dy] = date.split('-').map(Number);
  const url = `${TIDE_API_BASE}?pc=${port.prefcode}&hc=${port.harborcode}&yr=${yr}&mn=${mn}&dy=${dy}&rg=day`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'TokyoBayOffshoreBot/1.0 (+research)',
        'Accept': 'application/json',
      },
    });
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` };
    }
    const data = await res.json();
    return normalize(data, date);
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * tide736.netのレスポンスを使いやすい形に整形。
 * 元データ: tide.{date}.tide[24個] = [{time:"00:00", cm:80, unix:...}, ...]
 *           tide.{date}.flood[]   = [{time:"04:30", cm:120}]  (満潮)
 *           tide.{date}.edd[]     = [{time:"10:00", cm:30}]   (干潮)
 *           tide.{date}.sun       = {rise:"04:50", mid:"11:30", set:"18:10"}
 *           tide.{date}.moon      = {age: 14.5, rise:"...", set:"...", title:"大潮"}
 */
function normalize(raw, date) {
  try {
    const day = raw.tide?.chart?.[date];
    if (!day) {
      return { ok: false, error: `no data for ${date}` };
    }

    // 24時間分の潮位（1時間ごと）
    const hourly = (day.tide || []).map(t => ({
      time: t.time,           // "HH:MM"
      hour: parseInt(t.time?.split(':')[0] || 0, 10),
      cm: t.cm,                // 潮位 cm
      unix: t.unix,            // unix timestamp
    }));

    // 満潮・干潮
    const floods = (day.flood || []).map(t => ({ time: t.time, cm: t.cm }));
    const edds = (day.edd || []).map(t => ({ time: t.time, cm: t.cm }));

    // 太陽・月
    const sun = day.sun || {};
    const moon = day.moon || {};

    return {
      ok: true,
      date,
      hourly,        // 24個
      highTides: floods,
      lowTides: edds,
      sunrise: sun.rise || null,
      sunset: sun.set || null,
      sunMidday: sun.mid || null,
      moonrise: moon.rise || null,
      moonset: moon.set || null,
      moonAge: moon.age != null ? Number(moon.age) : null,
      moonTitle: moon.title || null,  // "大潮"|"中潮"|"小潮"|"長潮"|"若潮"
    };
  } catch (err) {
    return { ok: false, error: `normalize failed: ${err.message}` };
  }
}

/**
 * 潮位変化速度（cm/h）の絶対値を時間帯ごとに計算。
 * 動きが大きい = 釣れやすい時間帯の指標。
 */
export function calcTideMovement(hourly) {
  if (!hourly?.length) return [];
  return hourly.map((h, i) => {
    if (i === 0) return { hour: h.hour, delta: 0 };
    const delta = Math.abs(h.cm - hourly[i - 1].cm);
    return { hour: h.hour, delta };
  });
}
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
