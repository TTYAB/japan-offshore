// src/App.jsx
// v3.1 — JSONロード版 + §C LEARN MORE復活 + 魚種フィルタ + マッチ0除外

import React, { useState, useMemo, useEffect } from 'react';
import {
  Train, Car, Search, ChevronDown, ChevronUp, X,
  Wind, Waves, Thermometer, Moon, Star, ExternalLink,
  Compass, Plus, Minus, ArrowUpRight, Check, ArrowRight,
  Loader2, AlertCircle, Play, BookOpen, Sun, Sunrise, Sunset,
  TrendingUp, Activity,
} from 'lucide-react';
import {
  XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart,
  ReferenceLine,
} from 'recharts';

const C = {
  bg: '#070A12', bg2: '#0C111E', panel: '#10172A', line: '#1E2740',
  text: '#F2EEE3', dim: '#7A86A1', dim2: '#4B556F',
  coral: '#FF5337', aqua: '#6EE7CF', sand: '#E9D6A4',
};

const FONT_DISPLAY = '"Big Shoulders Display", "Shippori Mincho B1", serif';
const FONT_SERIF   = '"Fraunces", "Shippori Mincho B1", serif';
const FONT_BODY    = '"Hanken Grotesk", "Noto Sans JP", sans-serif';
const FONT_MONO    = '"JetBrains Mono", monospace';
const FONT_JP      = '"Shippori Mincho B1", "Noto Serif JP", serif';

const STATIONS = [
  '渋谷', '新宿', '東京', '品川', '横浜', '川崎', '大井町', '大森', '蒲田',
  '上野', '池袋', '秋葉原', '浜松町', '田町', '五反田', '目黒', '恵比寿',
  '新橋', '銀座', '八丁堀', '月島', '勝どき', '豊洲', '辰巳', '新木場',
  '木場', '門前仲町', '東陽町', '茅場町', '森下', '清澄白河',
  '金沢八景', '金沢文庫', '関内', '桜木町', '元町・中華街', 'みなとみらい',
  '木更津', '袖ヶ浦', '蘇我', '千葉', '船橋', '市川', '浦安', '葛西',
  '走水', '馬堀海岸', '北久里浜', '京急久里浜',
  '野島公園', '海の公園南口', '八景島', '新杉田', '磯子',
];

const FISH_CATEGORIES = [
  { id: 'beginner', label: '初心者向け・定番', sub: 'STARTER',
    fish: ['アジ', 'シロギス', 'カサゴ', 'イシモチ', 'メバル'] },
  { id: 'lure', label: 'ルアー人気', sub: 'LURE',
    fish: ['シーバス', 'マゴチ', 'サワラ', 'タチウオ', '青物', 'シイラ'] },
  { id: 'tasty', label: '食べて美味しい', sub: 'GOURMET',
    fish: ['アジ', 'タチウオ', 'マゴチ', 'カワハギ', 'アマダイ', 'マダイ', 'トラフグ'] },
  { id: 'fight', label: '引きが強い・大物', sub: 'FIGHT',
    fish: ['ブリ', 'ワラサ', 'イナダ', 'サワラ', 'ヒラメ', 'カツオ'] },
  { id: 'cephalopod', label: 'イカ・タコ', sub: 'CEPHALOPOD',
    fish: ['アオリイカ', 'スミイカ', 'マルイカ', 'ヤリイカ', 'スルメイカ', 'マダコ'] },
];

const FISH_EXPERIENCES = [
  { id: 'easy',  label: 'とにかく釣れやすい', sub: 'EASY',   fish: ['アジ', 'シロギス', 'カサゴ'] },
  { id: 'safe',  label: '初心者でも安心',     sub: 'SAFE',   fish: ['アジ', 'シロギス'] },
  { id: 'taste', label: '食べて美味しい',     sub: 'TASTE',  fish: ['アジ', 'タチウオ', 'マゴチ', 'カワハギ'] },
  { id: 'fight', label: '引きを楽しみたい',   sub: 'FIGHT',  fish: ['ブリ', 'ワラサ', 'サワラ', 'シーバス'] },
  { id: 'lure',  label: 'ルアーで釣りたい',   sub: 'LURE',   fish: ['シーバス', 'マゴチ', 'サワラ', 'タチウオ'] },
];

const BAY_CENTER = { lat: 35.45, lng: 139.78, name: '中ノ瀬' };

/* =========================================================================
   学習コンテンツ・プール
   ========================================================================= */
const LEARNING_CONTENT = {
  'アジ': [
    { type: 'video',   title: 'LTアジ完全ガイド｜東京湾の数釣り入門',           src: 'YouTube · TSURIBITO · 12分', url: 'https://www.youtube.com/results?search_query=LTアジ+東京湾+入門' },
    { type: 'article', title: '初心者でも釣れる！金沢八景LTアジ釣り解説',         src: 'TSURI HACK',                  url: 'https://tsurihack.com/?s=LTアジ' },
    { type: 'tackle',  title: 'おすすめタックル：ビシ40号 / PE1.5号 / リーダー3号', src: 'タックル目安',                 url: 'https://www.google.com/search?q=アジ+船+タックル' },
    { type: 'video',   title: '黄金アジを釣る・金沢八景沖の実釣',                src: 'YouTube · つり丸 · 18分',     url: 'https://www.youtube.com/results?search_query=黄金アジ+金沢八景' },
    { type: 'article', title: 'ビシ40号のセッティングと指示ダナの取り方',         src: 'OFFSHORE TIMES',             url: 'https://www.google.com/search?q=ビシ40号+セッティング' },
  ],
  'タチウオ': [
    { type: 'video',   title: 'タチウオテンヤ完全攻略｜東京湾観音崎沖',           src: 'YouTube · ルアーニュース · 15分', url: 'https://www.youtube.com/results?search_query=タチウオテンヤ+東京湾' },
    { type: 'article', title: '東京湾タチウオ最盛期攻略ガイド',                   src: 'OFFSHORE TIMES',              url: 'https://www.google.com/search?q=タチウオ+東京湾+攻略' },
    { type: 'tackle',  title: 'おすすめタックル：ジグ100-150g / テンヤ50号 / PE2号', src: 'タックル目安',                url: 'https://www.google.com/search?q=タチウオ+ジギング+タックル' },
    { type: 'video',   title: 'タチウオジギング・反応の取り方',                   src: 'YouTube · 9分',               url: 'https://www.youtube.com/results?search_query=タチウオジギング+東京湾' },
    { type: 'article', title: '指4本以上のドラゴンを狙う誘い方',                  src: 'LURE NEWS',                   url: 'https://www.google.com/search?q=タチウオ+ドラゴン+誘い' },
  ],
  'シーバス': [
    { type: 'video',   title: '湾奥シーバス｜バイブの使い方完全解説',             src: 'YouTube · アイランドクルーズ · 18分', url: 'https://www.youtube.com/results?search_query=ボートシーバス+東京湾' },
    { type: 'article', title: '東京湾ボートシーバス完全ガイド',                   src: 'TSURI HACK',                  url: 'https://tsurihack.com/?s=ボートシーバス' },
    { type: 'tackle',  title: 'おすすめルアー：バイブ26g / シンペン / VJ22-28g',  src: 'ルアー目安',                  url: 'https://www.google.com/search?q=シーバス+ボート+ルアー' },
    { type: 'video',   title: 'コノシロパターンのビッグベイト',                   src: 'YouTube · 14分',              url: 'https://www.youtube.com/results?search_query=シーバス+ビッグベイト+コノシロ' },
    { type: 'article', title: '湾奥シーバスのストラクチャー攻略',                 src: 'LURE NEWS',                   url: 'https://www.google.com/search?q=シーバス+ストラクチャー' },
  ],
  'シロギス': [
    { type: 'video',   title: 'シロギス天秤仕掛けの基本',                         src: 'YouTube · 11分',              url: 'https://www.youtube.com/results?search_query=シロギス+船+入門' },
    { type: 'article', title: '初心者向けシロギス釣り入門',                       src: 'TSURIBITO Web',               url: 'https://www.google.com/search?q=シロギス+船釣り+入門' },
    { type: 'tackle',  title: 'おすすめタックル：天秤15号 / PE1号 / 投げ竿2.4m',  src: 'タックル目安',                url: 'https://www.google.com/search?q=シロギス+タックル+船' },
  ],
  'マゴチ': [
    { type: 'video',   title: '走水マゴチ｜エサ釣りの基本（サイマキ刺し方）',     src: 'YouTube · 14分',              url: 'https://www.youtube.com/results?search_query=マゴチ+船+走水' },
    { type: 'article', title: '東京湾マゴチ釣り入門ガイド',                       src: 'TSURIBITO Web',               url: 'https://www.google.com/search?q=マゴチ+東京湾+入門' },
    { type: 'tackle',  title: 'おすすめタックル：三日月オモリ15号 / フロロ5号 / マゴチバリ', src: 'タックル目安',         url: 'https://www.google.com/search?q=マゴチ+タックル' },
    { type: 'video',   title: 'マゴチワインドの誘い方',                           src: 'YouTube · 11分',              url: 'https://www.youtube.com/results?search_query=マゴチ+ワインド' },
  ],
  'カワハギ': [
    { type: 'video',   title: 'カワハギ｜上手アタリの取り方完全解説',             src: 'YouTube · 22分',              url: 'https://www.youtube.com/results?search_query=カワハギ+船+アタリ' },
    { type: 'article', title: '竹岡沖カワハギ釣り徹底攻略',                       src: 'TSURI HACK',                  url: 'https://tsurihack.com/?s=カワハギ' },
    { type: 'tackle',  title: 'おすすめタックル：胴突3本針 / 集寄 / アサリエサ',  src: 'タックル目安',                url: 'https://www.google.com/search?q=カワハギ+タックル' },
  ],
  'マダイ': [
    { type: 'video',   title: '東京湾タイラバ完全ガイド',                         src: 'YouTube · 16分',              url: 'https://www.youtube.com/results?search_query=タイラバ+東京湾' },
    { type: 'article', title: 'ボートタイラバ入門｜横浜港のマダイ',               src: 'TSURI HACK',                  url: 'https://tsurihack.com/?s=タイラバ' },
    { type: 'tackle',  title: 'おすすめタックル：タイラバヘッド60-120g / PE0.8-1号', src: 'タックル目安',                url: 'https://www.google.com/search?q=タイラバ+タックル' },
    { type: 'video',   title: 'ネクタイカラー選びの基本',                         src: 'YouTube · 12分',              url: 'https://www.youtube.com/results?search_query=タイラバ+ネクタイ' },
  ],
  'カサゴ': [
    { type: 'video',   title: 'ライトゲームでカサゴを釣る',                       src: 'YouTube · 10分',              url: 'https://www.youtube.com/results?search_query=カサゴ+船' },
    { type: 'article', title: '初心者向けカサゴ釣り入門',                         src: 'TSURIBITO Web',               url: 'https://www.google.com/search?q=カサゴ+船釣り' },
  ],
  'クロダイ': [
    { type: 'video',   title: 'ボートクロダイ・キャンディ釣法',                   src: 'YouTube · アイランドクルーズ · 15分', url: 'https://www.youtube.com/results?search_query=ボートクロダイ+キャンディ' },
    { type: 'article', title: 'チヌキューブ・カラス貝の使い分け',                 src: 'LURE NEWS',                   url: 'https://www.google.com/search?q=クロダイ+ボート+ルアー' },
    { type: 'tackle',  title: 'おすすめタックル：チヌヘッド3.5g / フロロ3号',     src: 'タックル目安',                url: 'https://www.google.com/search?q=クロダイ+落とし込み' },
  ],
  'サワラ': [
    { type: 'video',   title: '東京湾サワラキャスティング',                       src: 'YouTube · 15分',              url: 'https://www.youtube.com/results?search_query=サワラ+東京湾' },
    { type: 'article', title: '湾奥サワラパターン攻略',                           src: 'LURE NEWS',                   url: 'https://www.google.com/search?q=サワラ+東京湾' },
    { type: 'tackle',  title: 'おすすめルアー：シンペン20-40g / メタルジグ60g',   src: 'ルアー目安',                  url: 'https://www.google.com/search?q=サワラ+ルアー' },
  ],
  'マダコ': [
    { type: 'video',   title: '東京湾マダコ船入門',                               src: 'YouTube · 13分',              url: 'https://www.youtube.com/results?search_query=マダコ+船+東京湾' },
    { type: 'article', title: 'タコエギの選び方',                                 src: 'TSURI HACK',                  url: 'https://tsurihack.com/?s=マダコ' },
  ],
  '青物': [
    { type: 'video',   title: '東京湾青物ジギング',                               src: 'YouTube · 17分',              url: 'https://www.youtube.com/results?search_query=青物+ジギング+東京湾' },
    { type: 'article', title: 'イナダ・ワラサパターンの読み方',                   src: 'LURE NEWS',                   url: 'https://www.google.com/search?q=青物+東京湾' },
  ],
  'メバル': [
    { type: 'video',   title: 'メバル船の基本',                                   src: 'YouTube · 9分',               url: 'https://www.youtube.com/results?search_query=メバル+船+東京湾' },
    { type: 'article', title: '湾奥メバルの誘い方',                               src: 'TSURIBITO Web',               url: 'https://www.google.com/search?q=メバル+船+誘い' },
  ],
  'ヒラメ': [
    { type: 'video',   title: '泳がせ釣りでヒラメ',                               src: 'YouTube · 14分',              url: 'https://www.youtube.com/results?search_query=ヒラメ+泳がせ+東京湾' },
    { type: 'article', title: '東京湾ヒラメ釣り入門',                             src: 'TSURI HACK',                  url: 'https://tsurihack.com/?s=ヒラメ' },
  ],
};

