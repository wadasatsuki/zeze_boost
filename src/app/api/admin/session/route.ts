import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'admin_session';
const SESSION_TOKEN = 'authenticated';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME);

    const isAuthenticated = sessionCookie?.value === SESSION_TOKEN;

    return NextResponse.json({ authenticated: isAuthenticated });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({ authenticated: false });
  }
}
