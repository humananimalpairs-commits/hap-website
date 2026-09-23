// Cloudflare Pages Functions: お問い合わせフォームの受け口
// 受け取った内容を Notion の「お問い合わせ」データベースに保存し、
// Slack Webhook が設定されていれば通知します。
//
// Cloudflare Pages の環境変数（Settings → Variables and Secrets）:
//   NOTION_TOKEN          … Notion インテグレーションのシークレット（必須）
//   NOTION_CONTACT_DB     … 「お問い合わせ」データベースID（必須）
//   SLACK_WEBHOOK_URL     … Slack 通知用（任意）
//   TURNSTILE_SECRET_KEY  … スパム対策 Cloudflare Turnstile（任意）

const TYPES = {
  general: '一般', adoption: '譲渡', cafe: 'カフェ', volunteer: 'ボランティア',
  support: '寄付・支援', media: '取材・講演', other: 'その他',
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });

const text = (s) => [{ type: 'text', text: { content: String(s).slice(0, 2000) } }];

export async function onRequestPost({ request, env }) {
  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ error: '不正なリクエストです' }, 400);
  }
  const get = (k) => (form.get(k) || '').toString().trim();

  // スパム対策（ボット用の隠し欄に入力があれば成功扱いで破棄）
  if (get('website')) return json({ ok: true });

  const data = {
    type: TYPES[get('type')] || 'その他',
    name: get('name'), email: get('email'), tel: get('tel'), message: get('message'),
  };
  if (!data.name || !data.email || !data.message || !get('agree')) {
    return json({ error: '必須項目が入力されていません' }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return json({ error: 'メールアドレスの形式が正しくありません' }, 400);
  }

  if (env.TURNSTILE_SECRET_KEY) {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET_KEY,
        response: get('cf-turnstile-response'),
        remoteip: request.headers.get('CF-Connecting-IP') || '',
      }),
    });
    const v = await r.json();
    if (!v.success) return json({ error: '送信の確認に失敗しました' }, 400);
  }

  if (!env.NOTION_TOKEN || !env.NOTION_CONTACT_DB) {
    return json({ error: 'フォームの設定が完了していません' }, 500);
  }

  const res = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      parent: { database_id: env.NOTION_CONTACT_DB },
      properties: {
        お名前: { title: text(data.name) },
        種類: { select: { name: data.type } },
        メール: { email: data.email },
        電話: { phone_number: data.tel || null },
        内容: { rich_text: text(data.message) },
        対応状況: { select: { name: '未対応' } },
      },
    }),
  });
  if (!res.ok) {
    console.error('Notion error', res.status, await res.text());
    return json({ error: '送信に失敗しました' }, 502);
  }

  if (env.SLACK_WEBHOOK_URL) {
    await fetch(env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `:cat: HPにお問い合わせがありました【${data.type}】\n*${data.name}* 様 (${data.email})\n>${data.message.slice(0, 300).replace(/\n/g, '\n>')}`,
      }),
    }).catch(() => {});
  }

  return json({ ok: true });
}