const DEFAULT_LEARNING_CONTENT = [
  { type: 'video',   title: '初めての船釣り｜乗船前に知っておきたい基本',         src: 'YouTube · 8分',               url: 'https://www.youtube.com/results?search_query=船釣り+初心者' },
  { type: 'article', title: '東京湾船釣り入門ガイド',                             src: 'TSURI HACK',                  url: 'https://tsurihack.com/?s=東京湾+船釣り' },
];

function pickLearningContent(targetFish) {
  const seen = new Set();
  const picked = [];
  for (const fish of targetFish) {
    const pool = LEARNING_CONTENT[fish];
    if (!pool) continue;
    for (const item of pool) {
      if (seen.has(item.title)) continue;
      seen.add(item.title);
      picked.push({ ...item, forFish: fish });
      if (picked.length >= 5) break;
    }
    if (picked.length >= 5) break;
  }
  if (picked.length === 0) {
    return DEFAULT_LEARNING_CONTENT.map(c => ({ ...c, forFish: null }));
  }
  return picked;
}

/* ===== データロード（JSON） ===================================== */

function useBoatData() {
  const [state, setState] = useState({
    loading: true, boats: [], catches: {}, tides: {},
    error: null, lastCrawled: null, tideLastFetched: null,
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [masterRes, catchesRes, tideRes] = await Promise.all([
          fetch('/data/boats-master.json'),
          fetch('/data/catches.json'),
          fetch('/data/tide.json'),
        ]);
        if (!masterRes.ok) throw new Error('boats-master.json not found');
        const master = await masterRes.json();
        const catches = catchesRes.ok ? await catchesRes.json() : { boats: {} };
        const tides = tideRes.ok ? await tideRes.json() : { ports: {} };
        if (cancelled) return;
        setState({
          loading: false,
          boats: master.boats || [],
          catches: catches.boats || {},
          tides: tides.ports || {},
          lastCrawled: catches._lastCrawled,
          tideLastFetched: tides._lastFetched,
          error: null,
        });
      } catch (e) {
        if (cancelled) return;
        setState({
          loading: false, boats: [], catches: {}, tides: {},
          error: e.message, lastCrawled: null, tideLastFetched: null,
        });
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return state;
}

/* =========================================================================
   潮汐ヘルパー
   ========================================================================= */

/**
 * 船宿の潮汐データを取得（指定日）。
 */
function getTideForBoat(boat, tides, date) {
  if (!boat?.tidePort || !tides) return null;
  const key = `${boat.tidePort.prefcode}-${boat.tidePort.harborcode}`;
  return tides[key]?.days?.[date] || null;
}

/**
 * 月齢から潮名を推定（fallback用）
 */
function estimateMoonTitle(age) {
  if (age == null) return null;
  if (age < 1.5 || age > 27.5) return '大潮';
  if (age >= 13 && age <= 17) return '大潮';
  if ((age >= 1.5 && age < 5) || (age >= 18 && age < 22)) return '中潮';
  if ((age >= 5 && age < 8) || (age >= 22 && age < 25)) return '小潮';
  if (age >= 8 && age < 9.5) return '長潮';
  if (age >= 9.5 && age < 11) return '若潮';
  return '中潮';
}

/**
 * 月齢から月相絵文字を返す
 */
function moonEmoji(age) {
  if (age == null) return '🌑';
  if (age < 1.5) return '🌑';
  if (age < 5.5) return '🌒';
  if (age < 9.5) return '🌓';
  if (age < 13) return '🌔';
  if (age < 16.5) return '🌕';
  if (age < 20) return '🌖';
  if (age < 24) return '🌗';
  if (age < 27.5) return '🌘';
  return '🌑';
}

/**
 * 時刻文字列 "HH:MM" から分(0-1439)を取得
 */
function timeToMinutes(str) {
  if (!str) return null;
  const [h, m] = str.split(':').map(Number);
  return h * 60 + m;
}

/**
 * 時間帯別の釣れやすさ（活性指数）を計算
 *
 * @param {object} tide - 潮汐データ
 * @param {object} weather - その日の天候 (24時間分でなく代表値)
 * @returns {Array<{hour, score, factors}>} 24時間分
 */
function calcBiteForecast(tide, weather) {
  if (!tide?.hourly) return [];

  const hourly = tide.hourly;
  const sunrise = timeToMinutes(tide.sunrise);
  const sunset = timeToMinutes(tide.sunset);
  const moonTitle = tide.moonTitle || estimateMoonTitle(tide.moonAge);

  // 月齢ボーナス（潮回り）
  const moonBonus = {
    '大潮': 10,
    '中潮': 5,
    '小潮': 0,
    '若潮': -3,
    '長潮': -5,
  }[moonTitle] || 0;

  // 風波の減点（その日全体の代表値で計算 — 簡易版）
  const wind = weather?.windSpeed ?? 0;
  const wave = weather?.waveHeight ?? 0;
  let weatherPenalty = 0;
  if (wind > 12) weatherPenalty -= 25;
  else if (wind > 8) weatherPenalty -= 15;
  else if (wind > 5) weatherPenalty -= 5;
  if (wave > 1.5) weatherPenalty -= 25;
  else if (wave > 1.0) weatherPenalty -= 12;
  else if (wave > 0.5) weatherPenalty -= 4;

  const result = [];

  for (let h = 0; h < 24; h++) {
    const cur = hourly.find(x => x.hour === h);
    const prev = hourly.find(x => x.hour === ((h + 23) % 24));
    if (!cur) continue;

    // 潮の動き量（cm/h）— 動きが大きいほど活性が上がる
    const tideMovement = prev ? Math.abs(cur.cm - prev.cm) : 0;
    // 0-30cm/h を 0-20点にマップ
    const tideScore = Math.min(20, tideMovement * 0.7);

    // マズメ補正（日の出・日没±60分）
    const minutes = h * 60 + 30;  // その時間帯の中央値
    let mazumeBonus = 0;
    if (sunrise != null) {
      const dist = Math.abs(minutes - sunrise);
      if (dist < 60) mazumeBonus = Math.max(mazumeBonus, 15 * (1 - dist / 60));
    }
    if (sunset != null) {
      const dist = Math.abs(minutes - sunset);
      if (dist < 60) mazumeBonus = Math.max(mazumeBonus, 12 * (1 - dist / 60));
    }

    // 夜間ペナルティ（5時前 or 19時以降は活性下がる）
    let nightPenalty = 0;
    if (sunrise != null && sunset != null) {
      if (minutes < sunrise - 90 || minutes > sunset + 90) nightPenalty = -10;
    }

    const score = Math.max(0, Math.min(100,
      60                      // ベース
      + tideScore             // 潮の動き 0-20
      + mazumeBonus           // マズメ 0-15
      + moonBonus             // 月齢 -5〜+10
      + weatherPenalty        // 風波 -25〜0
      + nightPenalty          // 夜間 0 or -10
    ));

    result.push({
      hour: h,
      score: Math.round(score),
      tideMovement: Math.round(tideMovement),
      isMazume: mazumeBonus > 5,
      isNight: nightPenalty < 0,
    });
  }

  return result;
}

/**
 * 24時間スコアからピーク時間帯を抽出（連続する高スコアのレンジ）
 */
function findPeakWindow(forecast) {
  if (!forecast?.length) return null;
  // スコア上位3時間を取り、隣接していればまとめる
  const sorted = [...forecast].sort((a, b) => b.score - a.score).slice(0, 5);
  sorted.sort((a, b) => a.hour - b.hour);
  if (!sorted.length) return null;
  // 最初の連続グループを返す
  const group = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].hour - group[group.length - 1].hour <= 2) {
      group.push(sorted[i]);
    } else break;
  }
  return {
    start: group[0].hour,
    end: group[group.length - 1].hour + 1,
    avgScore: Math.round(group.reduce((a, x) => a + x.score, 0) / group.length),
  };
}

