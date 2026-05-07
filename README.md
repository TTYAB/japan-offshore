# Tokyo Bay Offshore Guide

東京湾オフショア船宿レコメンドサービス。  
渋谷から90分以内の主要10軒について、毎朝の釣果をクロール × ライブ天候で総合スコア化します。

---

## アーキテクチャ

```
GitHub Actions (毎朝 6:00 JST)
   ↓
crawler/crawl.mjs が10軒をクロール
   ↓
data/catches.json に書き出し → git commit & push
   ↓
Vercel が自動再デプロイ
   ↓
React app が /data/catches.json と /data/boats-master.json を読み込み
   ↓
+ Open-Meteo で天候を実取得 → スコア計算 → 表示
```

---

## ディレクトリ構成

```
.
├── data/
│   ├── boats-master.json        # 船宿マスター（手動メンテ）
│   └── catches.json             # クローラーが書き出す（自動更新）
├── crawler/
│   ├── crawl.mjs                # メインクローラー
│   ├── lib/                     # 共通ユーティリティ
│   │   ├── fetch.mjs            # iconv対応fetch
│   │   └── normalize.mjs        # 日付・魚種抽出
│   ├── parsers/                 # サイト別パーサー
│   │   ├── gyo-ne-jp.mjs        # 関東沖釣り情報
│   │   ├── chowari.mjs          # 釣割
│   │   ├── aggregator.mjs       # マリネス・釣りビジョン
│   │   ├── generic.mjs          # 自前ブログ汎用
│   │   └── rss.mjs              # jugem等RSSフィード
│   └── package.json
├── src/
│   └── App.jsx                  # Reactアプリ本体
├── public/
│   └── data/                    # ビルド時にdata/がコピーされる
├── .github/workflows/
│   └── crawl.yml                # 毎朝6時の定期実行
├── package.json                 # フロントエンド
└── vercel.json                  # Vercelデプロイ設定
```

---

## ローカルでの動かし方

### 1. クローラーを実行

```bash
cd crawler
npm install
npm run crawl              # 全船宿
npm run crawl:dry          # 書き込みなし（テスト）
node crawl.mjs --boat yonemoto  # 1軒だけテスト
```

実行後、`data/catches.json` に結果が書き込まれます。

### 2. フロントエンドを起動

```bash
cd ..  # プロジェクトルート
npm install
npm run sync-data          # data/ → public/data/ にコピー
npm run dev                # Vite開発サーバー
```

`http://localhost:5173` で確認できます。

---

## Vercelへのデプロイ

### 初回セットアップ

1. **GitHubリポジトリにpush**

2. **Vercelで新規プロジェクト作成**
   - "Import Git Repository" → リポジトリ選択
   - Framework Preset: `Vite`
   - 他はデフォルトでOK
   - Deploy押下

3. **完了**
   - `xxx.vercel.app` のURLが発行される
   - `vercel.json` の `buildCommand` が `npm run sync-data && npm run build` を実行
   - これにより `data/*.json` が `public/data/` 経由でデプロイに含まれる

### GitHub Actionsの定期実行

`.github/workflows/crawl.yml` がリポジトリにpushされていれば、自動的に有効化されます。

- **スケジュール**: 毎日 6:00 JST (UTC 21:00)
- **実行内容**: クローラー → `data/catches.json` 更新 → 自動commit & push
- **Vercel連携**: pushを検知して自動再デプロイ

#### 手動実行

GitHubリポジトリの「Actions」タブ → "Daily Crawl" → "Run workflow"

---

## 各船宿のクロール状況

| 船宿 | パーサー | 推定難易度 | データソース |
|------|---------|-----------|-------------|
| 米元釣船店 | gyo-ne-jp | 易 | gyo.ne.jp（Shift_JIS） |
| 忠彦丸 | gyo-ne-jp | 易 | gyo.ne.jp（Shift_JIS） |
| 船宿吉久 | gyo-ne-jp | 易 | gyo.ne.jp（Shift_JIS） |
| 深川吉野屋 | chowari | 易 | chowari.jp |
| 渡辺釣船店 | fishing-v | 中 | fishing-v.jp |
| さわ浦 | fishing-v | 中 | fishing-v.jp |
| つり幸 | marines-net | 中 | marines-net.co.jp |
| 岩田屋本店 | generic | 中 | 自前サイト |
| 弁天屋 | generic | 中〜難 | 自前サイト |
| アイランドクルーズ | rss | 難 | jugem.jp RSSフィード |

### パーサーの破損・更新時

1. 個別船宿だけテスト: `node crawl.mjs --boat yonemoto`
2. パーサーのデバッグ: `parsers/{parserName}.mjs` を編集
3. ヒューリスティック調整: `lib/normalize.mjs` の正規表現を調整

---

## 船宿の追加・削除

`data/boats-master.json` の `boats` 配列を編集するだけです。

```json
{
  "id": "new-boat-id",
  "name": "新しい船宿",
  "nameEn": "NEW BOAT",
  ...
  "crawl": {
    "enabled": true,
    "url": "https://...",
    "parser": "generic",
    "encoding": "utf-8"
  }
}
```

`crawl.enabled: false` にすればクロール対象から外れます（マスター情報のみ表示）。

---

## トラブルシューティング

### Vercelでデプロイ後に船宿が表示されない

- `vercel.json` の `buildCommand` が正しいか確認
- `public/data/` が存在しているか（`npm run sync-data` で生成）

### クローラーが特定の船宿で失敗する

- `crawler/parsers/{parser名}.mjs` を該当サイトのHTML構造に合わせて調整
- `node crawl.mjs --boat {boatId}` で個別デバッグ
- それでも難しければ `boats-master.json` の `crawl.enabled: false` にして手動入力に切り替え

### Shift_JISの文字化け

- `boats-master.json` の `crawl.encoding` を `"shift_jis"` に設定

---

## 既知の限界（v0.3.0）

- 釣果のサイズパースは精度がまちまち（特に「指3-5本」など特殊単位）
- 出船スケジュール、料金変動、休業日はクロール対象外（マスター手動更新）
- アクセス時間（`shibuyaMin`）は手作業の概算値
- 潮汐情報は未実装（Open-Meteo Marine の `sea_level_height_msl` で追加可能）

---

## ライセンス・注意事項

- 各船宿サイトの利用規約・robots.txtを必ず確認の上、運用してください
- クロール頻度は1日1回に抑えています（過度なリクエストを送らない）
- User-Agent には連絡先を含めることを推奨（`crawler/lib/fetch.mjs`）
- 商用利用の前に、各船宿に直接連絡することを推奨します
