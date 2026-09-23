// ビルド前に Notion からお知らせ・里親募集のデータを取得し、
// src/data/notion.json に保存します。画像はサイト内にダウンロードします
// （Notion の画像URLは1時間で失効するため）。
//
// 必要な環境変数（未設定の場合はサンプルデータで表示します）:
//   NOTION_TOKEN     … Notion インテグレーションのシークレット
//   NOTION_NEWS_DB   … 「お知らせ」データベースID
//   NOTION_CATS_DB   … 「里親募集」データベースID

import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'src/data/notion.json');
const SAMPLE = path.join(ROOT, 'src/data/sample.json');
const IMG_DIR = path.join(ROOT, 'public/notion');

const { NOTION_TOKEN, NOTION_NEWS_DB, NOTION_CATS_DB } = process.env;
const API = 'https://api.notion.com/v1';

async function notion(endpoint, body) {
  const res = await fetch(`${API}${endpoint}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Notion API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function queryAll(dbId, body) {
  const results = [];
  let cursor;
  do {
    const r = await notion(`/databases/${dbId}/query`, { ...body, start_cursor: cursor });
    results.push(...r.results);
    cursor = r.has_more ? r.next_cursor : undefined;
  } while (cursor);
  return results;
}

async function childrenAll(blockId) {
  const results = [];
  let cursor;
  do {
    const q = cursor ? `?start_cursor=${cursor}` : '';
    const r = await notion(`/blocks/${blockId}/children${q}`);
    results.push(...r.results);
    cursor = r.has_more ? r.next_cursor : undefined;
  } while (cursor);
  return results;
}

// ---------- 値の取り出し ----------
const esc = (s = '') =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const plain = (rt = []) => rt.map((t) => t.plain_text).join('');
const rich = (rt = []) =>
  rt
    .map((t) => {
      let s = esc(t.plain_text).replace(/\n/g, '<br>');
      const a = t.annotations || {};
      if (a.bold) s = `<strong>${s}</strong>`;
      if (a.italic) s = `<em>${s}</em>`;
      if (a.strikethrough) s = `<s>${s}</s>`;
      if (a.code) s = `<code>${s}</code>`;
      if (t.href) s = `<a href="${esc(t.href)}" target="_blank" rel="noopener">${s}</a>`;
      return s;
    })
    .join('');

function prop(page, name) {
  const p = page.properties?.[name];
  if (!p) return undefined;
  switch (p.type) {
    case 'title': return plain(p.title);
    case 'rich_text': return plain(p.rich_text);
    case 'checkbox': return p.checkbox;
    case 'select': return p.select?.name;
    case 'multi_select': return p.multi_select.map((o) => o.name);
    case 'date': return p.date?.start;
    case 'number': return p.number;
    case 'url': return p.url;
    case 'files':
      return p.files.map((f) => (f.type === 'external' ? f.external.url : f.file.url));
    default: return undefined;
  }
}

async function saveImage(url) {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    const ext = (path.extname(u.pathname) || '.jpg').toLowerCase().slice(0, 5);
    const name = crypto.createHash('md5').update(u.origin + u.pathname).digest('hex') + ext;
    const file = path.join(IMG_DIR, name);
    try {
      await fs.access(file);
    } catch {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`image ${res.status}`);
      await fs.writeFile(file, Buffer.from(await res.arrayBuffer()));
    }
    return `/notion/${name}`;
  } catch (e) {
    console.warn('画像の取得に失敗:', url, e.message);
    return undefined;
  }
}

// ---------- 本文ブロック → HTML ----------
async function blocksToHtml(blocks) {
  let html = '';
  let list = null;
  const closeList = () => {
    if (list) html += `</${list}>`;
    list = null;
  };
  for (const b of blocks) {
    const d = b[b.type] || {};
    const listType = b.type === 'bulleted_list_item' ? 'ul' : b.type === 'numbered_list_item' ? 'ol' : null;
    if (listType !== list) {
      closeList();
      if (listType) {
        html += `<${listType}>`;
        list = listType;
      }
    }
    switch (b.type) {
      case 'paragraph': html += `<p>${rich(d.rich_text)}</p>`; break;
      case 'heading_1':
      case 'heading_2': html += `<h2>${rich(d.rich_text)}</h2>`; break;
      case 'heading_3': html += `<h3>${rich(d.rich_text)}</h3>`; break;
      case 'bulleted_list_item':
      case 'numbered_list_item': html += `<li>${rich(d.rich_text)}</li>`; break;
      case 'quote': html += `<blockquote>${rich(d.rich_text)}</blockquote>`; break;
      case 'callout': html += `<div class="callout">${rich(d.rich_text)}</div>`; break;
      case 'divider': html += '<hr>'; break;
      case 'image': {
        const src = await saveImage(d.type === 'external' ? d.external.url : d.file.url);
        if (src) html += `<figure><img src="${src}" alt="${esc(plain(d.caption))}" loading="lazy">${d.caption?.length ? `<figcaption>${rich(d.caption)}</figcaption>` : ''}</figure>`;
        break;
      }
      case 'video':
        if (d.type === 'external' && /youtu/.test(d.external.url)) {
          const id = d.external.url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/)?.[1];
          if (id) html += `<div class="video"><iframe src="https://www.youtube.com/embed/${id}" title="動画" allowfullscreen loading="lazy"></iframe></div>`;
        }
        break;
      default: break;
    }
  }
  closeList();
  return html;
}

// ---------- 各データベース ----------
async function fetchNews() {
  const pages = await queryAll(NOTION_NEWS_DB, {
    filter: { property: '公開', checkbox: { equals: true } },
    sorts: [{ property: '公開日', direction: 'descending' }],
  });
  const out = [];
  for (const p of pages) {
    const cover = prop(p, 'アイキャッチ')?.[0];
    out.push({
      slug: prop(p, 'スラッグ') || p.id.replace(/-/g, ''),
      title: prop(p, 'タイトル') || '(無題)',
      date: prop(p, '公開日') || p.created_time.slice(0, 10),
      category: prop(p, 'カテゴリ') || 'お知らせ',
      excerpt: prop(p, '概要') || '',
      image: await saveImage(cover),
      html: await blocksToHtml(await childrenAll(p.id)),
    });
  }
  return out;
}

async function fetchCats() {
  const pages = await queryAll(NOTION_CATS_DB, {
    filter: { property: '公開', checkbox: { equals: true } },
  });
  const order = { 募集中: 0, お見合い中: 1, トライアル中: 2, 譲渡決定: 3 };
  const out = [];
  for (const p of pages) {
    out.push({
      id: p.id.replace(/-/g, ''),
      name: prop(p, '名前') || '(名前未定)',
      status: prop(p, '状態') || '募集中',
      sex: prop(p, '性別') || '',
      age: prop(p, '年齢') || '',
      color: prop(p, '毛色') || '',
      personality: prop(p, '性格') || '',
      medical: prop(p, '医療') || [],
      image: await saveImage(prop(p, '写真')?.[0]),
    });
  }
  return out.sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9));
}

// ---------- 実行 ----------
async function main() {
  await fs.mkdir(IMG_DIR, { recursive: true });
  const sample = JSON.parse(await fs.readFile(SAMPLE, 'utf8'));

  if (!NOTION_TOKEN) {
    console.log('ℹ NOTION_TOKEN が未設定のため、サンプルデータで表示します');
    await fs.writeFile(OUT, JSON.stringify({ ...sample, source: 'sample' }, null, 2));
    return;
  }
  const data = { source: 'notion', generatedAt: new Date().toISOString() };
  data.news = NOTION_NEWS_DB ? await fetchNews() : sample.news;
  data.cats = NOTION_CATS_DB ? await fetchCats() : sample.cats;
  await fs.writeFile(OUT, JSON.stringify(data, null, 2));
  console.log(`✔ Notion から取得: お知らせ ${data.news.length}件 / 里親募集 ${data.cats.length}件`);
}

main().catch((e) => {
  console.error('✖ Notion 取得エラー:', e.message);
  process.exit(1);
});
