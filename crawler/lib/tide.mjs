// crawler/lib/tide.mjs
// 潮汐・月齢・日の出入りデータを tide736.net から取得する。

const TIDE_API_BASE = 'https://api.tide736.net/get_tide.php';

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

function normalize(raw, date) {
  try {
    const day = raw && raw.tide && raw.tide.chart && raw.tide.chart[date];
    if (!day) {
      return { ok: false, error: `no data for ${date}` };
    }

    const hourly = (day.tide || []).map(function(t) {
      return {
        time: t.time,
        hour: parseInt((t.time || '0:0').split(':')[0], 10),
        cm: t.cm,
        unix: t.unix,
      };
    });

    const floods = (day.flood || []).map(function(t) {
      return { time: t.time, cm: t.cm };
    });
    const edds = (day.edd || []).map(function(t) {
      return { time: t.time, cm: t.cm };
    });

    const sun = day.sun || {};
    const moon = day.moon || {};

    return {
      ok: true,
      date: date,
      hourly: hourly,
      highTides: floods,
      lowTides: edds,
      sunrise: sun.rise || null,
      sunset: sun.set || null,
      sunMidday: sun.mid || null,
      moonrise: moon.rise || null,
      moonset: moon.set || null,
      moonAge: moon.age != null ? Number(moon.age) : null,
      moonTitle: moon.title || null,
    };
  } catch (err) {
    return { ok: false, error: `normalize failed: ${err.message}` };
  }
}

export function calcTideMovement(hourly) {
  if (!hourly || !hourly.length) return [];
  return hourly.map(function(h, i) {
    if (i === 0) return { hour: h.hour, delta: 0 };
    const delta = Math.abs(h.cm - hourly[i - 1].cm);
    return { hour: h.hour, delta: delta };
  });
}
