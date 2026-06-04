import { getSupabaseAdmin, getSupabaseAnon } from './supabase.js';

export type AuthUser = {
  id: string;
  email?: string;
  role?: string;
};

type RequestWithHeaders = {
  headers?: Record<string, string | string[] | undefined>;
};

type HttpError = Error & { statusCode?: number };

export function getBearerToken(req: RequestWithHeaders): string | null {
  const header = req.headers?.authorization || req.headers?.Authorization;
  if (!header || typeof header !== 'string') return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

export async function requireAuthFromToken(token: string | null): Promise<AuthUser> {
  if (!token) {
    const err = new Error('Unauthorized');
    (err as HttpError).statusCode = 401;
    throw err;
  }

  const supabaseAnon = getSupabaseAnon();
  const { data, error } = await supabaseAnon.auth.getUser(token);
  if (error || !data?.user) {
    const err = new Error(`Unauthorized${error?.message ? `: ${error.message}` : ''}`);
    (err as HttpError).statusCode = 401;
    throw err;
  }

  const user: AuthUser = { id: data.user.id, email: data.user.email || undefined };

  const supabaseAdmin = getSupabaseAdmin();
  const profileRes = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).maybeSingle();

  if (!profileRes.error && profileRes.data?.role) {
    user.role = profileRes.data.role;
  }

  return user;
}

export async function requireAuth(req: RequestWithHeaders): Promise<AuthUser> {
  return requireAuthFromToken(getBearerToken(req));
}

export function requireRole(user: AuthUser, allowedRoles: string[]) {
  if (!user.role || !allowedRoles.includes(user.role)) {
    const err = new Error('Forbidden');
    (err as HttpError).statusCode = 403;
    throw err;
  }
}
