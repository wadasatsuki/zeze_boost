import { cookies } from 'next/headers';

const COOKIE_NAME = 'admin_session';
const SESSION_TOKEN = 'authenticated';

export async function isAdminAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME);
    return sessionCookie?.value === SESSION_TOKEN;
  } catch {
    return false;
  }
}
