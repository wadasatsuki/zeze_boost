import { NextResponse } from 'next/server';
import { loadDataCards } from '@/lib/data';

export async function GET() {
  const cards = loadDataCards();
  return NextResponse.json({ cards });
}
