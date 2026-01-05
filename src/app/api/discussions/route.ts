import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET() {
  try {
    const supabase = supabaseAdmin();

    const { data: discussions, error } = await supabase
      .from('discussions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ discussions: discussions || [] });
  } catch (error) {
    console.error('Error loading discussions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
