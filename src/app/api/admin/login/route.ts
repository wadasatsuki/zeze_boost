import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'admin_session';
const SESSION_TOKEN = 'authenticated';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, password } = body;

    const adminId = process.env.ADMIN_ID;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminId || !adminPassword) {
      console.error('ADMIN_ID or ADMIN_PASSWORD not set in environment');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    if (id === adminId && password === adminPassword) {
      const cookieStore = await cookies();
      const isProduction = process.env.NODE_ENV === 'production';

      cookieStore.set(COOKIE_NAME, SESSION_TOKEN, {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProduction,
        path: '/',
        maxAge: 60 * 60 * 24, // 24 hours
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
