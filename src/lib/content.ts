import data from '../data/notion.json';

export interface News {
  slug: string; title: string; date: string; category: string;
  excerpt: string; image?: string; html: string;
}
export interface Cat {
  id: string; name: string; status: string; sex: string; age: string;
  color: string; personality: string; medical: string[]; image?: string;
}

export const news = (data.news ?? []) as News[];
export const cats = (data.cats ?? []) as Cat[];
export const isSample = data.source === 'sample';

export const formatDate = (d: string) => {
  const [y, m, day] = d.slice(0, 10).split('-');
  return `${y}.${m}.${day}`;
};
