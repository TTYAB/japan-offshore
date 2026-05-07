// crawler/lib/fetch.mjs
// HTTPフェッチユーティリティ。古い日本のサイト（Shift_JIS）も扱える。
import iconv from 'iconv-lite';

const DEFAULT_TIMEOUT_MS = 15000;
const USER_AGENT = 'TokyoBayOffshoreBot/1.0 (+contact: example@example.com; respects robots.txt)';

/**
 * 指定URLからHTMLを取得。エンコーディングを考慮して文字列化する。
 * @param {string} url
 * @param {string} encoding 'utf-8' | 'shift_jis' | 'euc-jp'
 * @returns {Promise<{html: string, status: number}>}
 */
export async function fetchHtml(url, encoding = 'utf-8') {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ja,en;q=0.9',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    if (!res.ok) {
      return { html: '', status: res.status, error: `HTTP ${res.status}` };
    }

    const buffer = Buffer.from(await res.arrayBuffer());

    let html;
    if (encoding === 'shift_jis' || encoding === 'sjis') {
      html = iconv.decode(buffer, 'shift_jis');
    } else if (encoding === 'euc-jp') {
      html = iconv.decode(buffer, 'euc-jp');
    } else {
      // UTF-8: HTMLのmeta charsetを尊重しつつデフォルト
      html = buffer.toString('utf-8');
    }

    return { html, status: res.status };
  } catch (err) {
    return { html: '', status: 0, error: err.message };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * RSS/Atomフィードを取得。
 */
export async function fetchFeed(url) {
  return fetchHtml(url, 'utf-8');
}
