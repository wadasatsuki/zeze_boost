import { DataCard } from './types';
import fs from 'fs';
import path from 'path';

export function loadDataCards(): DataCard[] {
  const csvPath = path.join(process.cwd(), 'public', 'zeze_dummy_data.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');

  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',');

  const cards: DataCard[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const card: DataCard = {
      id: values[0],
      title: values[1],
      theme: values[2],
      area: values[3],
      value: values[4],
      unit: values[5],
      as_of: values[6],
      description: values[7],
      source_url: values[8],
      discussion_key: values[9],
    };
    cards.push(card);
  }

  return cards;
}