/* ===== 天候API（Open-Meteo） ==================================== */

const weatherCache = new Map();

async function fetchWeather(lat, lng, date) {
  const key = `${date}_${lat.toFixed(3)}_${lng.toFixed(3)}`;
  if (weatherCache.has(key)) return weatherCache.get(key);

  const marineUrl =
    `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}` +
    `&hourly=wave_height,wave_period,wave_direction&timezone=Asia%2FTokyo` +
    `&start_date=${date}&end_date=${date}`;
  const forecastUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&hourly=temperature_2m,wind_speed_10m,wind_direction_10m&windspeed_unit=ms` +
    `&timezone=Asia%2FTokyo&start_date=${date}&end_date=${date}`;

  try {
    const [m, f] = await Promise.all([
      fetch(marineUrl).then(r => r.ok ? r.json() : Promise.reject(r.status)),
      fetch(forecastUrl).then(r => r.ok ? r.json() : Promise.reject(r.status)),
    ]);
    const pick = (arr) => {
      if (!arr || !arr.length) return null;
      if (arr.length > 7 && arr[7] != null) return arr[7];
      const v = arr.filter(x => x != null);
      return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
    };
    const result = {
      ok: true,
      waveHeight: pick(m.hourly?.wave_height),
      wavePeriod: pick(m.hourly?.wave_period),
      waveDirection: pick(m.hourly?.wave_direction),
      temperature: pick(f.hourly?.temperature_2m),
      windSpeed: pick(f.hourly?.wind_speed_10m),
      windDirection: pick(f.hourly?.wind_direction_10m),
    };
    weatherCache.set(key, result);
    return result;
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

function useWeatherAll(boats, date) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!date || !boats?.length) return;
    setLoading(true);
    let cancelled = false;
    Promise.all(boats.map(async b => {
      const w = await fetchWeather(b.lat, b.lng, date);
      return [b.id, w];
    })).then(entries => {
      if (cancelled) return;
      setData(Object.fromEntries(entries));
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [date, boats]);
  return { data, loading };
}

function useWeatherOne(lat, lng, date) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!date) return;
    setLoading(true);
    let cancelled = false;
    fetchWeather(lat, lng, date).then(w => {
      if (cancelled) return;
      setData(w); setLoading(false);
    });
    return () => { cancelled = true; };
  }, [date, lat, lng]);
  return { data, loading };
}

/* ===== スコアリング ============================================== */

function weatherScore(w) {
  if (!w?.ok) return 50;
  let s = 100;
  const wave = w.waveHeight ?? 0;
  const wind = w.windSpeed ?? 0;
  if (wave > 1.5) s -= 50; else if (wave > 1.0) s -= 25; else if (wave > 0.5) s -= 8;
  if (wind > 12) s -= 50; else if (wind > 8) s -= 22; else if (wind > 5) s -= 7;
  return Math.max(0, s);
}

function scoreBoat(boat, input, weather, catches) {
  const breakdown = {};
  let total = 0;

  const fishMatch = input.fish.filter(f =>
    boat.targets.some(t => t.includes(f) || f.includes(t))
  ).length;

  if (input.fish.length > 0 && fishMatch === 0) {
    return null;
  }

  const fishScore = input.fish.length === 0 ? 50 : (fishMatch / input.fish.length) * 100;
  breakdown.fish = fishScore;
  total += fishScore * 0.35;

  breakdown.weather = weatherScore(weather);
  total += breakdown.weather * 0.20;

  let recentScore = 50;
  if (catches?.length && input.fish.length) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const recent = catches.filter(c =>
      c.date >= sevenDaysAgo &&
      input.fish.some(f => c.fish.includes(f) || f.includes(c.fish))
    );
    if (recent.length > 0) {
      const avgCount = recent.reduce((a, c) => a + (c.countMax || c.countMin || 0), 0) / recent.length;
      recentScore = Math.min(100, 30 + avgCount * 1.5);
    } else {
      recentScore = 30;
    }
  }
  breakdown.recent = recentScore;
  total += recentScore * 0.15;

  let skillScore = boat.beginner;
  if (input.skill === 'expert') skillScore = 100 - Math.abs(60 - boat.beginner);
  else if (input.skill === 'mid') skillScore = 100 - Math.abs(75 - boat.beginner);
  breakdown.skill = skillScore;
  total += skillScore * 0.10;

  let accessScore = 60;
  if (input.transport === 'car') {
    accessScore = 80;
  } else {
    if (boat.shibuyaMin <= 45) accessScore += 20;
    else if (boat.shibuyaMin <= 60) accessScore += 12;
    else if (boat.shibuyaMin <= 75) accessScore += 4;
    else accessScore -= 8;
    if (boat.pickup) accessScore += 8;
    if (boat.walkMin <= 5) accessScore += 5;
    else if (boat.walkMin > 15) accessScore -= 5;
  }
  accessScore = Math.min(100, Math.max(0, accessScore));
  breakdown.access = accessScore;
  total += accessScore * 0.15;

  breakdown.review = boat.rating * 20;
  total += breakdown.review * 0.05;

  return { total: Math.round(total), breakdown };
}

/* ===== UIプリミティブ ============================================ */

const Mono = ({ children, style }) => (
  <span style={{
    fontFamily: FONT_MONO, fontSize: 11, letterSpacing: '0.12em',
    textTransform: 'uppercase', color: C.dim, ...style,
  }}>{children}</span>
);

const SectionLabel = ({ index, en }) => (
  <div className="flex items-baseline gap-3 mb-6">
    <Mono style={{ color: C.coral }}>NO. {index}</Mono>
    <div style={{ flex: 1, height: 1, background: C.line }} />
    <Mono>{en}</Mono>
  </div>
);

const ChapterTitle = ({ jp, en }) => (
  <div className="mb-8">
    <h2 style={{
      fontFamily: FONT_DISPLAY, fontWeight: 800,
      fontSize: 'clamp(44px, 12vw, 96px)',
      lineHeight: 0.88, letterSpacing: '-0.02em', color: C.text,
    }}>{en}</h2>
    <p style={{ fontFamily: FONT_JP, fontSize: 14, color: C.dim, marginTop: 4 }}>{jp}</p>
  </div>
);

function windDirEn(deg) {
  if (deg == null) return '—';
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}
function windDirJp(deg) {
  if (deg == null) return '—';
  const dirs = ['北','北北東','北東','東北東','東','東南東','南東','南南東','南','南南西','南西','西南西','西','西北西','北西','北北西'];
  return dirs[Math.round(deg / 22.5) % 16];
}

/* ===== ヘッダー＆ヒーロー ======================================= */

function MagazineHeader({ lastCrawled }) {
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  }).toUpperCase();

  return (
    <header style={{ padding: '20px 20px 0', borderBottom: `1px solid ${C.line}` }}>
      <div className="flex items-center justify-between">
        <Mono>{dateStr}</Mono>
        <Mono style={{ color: C.coral }}>VOL. 01 / ISSUE 05</Mono>
      </div>
      <div className="flex items-center justify-between mt-1">
        <Mono>SHIBUYA → TOKYO BAY · 90 MIN</Mono>
        <Mono>{lastCrawled
          ? `CRAWLED ${new Date(lastCrawled).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}`
          : 'NOT CRAWLED'}</Mono>
      </div>
    </header>
  );
}

function Hero({ onStart, boatCount }) {
  return (
    <section style={{ position: 'relative', padding: '32px 20px 60px', overflow: 'hidden' }}>
      <div aria-hidden style={{
        position: 'absolute', right: -100, top: -50, width: 360, height: 360,
        borderRadius: '50%', border: `1px solid ${C.line}`, opacity: 0.6,
      }} />
      <div aria-hidden style={{
        position: 'absolute', right: -40, top: 10, width: 240, height: 240,
        borderRadius: '50%', border: `1px dashed ${C.line}`,
      }} />

      <Mono style={{ color: C.aqua }}>EDITION №.05 — DAILY CRAWLED · LIVE WEATHER</Mono>

      <div style={{ position: 'relative', marginTop: 18 }}>
        <div style={{
          position: 'absolute', left: -8, top: 24, width: '78%', height: 36,
          background: C.coral, zIndex: 0,
        }} />
        <h1 style={{
          fontFamily: FONT_DISPLAY, fontWeight: 900,
          fontSize: 'clamp(64px, 22vw, 180px)',
          lineHeight: 0.82, letterSpacing: '-0.03em',
          color: C.text, position: 'relative', zIndex: 1, textTransform: 'uppercase',
        }}>
          Tokyo<br />
          <span style={{ color: C.sand, fontStyle: 'italic', fontFamily: FONT_SERIF, fontWeight: 500 }}>Bay</span>
          <br />Offshore
        </h1>

        <div style={{
          position: 'absolute', right: 8, top: 60, writingMode: 'vertical-rl',
          fontFamily: FONT_JP, fontSize: 12, color: C.dim,
          letterSpacing: '0.3em', zIndex: 2,
        }}>
          東京湾・船宿案内
        </div>
      </div>

      <p style={{
        fontFamily: FONT_SERIF, fontStyle: 'italic',
        fontSize: 18, lineHeight: 1.5, color: C.text,
        marginTop: 32, maxWidth: 520,
      }}>
        “渋谷から90分以内、東京湾の主要10軒。
        毎朝クロールされた最新の釣果と、Open-Meteoのライブ天候を組み合わせます。”
      </p>

      <button onClick={onStart} style={{
        marginTop: 32, padding: '16px 24px',
        background: C.coral, color: C.bg,
        fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 18,
        letterSpacing: '0.05em', textTransform: 'uppercase',
        border: 'none', width: '100%', maxWidth: 360,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        cursor: 'pointer',
      }}>
        Start The Search
        <ArrowRight size={20} strokeWidth={2.5} />
      </button>

      <div className="mt-10 grid grid-cols-3 gap-3" style={{ borderTop: `1px solid ${C.line}`, paddingTop: 18 }}>
        <div>
          <Mono>SHIPS</Mono>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 32, fontWeight: 800, color: C.aqua, lineHeight: 1 }}>
            {boatCount.toString().padStart(2, '0')}
          </div>
        </div>
        <div>
          <Mono>ZONES</Mono>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 32, fontWeight: 800, color: C.aqua, lineHeight: 1 }}>04</div>
        </div>
        <div>
          <Mono>UPDATE</Mono>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 800, color: C.aqua, lineHeight: 1, marginTop: 4 }}>DAILY</div>
        </div>
      </div>
    </section>
  );
}

/* ===== フォーム各セクション ===================================== */

function DateSection({ value, onChange }) {
  const { data, loading } = useWeatherOne(BAY_CENTER.lat, BAY_CENTER.lng, value);
  return (
    <div>
      <SectionLabel index="01" en="DATE" />
      <ChapterTitle jp="いつ出る？" en="WHEN" />
      <input type="date" value={value} onChange={e => onChange(e.target.value)} style={{
        width: '100%', padding: '20px 18px', background: C.bg2,
        border: `1px solid ${C.line}`, color: C.text,
        fontFamily: FONT_MONO, fontSize: 18, letterSpacing: '0.05em',
        outline: 'none', colorScheme: 'dark',
      }} />
      <div style={{ marginTop: 16, background: C.panel, border: `1px solid ${C.line}`, padding: 18 }}>
        <div className="flex items-center justify-between mb-4">
          <Mono style={{ color: C.aqua }}>FORECAST · {BAY_CENTER.name}</Mono>
          <Mono>{loading ? <Loader2 size={11} style={{ display: 'inline', animation: 'spin 1s linear infinite', verticalAlign: -1 }} /> : 'OPEN-METEO LIVE'}</Mono>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <WeatherCell icon={<Wind size={14} />} label="WIND" value={data?.windSpeed != null ? data.windSpeed.toFixed(1) : '—'} unit="m/s" />
          <WeatherCell icon={<Waves size={14} />} label="WAVE" value={data?.waveHeight != null ? data.waveHeight.toFixed(1) : '—'} unit="m" />
          <WeatherCell icon={<Thermometer size={14} />} label="TEMP" value={data?.temperature != null ? data.temperature.toFixed(0) : '—'} unit="°C" />
          <WeatherCell icon={<Moon size={14} />} label="WAVE T" value={data?.wavePeriod != null ? data.wavePeriod.toFixed(0) : '—'} unit="s" />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div style={{
            width: 32, height: 32, border: `1px solid ${C.aqua}`, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ transform: `rotate(${data?.windDirection ?? 0}deg)`, transition: 'transform 0.5s' }}>
              <ArrowRight size={16} color={C.aqua} style={{ transform: 'rotate(-90deg)' }} />
            </div>
          </div>
          <div>
            <Mono>WIND DIR · {windDirJp(data?.windDirection)} / {windDirEn(data?.windDirection)}</Mono>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.text, marginTop: 2 }}>
              {data?.windSpeed != null && data.windSpeed < 5 ? '湾内全域で穏やか。出船日和。'
                : data?.windSpeed != null && data.windSpeed < 8 ? '中程度の風。湾奥は問題なし、外湾は注意。'
                : data?.windSpeed != null ? '強風予想。出船中止の可能性あり。' : '取得中...'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WeatherCell({ icon, label, value, unit }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.dim }}>
        {icon}<Mono>{label}</Mono>
      </div>
      <div style={{
        fontFamily: FONT_DISPLAY, fontWeight: 800,
        fontSize: 28, color: C.text, lineHeight: 1.1, marginTop: 2,
      }}>
        {value}<span style={{ fontSize: 12, color: C.dim, marginLeft: 2 }}>{unit}</span>
      </div>
    </div>
  );
}

function PeopleSection({ value, onChange }) {
  return (
    <div>
      <SectionLabel index="02" en="HEADCOUNT" />
      <ChapterTitle jp="何人で出る？" en="HOW MANY" />
      <div style={{
        background: C.panel, border: `1px solid ${C.line}`, padding: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button onClick={() => onChange(Math.max(1, value - 1))} style={{
          width: 56, height: 56, background: C.bg, color: C.text,
          border: `1px solid ${C.line}`, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} aria-label="人数を減らす">
          <Minus size={20} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 96, lineHeight: 1, color: C.coral }}>
            {value.toString().padStart(2, '0')}
          </div>
          <Mono>PERSON{value > 1 ? 'S' : ''}</Mono>
        </div>
        <button onClick={() => onChange(Math.min(10, value + 1))} style={{
          width: 56, height: 56, background: C.bg, color: C.text,
          border: `1px solid ${C.line}`, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} aria-label="人数を増やす">
          <Plus size={20} />
        </button>
      </div>
    </div>
  );
}

function SkillSection({ value, onChange }) {
  const opts = [
    { id: 'beginner', jp: '初心者', en: 'NOVICE', desc: '初めて〜数回程度。レンタル中心、湾奥・短時間を優先。' },
    { id: 'mid',      jp: '中級者', en: 'MID',    desc: 'タックルあり・基本操作OK。沖目・テクニカルもOK。' },
    { id: 'expert',   jp: '上級者', en: 'EXPERT', desc: '大型・遠征・深場狙い。テクニカルな船も候補に。' },
  ];
  return (
    <div>
      <SectionLabel index="03" en="SKILL LEVEL" />
      <ChapterTitle jp="どのくらい慣れてる？" en="EXPERIENCE" />
      <div className="space-y-3">
        {opts.map(o => {
          const active = value === o.id;
          return (
            <button key={o.id} onClick={() => onChange(o.id)} style={{
              width: '100%', textAlign: 'left', padding: 18,
              background: active ? C.coral : C.panel,
              border: `1px solid ${active ? C.coral : C.line}`,
              color: active ? C.bg : C.text,
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
              <div className="flex items-center justify-between mb-1">
                <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 28, letterSpacing: '0.02em', lineHeight: 1 }}>
                  {o.en}
                </div>
                {active && <Check size={20} strokeWidth={3} />}
              </div>
              <div style={{ fontFamily: FONT_JP, fontSize: 13, marginBottom: 6, opacity: 0.9 }}>{o.jp}</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: active ? C.bg : C.dim, lineHeight: 1.5 }}>
                {o.desc}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StationAutosuggest({ value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const matches = useMemo(() => {
    if (!value) return [];
    return STATIONS.filter(s => s.includes(value)).slice(0, 6);
  }, [value]);
  return (
    <div style={{ position: 'relative' }}>
      <input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder || '駅名を入力'}
        style={{
          width: '100%', padding: '14px 16px',
          background: C.bg2, border: `1px solid ${C.line}`,
          color: C.text, fontFamily: FONT_BODY, fontSize: 15, outline: 'none',
        }}
      />
      {open && matches.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: C.panel, border: `1px solid ${C.line}`,
          maxHeight: 220, overflowY: 'auto', zIndex: 10,
        }}>
          {matches.map(m => (
            <button key={m} onMouseDown={() => { onChange(m); setOpen(false); }} style={{
              width: '100%', textAlign: 'left', padding: '10px 14px',
              background: 'transparent', border: 'none',
              color: C.text, fontFamily: FONT_BODY, fontSize: 14,
              cursor: 'pointer', borderTop: `1px solid ${C.line}`,
            }}>
              {m}<span style={{ color: C.dim, marginLeft: 6 }}>駅</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AccessSection({ transport, setTransport, stations, setStations, people }) {
  useEffect(() => {
    const next = [...stations];
    while (next.length < people) next.push('');
    while (next.length > people) next.pop();
    if (next.length !== stations.length) setStations(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [people]);
  return (
    <div>
      <SectionLabel index="04" en="TRANSIT" />
      <ChapterTitle jp="どうやって行く？" en="HOW TO GO" />
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[{ id: 'train', icon: Train, jp: '電車', en: 'TRAIN' }, { id: 'car', icon: Car, jp: '車', en: 'CAR' }].map(o => {
          const active = transport === o.id;
          const Icon = o.icon;
          return (
            <button key={o.id} onClick={() => setTransport(o.id)} style={{
              padding: 24, cursor: 'pointer',
              background: active ? C.aqua : C.panel,
              color: active ? C.bg : C.text,
              border: `1px solid ${active ? C.aqua : C.line}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
            }}>
              <Icon size={28} strokeWidth={1.5} />
              <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 22, letterSpacing: '0.05em' }}>{o.en}</div>
              <div style={{ fontFamily: FONT_JP, fontSize: 12, opacity: 0.8 }}>{o.jp}</div>
            </button>
          );
        })}
      </div>
      {transport === 'train' && (
        <div style={{ background: C.panel, border: `1px solid ${C.line}`, padding: 18 }}>
          <div className="flex items-center justify-between mb-4">
            <Mono style={{ color: C.coral }}>NEAREST STATION × {people}</Mono>
            <Mono>VIA NAVITIME (planned)</Mono>
          </div>
          <div className="space-y-3">
            {Array.from({ length: people }).map((_, i) => (
              <div key={i}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.dim, marginBottom: 6, letterSpacing: '0.1em' }}>
                  PERSON {(i + 1).toString().padStart(2, '0')}
                </div>
                <StationAutosuggest value={stations[i] || ''} onChange={v => {
                  const next = [...stations]; next[i] = v; setStations(next);
                }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MethodSection({ value, onChange }) {
  return (
    <div>
      <SectionLabel index="05" en="METHOD" />
      <ChapterTitle jp="どう釣る？" en="STYLE" />
      <div className="grid grid-cols-2 gap-3">
        {[{ id: 'bait', jp: 'エサ', en: 'BAIT', desc: 'ビシ・テンビン・テンヤなど' }, { id: 'lure', jp: 'ルアー', en: 'LURE', desc: 'ジグ・プラグ・バイブ' }].map(o => {
          const active = value === o.id;
          return (
            <button key={o.id} onClick={() => onChange(o.id)} style={{
              padding: 22, textAlign: 'left', cursor: 'pointer',
              background: active ? C.sand : C.panel,
              color: active ? C.bg : C.text,
              border: `1px solid ${active ? C.sand : C.line}`,
            }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 28 }}>{o.en}</div>
              <div style={{ fontFamily: FONT_JP, fontSize: 13, marginTop: 2 }}>{o.jp}</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: active ? C.bg : C.dim, marginTop: 8 }}>{o.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FishSection({ selected, setSelected }) {
  const [tab, setTab] = useState('species');
  const [search, setSearch] = useState('');
  const [openCat, setOpenCat] = useState({ beginner: true });
  const toggle = (fish) => {
    if (selected.includes(fish)) setSelected(selected.filter(f => f !== fish));
    else if (selected.length < 3) setSelected([...selected, fish]);
  };
  const data = tab === 'species' ? FISH_CATEGORIES : FISH_EXPERIENCES;
  const filteredData = useMemo(() => {
    if (!search) return data;
    return data.map(cat => ({ ...cat, fish: cat.fish.filter(f => f.includes(search)) }))
      .filter(cat => cat.fish.length > 0);
  }, [data, search]);

  return (
    <div>
      <SectionLabel index="06" en="TARGET SPECIES" />
      <ChapterTitle jp="何を狙う？" en="WHAT TO HUNT" />
      {selected.length > 0 && (
        <div style={{ background: C.panel, border: `1px solid ${C.line}`, padding: 14, marginBottom: 16 }}>
          <div className="flex items-center justify-between mb-2">
            <Mono style={{ color: C.coral }}>SELECTED · {selected.length}/3</Mono>
            <button onClick={() => setSelected([])} style={{
              background: 'transparent', border: 'none', color: C.dim,
              fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.1em', cursor: 'pointer',
            }}>CLEAR ALL</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selected.map(f => (
              <button key={f} onClick={() => toggle(f)} style={{
                padding: '8px 14px', background: C.coral, color: C.bg,
                border: 'none', fontFamily: FONT_BODY, fontWeight: 700, fontSize: 13,
                display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
              }}>
                {f} <X size={14} />
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex mb-4" style={{ borderBottom: `1px solid ${C.line}` }}>
        {[{ id: 'species', jp: '魚種から選ぶ', en: 'BY SPECIES' }, { id: 'experience', jp: '体験から選ぶ', en: 'BY EXPERIENCE' }].map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: '14px 8px',
              background: 'transparent', border: 'none',
              borderBottom: `2px solid ${active ? C.coral : 'transparent'}`,
              cursor: 'pointer', color: active ? C.text : C.dim,
              fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700, letterSpacing: '0.05em',
            }}>
              {t.en}
              <div style={{ fontFamily: FONT_JP, fontSize: 11, marginTop: 2, fontWeight: 400 }}>{t.jp}</div>
            </button>
          );
        })}
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: C.bg2, border: `1px solid ${C.line}`,
        padding: '12px 14px', marginBottom: 16,
      }}>
        <Search size={16} color={C.dim} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="魚種を検索" style={{
          flex: 1, background: 'transparent', border: 'none',
          color: C.text, fontFamily: FONT_BODY, fontSize: 14, outline: 'none',
        }} />
        {search && (
          <button onClick={() => setSearch('')} style={{ background: 'transparent', border: 'none', color: C.dim, cursor: 'pointer' }}>
            <X size={16} />
          </button>
        )}
      </div>
      <div className="space-y-3">
        {filteredData.map(cat => {
          const isOpen = !!openCat[cat.id] || !!search;
          return (
            <div key={cat.id} style={{ border: `1px solid ${C.line}`, background: C.panel }}>
              <button onClick={() => setOpenCat({ ...openCat, [cat.id]: !isOpen })} style={{
                width: '100%', textAlign: 'left', padding: '14px 16px',
                background: 'transparent', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer',
              }}>
                <div>
                  <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 18, color: C.text }}>{cat.sub}</div>
                  <div style={{ fontFamily: FONT_JP, fontSize: 12, color: C.dim, marginTop: 2 }}>{cat.label}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Mono>{cat.fish.length}</Mono>
                  {isOpen ? <ChevronUp size={18} color={C.dim} /> : <ChevronDown size={18} color={C.dim} />}
                </div>
              </button>
              {isOpen && (
                <div className="flex flex-wrap gap-2" style={{ padding: '0 16px 16px' }}>
                  {cat.fish.map(f => {
                    const active = selected.includes(f);
                    const disabled = !active && selected.length >= 3;
                    return (
                      <button key={cat.id + f} onClick={() => !disabled && toggle(f)} disabled={disabled} style={{
                        padding: '8px 14px',
                        background: active ? C.coral : 'transparent',
                        color: active ? C.bg : (disabled ? C.dim2 : C.text),
                        border: `1px solid ${active ? C.coral : C.line}`,
                        fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600,
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        opacity: disabled ? 0.4 : 1,
                      }}>
                        {f}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ===== 結果カード ============================================== */

function ScoreBar({ label, value, color }) {
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
        <Mono>{label}</Mono>
        <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.text }}>{Math.round(value)}</span>
      </div>
      <div style={{ height: 4, background: C.bg2, position: 'relative' }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${Math.min(100, value)}%`, background: color || C.aqua,
        }} />
      </div>
    </div>
  );
}

function CatchChart({ data }) {
  if (!data?.length) return null;
  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date)).slice(-7);
  const chartData = sorted.map(c => ({
    d: c.date.slice(5),
    count: c.countMax || c.countMin || 0,
  }));
  return (
    <div style={{ height: 100, marginTop: 8 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="catchGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.aqua} stopOpacity={0.5} />
              <stop offset="100%" stopColor={C.aqua} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="d" tick={{ fill: C.dim, fontSize: 9, fontFamily: FONT_MONO }} axisLine={{ stroke: C.line }} tickLine={false} />
          <YAxis hide domain={[0, 'dataMax + 5']} />
          <Tooltip cursor={{ stroke: C.coral, strokeWidth: 1 }} contentStyle={{
            background: C.bg, border: `1px solid ${C.line}`,
            fontFamily: FONT_MONO, fontSize: 11,
          }} labelStyle={{ color: C.dim }} itemStyle={{ color: C.aqua }} />
          <Area type="monotone" dataKey="count" stroke={C.aqua} strokeWidth={1.5} fill="url(#catchGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function MiniStat({ label, value, unit }) {
  return (
    <div>
      <Mono>{label}</Mono>
      <div style={{
        fontFamily: FONT_DISPLAY, fontWeight: 800,
        fontSize: 18, color: C.text, lineHeight: 1.1, marginTop: 1,
      }}>
        {value}{unit && <span style={{ fontSize: 10, color: C.dim, marginLeft: 1 }}>{unit}</span>}
      </div>
    </div>
  );
}

function BoatCard({ boat, score, weather, catchData, tideData, selectedFish = [], date, rank, expanded, onToggle }) {
  const rankColors = [C.coral, C.aqua, C.sand];
  const rankColor = rankColors[rank - 1];
  const allCatches = catchData?.catches || [];

  const filteredCatches = useMemo(() => {
    if (!allCatches.length) return [];
    if (selectedFish.length === 0) return allCatches;
    return allCatches.filter(c =>
      selectedFish.some(f => c.fish.includes(f) || f.includes(c.fish))
    );
  }, [allCatches, selectedFish]);

  const latest = filteredCatches[filteredCatches.length - 1] || allCatches[allCatches.length - 1];
  const learningContent = useMemo(() => pickLearningContent(selectedFish), [selectedFish]);
  const biteForecast = useMemo(() => calcBiteForecast(tideData, weather), [tideData, weather]);
  const peakWindow = useMemo(() => findPeakWindow(biteForecast), [biteForecast]);
  const moonTitle = tideData?.moonTitle || estimateMoonTitle(tideData?.moonAge);

  return (
    <article style={{
      background: C.panel, border: `1px solid ${C.line}`,
      position: 'relative', marginBottom: 18,
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0,
        background: rankColor, color: C.bg, padding: '6px 14px',
        fontFamily: FONT_DISPLAY, fontWeight: 800,
        fontSize: 16, letterSpacing: '0.05em', zIndex: 2,
      }}>№.0{rank}</div>

      <div style={{ padding: '38px 18px 20px' }}>
        <Mono>{boat.zoneEn} · {boat.port}</Mono>
        <h3 style={{
          fontFamily: FONT_DISPLAY, fontWeight: 900,
          fontSize: 'clamp(36px, 9vw, 56px)',
          lineHeight: 0.9, letterSpacing: '-0.02em',
          color: C.text, marginTop: 6, textTransform: 'uppercase',
        }}>{boat.nameEn}</h3>
        <div style={{ fontFamily: FONT_JP, fontSize: 14, color: C.dim, marginTop: 4 }}>{boat.name}</div>

        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Star size={14} color={C.sand} fill={C.sand} />
            <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.text }}>
              {boat.rating} <span style={{ color: C.dim }}>({boat.reviews})</span>
            </span>
          </div>
          <span style={{ color: C.dim2 }}>·</span>
          <Mono>渋谷 {boat.shibuyaMin}分</Mono>
          <span style={{ color: C.dim2 }}>·</span>
          <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.text }}>{boat.price}</span>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-4">
          {boat.targets.slice(0, 6).map(t => (
            <span key={t} style={{
              padding: '4px 10px', background: C.bg, border: `1px solid ${C.line}`,
              fontFamily: FONT_BODY, fontSize: 11, color: C.text,
            }}>{t}</span>
          ))}
        </div>

        <p style={{
          fontFamily: FONT_SERIF, fontStyle: 'italic',
          fontSize: 14, lineHeight: 1.6, color: C.text,
          marginTop: 16, paddingLeft: 12, borderLeft: `2px solid ${rankColor}`,
        }}>{boat.note}</p>

        <div className="mt-5" style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
          <div>
            <Mono style={{ color: rankColor }}>OVERALL MATCH</Mono>
            <div style={{
              fontFamily: FONT_DISPLAY, fontWeight: 900,
              fontSize: 72, lineHeight: 1,
              color: rankColor, letterSpacing: '-0.04em',
            }}>{score.total}</div>
          </div>
          <div style={{ flex: 1, paddingBottom: 6 }}>
            <ScoreBar label="FISH MATCH" value={score.breakdown.fish}    color={rankColor} />
            <ScoreBar label="WEATHER"    value={score.breakdown.weather} color={rankColor} />
            <ScoreBar label="RECENT"     value={score.breakdown.recent}  color={rankColor} />
            <ScoreBar label="ACCESS"     value={score.breakdown.access}  color={rankColor} />
          </div>
        </div>

        <div style={{ marginTop: 16, padding: 12, background: C.bg2, border: `1px solid ${C.line}` }}>
          <div className="flex items-center justify-between mb-2">
            <Mono style={{ color: C.aqua }}>LIVE @ {boat.portEn}</Mono>
            <Mono>OPEN-METEO</Mono>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <MiniStat label="WIND" value={weather?.windSpeed != null ? weather.windSpeed.toFixed(1) : '—'} unit="m/s" />
            <MiniStat label="WAVE" value={weather?.waveHeight != null ? weather.waveHeight.toFixed(1) : '—'} unit="m" />
            <MiniStat label="DIR"  value={windDirEn(weather?.windDirection)} unit="" />
            <MiniStat label="TEMP" value={weather?.temperature != null ? weather.temperature.toFixed(0) : '—'} unit="°C" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-5" style={{ borderTop: `1px solid ${C.line}`, paddingTop: 14 }}>
          <div>
            <Mono>STATION</Mono>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.text, marginTop: 2, fontWeight: 600 }}>
              {boat.station}
            </div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.dim, marginTop: 2 }}>
              徒歩 {boat.walkMin}分
            </div>
          </div>
          <div>
            <Mono>PICK UP</Mono>
            <div style={{
              fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 800,
              color: boat.pickup ? C.aqua : C.dim, marginTop: 2,
            }}>{boat.pickup ? 'YES' : 'NO'}</div>
          </div>
          <div>
            <Mono>RECENT</Mono>
            <div style={{
              fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 800,
              color: latest ? C.aqua : C.dim, marginTop: 2,
            }}>
              {latest ? `${latest.fish.slice(0, 4)} ${latest.countMax || latest.countMin}` : '—'}
            </div>
          </div>
        </div>

        <button onClick={onToggle} style={{
          width: '100%', marginTop: 18, padding: '14px',
          background: expanded ? C.bg : C.bg2,
          border: `1px solid ${C.line}`, color: C.text,
          fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 14,
          letterSpacing: '0.05em', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          {expanded ? 'CLOSE DETAILS' : 'OPEN FULL REPORT'}
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {expanded && (
        <div style={{ padding: '0 18px 18px', borderTop: `1px solid ${C.line}`, marginTop: 18 }}>
          {/* §A RECENT CATCHES */}
          <div style={{ marginTop: 28 }}>
            <div className="flex items-baseline gap-3 mb-3">
              <Mono style={{ color: rankColor }}>§ A</Mono>
              <div>
                <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 22, color: C.text }}>RECENT CATCHES</div>
                <div style={{ fontFamily: FONT_JP, fontSize: 11, color: C.dim }}>
                  {selectedFish.length > 0
                    ? `直近の釣果 — ${selectedFish.join('・')}`
                    : '直近の釣果（クロール取得）'}
                </div>
              </div>
            </div>
            {filteredCatches.length === 0 ? (
              <div style={{
                padding: 16, background: C.bg2, border: `1px dashed ${C.line}`,
                fontFamily: FONT_BODY, fontSize: 12, color: C.dim, textAlign: 'center',
              }}>
                {selectedFish.length > 0
                  ? `${selectedFish.join('・')}の直近釣果データなし`
                  : 'クロール未実行 or 取得失敗。クローラー実行後に反映されます。'}
              </div>
            ) : (
              <>
                <CatchChart data={filteredCatches} />
                <div style={{ marginTop: 14 }}>
                  {filteredCatches.slice(-5).reverse().map((c, i) => (
                    <div key={i} style={{
                      padding: '10px 0', borderTop: i === 0 ? 'none' : `1px solid ${C.line}`,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <div>
                        <Mono>{c.date}</Mono>
                        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.text, marginTop: 2 }}>
                          {c.fish} <span style={{ color: C.dim }}>{c.countMin === c.countMax ? c.countMin : `${c.countMin}-${c.countMax}`}本</span>
                        </div>
                      </div>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.aqua }}>{c.sizeRange || '—'}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* §B REGULATIONS */}
          <div style={{ marginTop: 28 }}>
            <div className="flex items-baseline gap-3 mb-3">
              <Mono style={{ color: rankColor }}>§ B</Mono>
              <div>
                <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 22, color: C.text }}>REGULATIONS</div>
                <div style={{ fontFamily: FONT_JP, fontSize: 11, color: C.dim }}>レギュレーション</div>
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONT_BODY, fontSize: 13, color: C.text }}>
              <tbody>
                {[
                  ['ルアー / 仕掛', boat.regs.lure],
                  ['ライン', boat.regs.pe],
                  ['注意事項', boat.regs.forbid],
                  ['レンタル', boat.regs.rental],
                  ['氷', boat.regs.ice],
                  ['ライフジャケット', boat.regs.lifejacket],
                  ['集合 / 出船', `${boat.meetTime} / ${boat.departTime}`],
                  ['住所', boat.address],
                ].map(([k, v]) => (
                  <tr key={k} style={{ borderTop: `1px solid ${C.line}` }}>
                    <td style={{
                      padding: '10px 0', color: C.dim,
                      fontFamily: FONT_MONO, fontSize: 11, letterSpacing: '0.05em',
                      verticalAlign: 'top', width: 120,
                    }}>{k}</td>
                    <td style={{ padding: '10px 0', verticalAlign: 'top' }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* §C LEARN MORE — 選択魚種に応じた学習コンテンツ */}
          <div style={{ marginTop: 28 }}>
            <div className="flex items-baseline gap-3 mb-3">
              <Mono style={{ color: rankColor }}>§ C</Mono>
              <div>
                <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 22, color: C.text }}>LEARN MORE</div>
                <div style={{ fontFamily: FONT_JP, fontSize: 11, color: C.dim }}>
                  {selectedFish.length > 0
                    ? `${selectedFish.join('・')}の釣り方・タックル・動画`
                    : '関連コンテンツ'}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {learningContent.map((l, i) => {
                const Icon = l.type === 'video' ? Play : (l.type === 'tackle' ? Compass : BookOpen);
                const iconColor = l.type === 'video' ? C.coral : (l.type === 'tackle' ? C.sand : C.aqua);
                return (
                  <a
                    key={i}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: 12,
                      background: C.bg2, border: `1px solid ${C.line}`,
                      color: C.text, textDecoration: 'none',
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, flexShrink: 0,
                      background: C.bg, border: `1px solid ${C.line}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={14} color={iconColor} fill={l.type === 'video' ? iconColor : 'none'} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>
                        {l.title}
                      </div>
                      <div style={{
                        fontFamily: FONT_MONO, fontSize: 10, color: C.dim,
                        marginTop: 2, letterSpacing: '0.05em',
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}>
                        <span>{l.src}</span>
                        {l.forFish && (
                          <span style={{
                            padding: '1px 6px', background: C.line, color: C.text,
                            fontSize: 9, letterSpacing: '0.1em',
                          }}>
                            {l.forFish}
                          </span>
                        )}
                      </div>
                    </div>
                    <ExternalLink size={14} color={C.dim} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* §D MOON & TIDE — 月齢・潮汐・日の出入り */}
          <div style={{ marginTop: 28 }}>
            <div className="flex items-baseline gap-3 mb-3">
              <Mono style={{ color: rankColor }}>§ D</Mono>
              <div>
                <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 22, color: C.text }}>MOON & TIDE</div>
                <div style={{ fontFamily: FONT_JP, fontSize: 11, color: C.dim }}>
                  {tideData ? `${date} · ${tideData.sunrise || '—'} ↗ ${tideData.sunset || '—'} ↘` : '潮汐データ未取得'}
                </div>
              </div>
            </div>

            {!tideData ? (
              <div style={{
                padding: 16, background: C.bg2, border: `1px dashed ${C.line}`,
                fontFamily: FONT_BODY, fontSize: 12, color: C.dim, textAlign: 'center',
              }}>
                潮汐データはまだ取得されていません。GitHub Actionsの実行後に反映されます。
              </div>
            ) : (
              <>
                {/* 月齢・潮回りカード */}
                <div className="grid grid-cols-3 gap-3" style={{ marginBottom: 14 }}>
                  <div style={{ padding: 12, background: C.bg2, border: `1px solid ${C.line}` }}>
                    <Mono style={{ color: C.aqua }}>MOON</Mono>
                    <div style={{
                      fontFamily: FONT_DISPLAY, fontSize: 32, fontWeight: 800,
                      color: C.text, lineHeight: 1, marginTop: 4,
                    }}>
                      {moonEmoji(tideData.moonAge)}
                    </div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.dim, marginTop: 4 }}>
                      AGE {tideData.moonAge != null ? tideData.moonAge.toFixed(1) : '—'}
                    </div>
                  </div>
                  <div style={{ padding: 12, background: C.bg2, border: `1px solid ${C.line}` }}>
                    <Mono style={{ color: C.aqua }}>潮回り</Mono>
                    <div style={{
                      fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 800,
                      color: moonTitle === '大潮' ? C.coral : C.text,
                      lineHeight: 1, marginTop: 6,
                    }}>
                      {moonTitle || '—'}
                    </div>
                  </div>
                  <div style={{ padding: 12, background: C.bg2, border: `1px solid ${C.line}` }}>
                    <Mono style={{ color: C.aqua }}>SUN</Mono>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: C.text, marginTop: 4, lineHeight: 1.3 }}>
                      ↗ {tideData.sunrise || '—'}
                    </div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: C.text, lineHeight: 1.3 }}>
                      ↘ {tideData.sunset || '—'}
                    </div>
                  </div>
                </div>

                {/* タイドグラフ */}
                <div style={{ height: 120, background: C.bg2, border: `1px solid ${C.line}`, padding: '10px 6px 4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 8px 4px' }}>
                    <Mono style={{ color: C.aqua }}>TIDE GRAPH</Mono>
                    <Mono>cm · {tideData.hourly?.length || 0}h</Mono>
                  </div>
                  <ResponsiveContainer width="100%" height="80%">
                    <AreaChart data={(tideData.hourly || []).map(h => ({
                      hour: h.hour, cm: h.cm,
                    }))} margin={{ top: 0, right: 4, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id={`tideGrad-${boat.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={C.aqua} stopOpacity={0.4} />
                          <stop offset="100%" stopColor={C.aqua} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="hour" tick={{ fill: C.dim, fontSize: 9, fontFamily: FONT_MONO }}
                        axisLine={{ stroke: C.line }} tickLine={false}
                        ticks={[0, 6, 12, 18, 23]} />
                      <YAxis hide />
                      <Tooltip cursor={{ stroke: C.coral, strokeWidth: 1 }}
                        contentStyle={{ background: C.bg, border: `1px solid ${C.line}`, fontFamily: FONT_MONO, fontSize: 11 }}
                        labelStyle={{ color: C.dim }}
                        itemStyle={{ color: C.aqua }}
                        formatter={(v) => [`${v} cm`, '潮位']}
                        labelFormatter={(h) => `${h}:00`}
                      />
                      <Area type="monotone" dataKey="cm" stroke={C.aqua} strokeWidth={1.5}
                        fill={`url(#tideGrad-${boat.id})`} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* 満干潮テーブル */}
                <div className="grid grid-cols-2 gap-3" style={{ marginTop: 12 }}>
                  <div>
                    <Mono style={{ color: C.coral }}>満潮</Mono>
                    {(tideData.highTides || []).length === 0 ? (
                      <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.dim, marginTop: 4 }}>—</div>
                    ) : (
                      tideData.highTides.map((t, i) => (
                        <div key={i} style={{ fontFamily: FONT_MONO, fontSize: 13, color: C.text, marginTop: 4 }}>
                          {t.time} <span style={{ color: C.dim }}>{t.cm}cm</span>
                        </div>
                      ))
                    )}
                  </div>
                  <div>
                    <Mono style={{ color: C.aqua }}>干潮</Mono>
                    {(tideData.lowTides || []).length === 0 ? (
                      <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.dim, marginTop: 4 }}>—</div>
                    ) : (
                      tideData.lowTides.map((t, i) => (
                        <div key={i} style={{ fontFamily: FONT_MONO, fontSize: 13, color: C.text, marginTop: 4 }}>
                          {t.time} <span style={{ color: C.dim }}>{t.cm}cm</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* §E BITE FORECAST — 時間帯別釣れやすさ */}
          <div style={{ marginTop: 28 }}>
            <div className="flex items-baseline gap-3 mb-3">
              <Mono style={{ color: rankColor }}>§ E</Mono>
              <div>
                <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 22, color: C.text }}>BITE FORECAST</div>
                <div style={{ fontFamily: FONT_JP, fontSize: 11, color: C.dim }}>
                  時間帯別の釣れやすさ（環境スコア）
                </div>
              </div>
            </div>

            {biteForecast.length === 0 ? (
              <div style={{
                padding: 16, background: C.bg2, border: `1px dashed ${C.line}`,
                fontFamily: FONT_BODY, fontSize: 12, color: C.dim, textAlign: 'center',
              }}>
                潮汐データが取得され次第、時間帯予測が表示されます。
              </div>
            ) : (
              <>
                {/* ピーク窓 */}
                {peakWindow && (
                  <div style={{
                    padding: 14, background: C.panel,
                    border: `1px solid ${C.coral}`, marginBottom: 12,
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <TrendingUp size={20} color={C.coral} />
                    <div style={{ flex: 1 }}>
                      <Mono style={{ color: C.coral }}>PEAK WINDOW</Mono>
                      <div style={{
                        fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 26,
                        color: C.text, lineHeight: 1, marginTop: 2,
                      }}>
                        {String(peakWindow.start).padStart(2, '0')}:00 — {String(peakWindow.end).padStart(2, '0')}:00
                      </div>
                      <div style={{ fontFamily: FONT_JP, fontSize: 11, color: C.dim, marginTop: 4 }}>
                        平均スコア {peakWindow.avgScore} / 環境的に有利な時間帯
                      </div>
                    </div>
                  </div>
                )}

                {/* 24時間グラフ */}
                <div style={{ height: 160, background: C.bg2, border: `1px solid ${C.line}`, padding: '10px 6px 4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 8px 4px' }}>
                    <Mono style={{ color: C.coral }}>HOURLY ACTIVITY</Mono>
                    <Mono>0–100</Mono>
                  </div>
                  <ResponsiveContainer width="100%" height="80%">
                    <AreaChart data={biteForecast} margin={{ top: 0, right: 4, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id={`biteGrad-${boat.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={C.coral} stopOpacity={0.6} />
                          <stop offset="100%" stopColor={C.coral} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="hour" tick={{ fill: C.dim, fontSize: 9, fontFamily: FONT_MONO }}
                        axisLine={{ stroke: C.line }} tickLine={false}
                        ticks={[0, 6, 12, 18, 23]} />
                      <YAxis hide domain={[0, 100]} />
                      <Tooltip cursor={{ stroke: C.coral, strokeWidth: 1 }}
                        contentStyle={{ background: C.bg, border: `1px solid ${C.line}`, fontFamily: FONT_MONO, fontSize: 11 }}
                        labelStyle={{ color: C.dim }}
                        itemStyle={{ color: C.coral }}
                        formatter={(v) => [`${v} / 100`, '活性']}
                        labelFormatter={(h) => `${h}:00`}
                      />
                      <ReferenceLine y={70} stroke={C.aqua} strokeDasharray="2 2" strokeOpacity={0.5} />
                      <Area type="monotone" dataKey="score" stroke={C.coral} strokeWidth={1.5}
                        fill={`url(#biteGrad-${boat.id})`} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* スコア要因の凡例 */}
                <div style={{
                  padding: 10, background: C.bg2, border: `1px solid ${C.line}`,
                  marginTop: 10,
                  fontFamily: FONT_MONO, fontSize: 10, color: C.dim, lineHeight: 1.6,
                }}>
                  ベース 60 + 潮の動き(0-20) + マズメ(0-15) + 潮回り({moonTitle === '大潮' ? '+10' : moonTitle === '中潮' ? '+5' : moonTitle === '小潮' ? '0' : '-5'}) - 風波({weather?.windSpeed > 8 || weather?.waveHeight > 1 ? '減点' : '0'})<br />
                  ※ あくまで環境的指標。実際の釣果は魚の活性、ポイント、腕など多くの要因に依存します。
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <a href={boat.homepage} target="_blank" rel="noopener noreferrer" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px', background: rankColor, color: C.bg,
        fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 16,
        letterSpacing: '0.05em',
        textDecoration: 'none', textTransform: 'uppercase',
      }}>
        Visit Official Site
        <ArrowUpRight size={20} strokeWidth={2.5} />
      </a>
    </article>
  );
}

function Results({ input, boats, catches, tides, onReset }) {
  const { data: weatherMap, loading } = useWeatherAll(boats, input.date);

  const ranked = useMemo(() => {
    return boats
      .map(b => {
        const score = scoreBoat(b, input, weatherMap[b.id], catches[b.id]?.catches);
        if (score === null) return null;
        return { boat: b, score, weather: weatherMap[b.id], catchData: catches[b.id] };
      })
      .filter(Boolean)
      .sort((a, b) => b.score.total - a.score.total)
      .slice(0, 3);
  }, [input, weatherMap, boats, catches]);

  const noMatch = ranked.length === 0;
  const [openId, setOpenId] = useState(null);
  useEffect(() => {
    if (ranked[0]?.boat.id && !openId) setOpenId(ranked[0].boat.id);
  }, [ranked]); // eslint-disable-line

  return (
    <section style={{ padding: '30px 20px 60px', borderTop: `4px solid ${C.coral}` }}>
      <div className="mb-8">
        <Mono style={{ color: C.coral }}>
          REPORT · COMPILED {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
        </Mono>
        <h2 style={{
          fontFamily: FONT_DISPLAY, fontWeight: 900,
          fontSize: 'clamp(54px, 16vw, 120px)',
          lineHeight: 0.85, letterSpacing: '-0.03em',
          color: C.text, marginTop: 8, textTransform: 'uppercase',
        }}>
          Three<br />
          <span style={{ color: C.coral, fontStyle: 'italic', fontFamily: FONT_SERIF, fontWeight: 500 }}>Ships</span>
          <br />For You
        </h2>
        <p style={{
          fontFamily: FONT_SERIF, fontStyle: 'italic',
          fontSize: 16, lineHeight: 1.6, color: C.text,
          marginTop: 18, maxWidth: 520,
        }}>
          天候・直近釣果・アクセス・初心者適性を総合評価。実天候はOpen-Meteoから即時取得。
        </p>

        {loading && (
          <div style={{
            marginTop: 16, padding: 14,
            background: C.bg2, border: `1px solid ${C.line}`,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <Loader2 size={16} color={C.aqua} style={{ animation: 'spin 1s linear infinite' }} />
            <Mono style={{ color: C.aqua }}>FETCHING LIVE FORECAST...</Mono>
          </div>
        )}
      </div>

      {noMatch && (
        <div style={{
          padding: 20, marginBottom: 18,
          background: C.panel, border: `1px solid ${C.coral}`,
        }}>
          <Mono style={{ color: C.coral }}>NO MATCHING SHIPS</Mono>
          <div style={{
            fontFamily: FONT_SERIF, fontStyle: 'italic',
            fontSize: 16, lineHeight: 1.5, color: C.text, marginTop: 8,
          }}>
            選択された魚種（{input.fish.join('・')}）を扱う船宿が、登録10軒の中に見つかりませんでした。
          </div>
          <div style={{
            fontFamily: FONT_BODY, fontSize: 13, color: C.dim,
            marginTop: 12, lineHeight: 1.6,
          }}>
            魚種を変えるか、複数選択してみてください。
          </div>
        </div>
      )}

      {ranked.map(({ boat, score, weather, catchData }, i) => (
        <BoatCard
          key={boat.id} boat={boat} score={score} weather={weather}
          catchData={catchData}
          tideData={getTideForBoat(boat, tides, input.date)}
          selectedFish={input.fish}
          date={input.date}
          rank={i + 1}
          expanded={openId === boat.id}
          onToggle={() => setOpenId(openId === boat.id ? null : boat.id)}
        />
      ))}

      <button onClick={onReset} style={{
        marginTop: 30, width: '100%', padding: '16px',
        background: 'transparent', color: C.text,
        border: `1px solid ${C.line}`,
        fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 14,
        letterSpacing: '0.1em', cursor: 'pointer',
      }}>
        ↻ START OVER
      </button>
    </section>
  );
}

function Footer({ lastCrawled }) {
  return (
    <footer style={{ padding: '40px 20px 60px', borderTop: `1px solid ${C.line}`, background: C.bg }}>
      <div style={{
        fontFamily: FONT_DISPLAY, fontWeight: 900,
        fontSize: 'clamp(40px, 12vw, 80px)',
        lineHeight: 0.85, letterSpacing: '-0.03em',
        color: C.text, textTransform: 'uppercase',
      }}>
        See you<br />
        <span style={{ color: C.aqua, fontFamily: FONT_SERIF, fontStyle: 'italic', fontWeight: 500 }}>on the bay.</span>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-6">
        <div>
          <Mono>DATA SOURCE</Mono>
          <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.dim, marginTop: 4, lineHeight: 1.6 }}>
            Weather: Open-Meteo<br />
            Catches: 各船宿公式（クロール）<br />
            Last crawled: {lastCrawled ? new Date(lastCrawled).toLocaleString('ja-JP') : '—'}
          </div>
        </div>
        <div>
          <Mono>EDITION</Mono>
          <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.dim, marginTop: 4, lineHeight: 1.6 }}>
            Vol.01 / Issue.05<br />Tokyo Bay Offshore<br />
            <span style={{ color: C.coral }}>w/ Daily Crawler</span>
          </div>
        </div>
      </div>
      <div style={{ height: 1, background: C.line, marginTop: 30, marginBottom: 18 }} />
      <Mono>© TOKYO BAY OFFSHORE GUIDE — PROTOTYPE v3.1</Mono>
    </footer>
  );
}

/* ===== APP ====================================================== */

export default function App() {
  const { loading, boats, catches, tides, error, lastCrawled, tideLastFetched } = useBoatData();
  const todayStr = new Date().toISOString().slice(0, 10);

  const [date, setDate] = useState(todayStr);
  const [people, setPeople] = useState(2);
  const [skill, setSkill] = useState('beginner');
  const [transport, setTransport] = useState('train');
  const [stations, setStations] = useState(['', '']);
  const [method, setMethod] = useState('bait');
  const [fish, setFish] = useState(['アジ']);
  const [submitted, setSubmitted] = useState(false);

  const input = { date, people, skill, transport, stations, method, fish };

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => {
      const el = document.getElementById('results');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };
  const handleReset = () => {
    setSubmitted(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div style={{
        background: C.bg, color: C.text, minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: FONT_BODY,
      }}>
        <Loader2 size={32} color={C.aqua} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: C.bg, color: C.text, minHeight: '100vh',
        padding: 30, fontFamily: FONT_BODY,
      }}>
        <AlertCircle size={32} color={C.coral} />
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 32, marginTop: 12 }}>Data not loaded</h1>
        <p style={{ color: C.dim, fontSize: 14, marginTop: 8 }}>
          /data/boats-master.json が見つかりません: {error}
        </p>
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, color: C.text, minHeight: '100vh', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@400;700;800;900&family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,700;1,9..144,500;1,9..144,700&family=Hanken+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Shippori+Mincho+B1:wght@400;700;800&family=Noto+Serif+JP:wght@400;700&family=Noto+Sans+JP:wght@400;500;700&display=swap');
        body { background: ${C.bg}; }
        ::selection { background: ${C.coral}; color: ${C.bg}; }
        input::placeholder { color: ${C.dim2}; }
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(1) opacity(0.6); cursor: pointer;
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ maxWidth: 720, margin: '0 auto', fontFamily: FONT_BODY }}>
        <MagazineHeader lastCrawled={lastCrawled} />
        <Hero
          boatCount={boats.length}
          onStart={() => {
            const el = document.getElementById('form-start');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        <main id="form-start" style={{ padding: '40px 20px 30px' }}>
          <div className="space-y-14">
            <DateSection value={date} onChange={setDate} />
            <PeopleSection value={people} onChange={setPeople} />
            <SkillSection value={skill} onChange={setSkill} />
            <AccessSection
              transport={transport} setTransport={setTransport}
              stations={stations} setStations={setStations}
              people={people}
            />
            <MethodSection value={method} onChange={setMethod} />
            <FishSection selected={fish} setSelected={setFish} />
          </div>

          <div style={{ marginTop: 50, position: 'relative' }}>
            <div aria-hidden style={{
              position: 'absolute', left: -8, right: 60, bottom: -8,
              height: 60, background: C.aqua, zIndex: 0,
            }} />
            <button onClick={handleSubmit} style={{
              position: 'relative', zIndex: 1, width: '100%', padding: '24px',
              background: C.coral, color: C.bg, border: 'none',
              fontFamily: FONT_DISPLAY, fontWeight: 900,
              fontSize: 'clamp(28px, 8vw, 44px)',
              letterSpacing: '-0.01em', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              textTransform: 'uppercase', lineHeight: 1,
            }}>
              <span>Find My<br />Boat</span>
              <ArrowRight size={36} strokeWidth={2.5} />
            </button>
          </div>

          <div className="mt-4">
            <Mono>POWERED BY DAILY CRAWLER · OPEN-METEO</Mono>
          </div>
        </main>

        <div id="results">
          {submitted && <Results input={input} boats={boats} catches={catches} tides={tides} onReset={handleReset} />}
        </div>

        <Footer lastCrawled={lastCrawled} />
      </div>
    </div>
  );
}
