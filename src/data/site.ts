// =====================================================================
// 団体の基本情報（ここを書き換えるとサイト全体に反映されます）
// 【要確認】と書かれている項目は、公開前に正しい内容へ差し替えてください。
// =====================================================================

export const org = {
  name: '特定非営利活動法人 Human Animal Pairs',
  shortName: 'Human Animal Pairs',
  kana: 'ヒューマンアニマルペアーズ',
  tagline: '人と動物の絆をつくる',
  representative: '霜田 ちとせ',
  representativeTitle: '理事長', // 【要確認】役職名
  address: '〒123-0851 東京都足立区梅田7-29-18',
  tel: '03-6318-7861',
  email: 'info@humananimalpairs.com', // 【要確認】実際の受付アドレス
  established: '2018年5月9日（東京都 設立認証）',
  corporateNumber: '5011805002778',
  certification: '特例認定NPO法人（東京都）',
  fields: ['社会教育の推進', '環境の保全', '子どもの健全育成', 'NPO活動の支援'],
  url: 'https://humananimalpairs.com',
};

export const links = {
  syncable: 'https://syncable.biz/associate/HAP',
  tokyoLedger:
    'https://www.seikatubunka1.metro.tokyo.lg.jp/houjin/npo_houjin/list/ledger/0012896.html',
  // 愛玩動物看護師コミュニティ（別サイト）。URLが決まったら差し替え
  vtCommunity: '#', // 【要確認】
  instagram: '', // 【要確認】例: https://www.instagram.com/xxxx
  x: '', // 【要確認】
  facebook: '', // 【要確認】
  line: '', // 【要確認】LINE公式アカウントの友だち追加URL
};

export const cafe = {
  name: 'CAT HOME GARDEN',
  catch: '保護猫と出会える、譲渡型の保護猫カフェ',
  address: '【要確認】カフェの所在地',
  hours: '【要確認】例: 11:00〜18:00',
  closed: '【要確認】例: 水曜日',
  fee: '【要確認】例: 30分 ○○円（ワンドリンク付き）',
  reservation: '【要確認】予約方法（LINE・電話など）',
};

export const nav = [
  { href: '/about/', label: '私たちについて' },
  { href: '/activities/', label: '活動内容' },
  { href: '/cat-home-garden/', label: 'CAT HOME GARDEN' },
  { href: '/cats/', label: '里親募集' },
  { href: '/news/', label: 'お知らせ' },
  { href: '/disclosure/', label: '情報公開' },
];
