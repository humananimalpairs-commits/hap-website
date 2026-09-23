# NPO法人 Human Animal Pairs 公式サイト

- 構成：Astro（静的サイト）＋ Notion（お知らせ・里親募集・お問い合わせ）＋ Cloudflare Pages（無料ホスティング）
- 公開URL（予定）：https://humananimalpairs.com

## 更新のしかた（ふだんの運用）

| やりたいこと | 操作 |
|---|---|
| お知らせ・活動報告を書く | Notion「📢 お知らせ」DBに1ページ追加 → 「公開」にチェック |
| 里親募集の猫を追加・変更 | Notion「🐱 保護猫台帳」を編集 → 「公開」にチェック |
| お問い合わせを確認 | Notion「✉️ お問い合わせ」DBに自動で追加されます（Slack通知も可） |
| すぐサイトに反映したい | GitHub → Actions → Build & Deploy → 「Run workflow」 |

Notion の変更は **毎朝5時に自動で反映** されます。

団体情報・カフェ情報・SNSリンクは `src/data/site.ts` を書き換えてください。
`【要確認】` と書かれた箇所は、公開前に差し替えが必要です（黄色でハイライト表示されます）。

---

## 初回セットアップ手順

### 1. Notion の準備

> ✅ データベースは作成済みです（Notion「🐾 HAP公式サイト管理」ページ内）。
>
> | 環境変数 | データベース | ID |
> |---|---|---|
> | NOTION_NEWS_DB | 📢 お知らせ | `ec08c706381645d7a0de6901e28dcb54` |
> | NOTION_CATS_DB | 🐱 保護猫台帳（里親募集） | `f836dd74efae438b8915fa5a4b94da27` |
> | NOTION_CONTACT_DB | ✉️ お問い合わせ | `1e740049f4ee4ba08d0df4e7a1a59e4a` |
> | （サイト非連携） | 🏠 里親応募者 | `fc44126fc0ed4784b4287c4eb7b6af39` |
>
> 残りは下の手順1（インテグレーション作成）と、「HAP公式サイト管理」ページへの接続追加だけです。
> 保護猫台帳には内部管理用の項目（保護日・健康メモ・居場所など）もありますが、サイトに出るのは下表の項目だけです。

1. https://www.notion.so/my-integrations で「新しいインテグレーション」を作成（名前例：HAP Website）→ シークレットをコピー（= `NOTION_TOKEN`）
2. Notion の「🐾 HAP公式サイト管理」ページ右上「…」→「接続」から上記インテグレーションを追加（配下のデータベースすべてに権限が付きます）

以下は各データベースのうち、サイトが使う項目です（名前を変えると連携が切れるのでご注意ください）。

**お知らせ（NOTION_NEWS_DB）**

| プロパティ名 | 種類 | 備考 |
|---|---|---|
| タイトル | タイトル | |
| 公開 | チェックボックス | チェックしたものだけ表示 |
| 公開日 | 日付 | |
| カテゴリ | セレクト | お知らせ／イベント／活動報告／募集 など |
| 概要 | テキスト | 一覧に出る短い説明 |
| アイキャッチ | ファイル&メディア | 任意 |
| スラッグ | テキスト | 任意。URLに使う英字（例：open-day-2026） |

本文はページの中に普通に書けばOK（見出し・箇条書き・画像・YouTube 対応）。

**里親募集（NOTION_CATS_DB）**

| プロパティ名 | 種類 | 備考 |
|---|---|---|
| 名前 | タイトル | |
| 公開 | チェックボックス | |
| 状態 | セレクト | 募集中／お見合い中／トライアル中／譲渡決定 |
| 性別 | セレクト | 男の子／女の子 |
| 年齢 | テキスト | 例：推定1歳 |
| 毛色 | テキスト | |
| 性格 | テキスト | |
| 医療 | マルチセレクト | ワクチン済／不妊手術済／ウイルス検査済 など |
| 写真 | ファイル&メディア | 1枚目を表示 |

**お問い合わせ（NOTION_CONTACT_DB）**

| プロパティ名 | 種類 |
|---|---|
| お名前 | タイトル |
| 種類 | セレクト |
| メール | メール |
| 電話 | 電話 |
| 内容 | テキスト |
| 対応状況 | セレクト（未対応／対応中／完了） |

### 2. GitHub

1. GitHub で新しいリポジトリ（例：`hap-website`、Private 可）を作成
2. このフォルダをアップロード（または `git init && git add . && git commit -m init && git push`）

### 3. Cloudflare Pages

1. Cloudflare ダッシュボード → Workers & Pages → 作成 → Pages →「Direct Upload」でプロジェクト名 **humananimalpairs** を作成（最初は空でOK）
2. プロジェクトの「カスタムドメイン」で `humananimalpairs.com` と `www.humananimalpairs.com` を追加
3. プロジェクトの「設定 → 変数とシークレット」に以下を登録（お問い合わせフォーム用）
   - `NOTION_TOKEN`、`NOTION_CONTACT_DB`
   - `SLACK_WEBHOOK_URL`（任意）、`TURNSTILE_SECRET_KEY`（任意・スパム対策）
4. 「マイプロフィール → APIトークン」で「Cloudflare Pages：編集」権限のトークンを作成（= `CLOUDFLARE_API_TOKEN`）
5. ダッシュボード右側の「アカウントID」をコピー（= `CLOUDFLARE_ACCOUNT_ID`）

### 4. GitHub Secrets

リポジトリ → Settings → Secrets and variables → Actions → New repository secret

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `NOTION_TOKEN`
- `NOTION_NEWS_DB`
- `NOTION_CATS_DB`

（任意）Variables に `PUBLIC_TURNSTILE_SITE_KEY`

登録後、Actions →「Build & Deploy」→「Run workflow」で初回公開されます。

---

## 手元での確認（開発者向け）

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # dist/ に出力
```

`.env` に NOTION_TOKEN などを書くと、手元でも Notion のデータで確認できます。
未設定の場合は `src/data/sample.json` のサンプルで表示されます。

## フォルダ構成

```
src/data/site.ts          団体情報・リンク（ここを編集）
src/pages/                各ページ
public/images/            ロゴ・写真
public/docs/              事業報告書PDFなど（disclosure.astro に追記）
scripts/fetch-notion.mjs  ビルド前に Notion から取得
functions/api/contact.js  お問い合わせ受付（Cloudflare Pages Functions）
.github/workflows/        自動デプロイ設定
```
