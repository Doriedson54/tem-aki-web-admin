import Busboy from 'busboy';
import type { IncomingMessage, ServerResponse } from 'http';
import { requireEnv } from '../server/env.js';
import { json, methodNotAllowed, notFound, readJson } from '../server/http.js';
import { getBearerToken, requireAuth, requireAuthFromToken, requireRole } from '../server/auth.js';
import { getSupabaseAdmin, getSupabaseAnon } from '../server/supabase.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

type ApiQuery = Record<string, string | string[] | undefined>;
type ApiRequest = IncomingMessage & { query?: ApiQuery; body?: unknown };

const STANDARD_CATEGORIES = [
  { name: 'Serviços', icon: '🛠️' },
  { name: 'Comércio', icon: '🛍️' },
  { name: 'Escolar', icon: '🎓' },
  { name: 'Instituições Públicas', icon: '🏛️' },
  { name: 'Instituições Comunitárias', icon: '🤝' },
  { name: 'Instituições Religiosas', icon: '⛪' },
];

const normalizeCategoryName = (value: unknown) => String(value || '').trim().toLowerCase();
const STANDARD_CATEGORY_NAME_SET = new Set(STANDARD_CATEGORIES.map((c) => normalizeCategoryName(c.name)));

function getPathSegments(req: ApiRequest): string[] {
  const raw = req.query?.path;
  if (!raw) {
    const url = typeof req.url === 'string' ? req.url : '';
    const pathname = url.split('?')[0] || '';
    const normalized = pathname.startsWith('/api/') ? pathname.slice('/api/'.length) : pathname === '/api' ? '' : pathname.replace(/^\//, '');
    if (!normalized) return [];
    return normalized.split('/').filter(Boolean);
  }
  if (Array.isArray(raw)) return raw.flatMap((v) => (typeof v === 'string' ? v.split('/').filter(Boolean) : []));
  if (typeof raw === 'string') return raw.split('/').filter(Boolean);
  return [];
}

function getQuery(req: ApiRequest, key: string): string | undefined {
  const v = req.query?.[key];
  if (Array.isArray(v)) return typeof v[0] === 'string' ? v[0] : undefined;
  return typeof v === 'string' ? v : undefined;
}

function normalizeBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'sim', 'y', 'on'].includes(v)) return true;
    if (['false', '0', 'no', 'nao', 'não', 'n', 'off'].includes(v)) return false;
  }
  return undefined;
}

function isMissingColumnError(error: unknown, columnName: string): boolean {
  const message = typeof (error as { message?: unknown })?.message === 'string' ? (error as { message: string }).message : '';
  if (!message) return false;
  const msg = message.toLowerCase();
  const col = columnName.toLowerCase();

  if (msg.includes(`column "${col}" does not exist`)) return true;
  if (msg.includes(`could not find the '${col}' column`)) return true;
  if (msg.includes(`could not find the "${col}" column`)) return true;
  if (msg.includes('schema cache') && msg.includes('could not find') && msg.includes(col)) return true;
  return false;
}

function findMissingColumns(error: unknown, columns: string[]): string[] {
  const unique = Array.from(new Set(columns)).filter((c) => typeof c === 'string' && c.length > 0);
  return unique.filter((c) => isMissingColumnError(error, c));
}

function missingColumnsMessage(columns: string[]): string {
  const list = columns.join(', ');
  return `Colunas ausentes no banco: ${list}. Execute o SQL de migração no Supabase SQL Editor e tente novamente.`;
}

type SupabaseErrorLike = {
  message: string;
  details?: string | null;
  hint?: string | null;
  code?: string | null;
};

function normalizeSupabaseError(error: unknown): SupabaseErrorLike | null {
  const e = error as Partial<SupabaseErrorLike> | null | undefined;
  if (!e || typeof e.message !== 'string') return null;
  return {
    message: e.message,
    details: typeof e.details === 'string' ? e.details : null,
    hint: typeof e.hint === 'string' ? e.hint : null,
    code: typeof e.code === 'string' ? e.code : null,
  };
}

function supabaseErrorResponse(error: unknown) {
  const e = normalizeSupabaseError(error);
  const code = e?.code || null;
  const message = e?.message || 'Erro no Supabase';
  const details = e?.details || null;
  const hint = e?.hint || null;

  const status =
    code === '42501' ? 403 :
      code === '42P01' ? 500 :
        code === '23503' ? 400 :
          500;

  const userMessage =
    code === '42501' ? 'Acesso negado por políticas de segurança (RLS).' :
      code === '42P01' ? 'Tabela não encontrada no banco.' :
        message;

  return { status, body: { success: false, message: userMessage, error: { code, message, details, hint } } };
}

async function parseMultipart(req: ApiRequest): Promise<{ fields: Record<string, string>; file: { filename: string; mimeType: string; buffer: Buffer } }> {
  return new Promise((resolve, reject) => {
    const bb = Busboy({ headers: req.headers, limits: { fileSize: 10 * 1024 * 1024 } });

    const fields: Record<string, string> = {};
    const fileBuffer: Buffer[] = [];
    let filename = 'image.jpg';
    let mimeType = 'image/jpeg';

    bb.on('field', (name: string, value: string) => {
      fields[name] = value;
    });

    bb.on(
      'file',
      (
        _name: string,
        file: NodeJS.ReadableStream,
        info: { filename: string; mimeType: string; encoding: string }
      ) => {
        filename = info.filename || filename;
        mimeType = info.mimeType || mimeType;
        file.on('data', (data: Buffer) => fileBuffer.push(data));
      }
    );

    bb.on('error', reject);
    bb.on('finish', () => {
      const buffer = Buffer.concat(fileBuffer);
      if (!buffer.length) return reject(new Error('Arquivo não encontrado'));
      resolve({ fields, file: { filename, mimeType, buffer } });
    });

    req.pipe(bb);
  });
}

function normalizeBusinessUpdatePayload(body: unknown): Record<string, unknown> {
  const b = (body && typeof body === 'object' ? (body as Record<string, unknown>) : {}) as Record<string, unknown>;

  const payload: Record<string, unknown> = {};
  const allowedKeys = [
    'main_product',
    'name',
    'description',
    'address',
    'delivery',
    'phone',
    'whatsapp',
    'email',
    'website',
    'instagram',
    'facebook',
    'other_social',
    'category_id',
    'subcategory_id',
    'status',
    'image_url',
    'logo_url',
    'neighborhood',
    'city',
    'state',
    'zip_code',
    'latitude',
    'longitude',
    'opening_hours',
  ] as const;

  for (const key of allowedKeys) {
    if (key in b) payload[key] = b[key];
  }

  if (!('main_product' in payload) && typeof b.mainProduct === 'string') payload.main_product = b.mainProduct;
  if (!('other_social' in payload) && typeof b.otherSocial === 'string') payload.other_social = b.otherSocial;
  if (!('opening_hours' in payload) && typeof b.openingHours === 'string') payload.opening_hours = b.openingHours;
  if ('delivery' in payload) {
    const normalized = normalizeBoolean(payload.delivery);
    if (typeof normalized !== 'undefined') payload.delivery = normalized;
  } else if (typeof b.hasDelivery !== 'undefined' || typeof b.has_delivery !== 'undefined') {
    const normalized = normalizeBoolean(b.hasDelivery ?? b.has_delivery);
    if (typeof normalized !== 'undefined') payload.delivery = normalized;
  }

  const category = b.category;
  if (!payload.category_id && typeof category === 'string') payload.category_id = category;
  if (!payload.category_id && category && typeof category === 'object') {
    const categoryId = (category as Record<string, unknown>).id;
    if (typeof categoryId === 'string') payload.category_id = categoryId;
  }

  const subcategory = b.subcategory;
  if (!payload.subcategory_id && typeof subcategory === 'string') payload.subcategory_id = subcategory;
  if (!payload.subcategory_id && subcategory && typeof subcategory === 'object') {
    const subcategoryId = (subcategory as Record<string, unknown>).id;
    if (typeof subcategoryId === 'string') payload.subcategory_id = subcategoryId;
  }

  return payload;
}

export default async function handler(req: ApiRequest, res: ServerResponse) {
  const segments = getPathSegments(req);
  const [resource, a, b] = segments;

  try {
    if (segments.length === 1 && resource === 'health') {
      if (req.method !== 'GET') return methodNotAllowed(res);
      return json(res, 200, { success: true, status: 'ok', timestamp: new Date().toISOString() });
    }

    if (resource === 'auth') {
      if (a === 'login' && req.method !== 'POST') return methodNotAllowed(res);
      if (a === 'logout' && req.method !== 'POST') return methodNotAllowed(res);
      if (a === 'verify' && req.method !== 'POST') return methodNotAllowed(res);
      if (a === 'refresh' && req.method !== 'POST') return methodNotAllowed(res);
      if (a === 'register' && req.method !== 'POST') return methodNotAllowed(res);
      if (a === 'bootstrap-admin' && req.method !== 'POST') return methodNotAllowed(res);
      if (a === 'profile' && req.method !== 'PUT') return methodNotAllowed(res);

      if (a === 'login' && req.method === 'POST') {
        const body = await readJson(req);
        const email = body?.email;
        const password = body?.password;
        if (!email || !password) return json(res, 400, { success: false, message: 'Email e senha são obrigatórios' });

        const supabaseAnon = getSupabaseAnon();
        const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });
        if (error || !data.session || !data.user) return json(res, 401, { success: false, message: 'Credenciais inválidas' });

        const supabaseAdmin = getSupabaseAdmin();
        const profileRes = await supabaseAdmin.from('profiles').select('role, username').eq('id', data.user.id).maybeSingle();

        const user = {
          id: data.user.id,
          email: data.user.email,
          username: profileRes.data?.username || data.user.email?.split('@')[0] || 'user',
          role: profileRes.data?.role || 'user',
        };

        return json(res, 200, {
          success: true,
          token: data.session.access_token,
          data: { token: data.session.access_token, refreshToken: data.session.refresh_token, user },
        });
      }

      if (a === 'logout' && req.method === 'POST') {
        return json(res, 200, { success: true });
      }

      if (a === 'verify' && req.method === 'POST') {
        const body = await readJson(req);
        const token = body?.token;
        if (!token || typeof token !== 'string') return json(res, 400, { success: false, message: 'token é obrigatório' });

        const supabaseAnon = getSupabaseAnon();
        const { data, error } = await supabaseAnon.auth.getUser(token);
        if (error || !data?.user) return json(res, 401, { success: false, message: 'Token inválido' });
        return json(res, 200, { success: true });
      }

      if (a === 'refresh' && req.method === 'POST') {
        const body = await readJson(req);
        const refreshToken = body?.refreshToken;
        if (!refreshToken || typeof refreshToken !== 'string') return json(res, 400, { success: false, message: 'refreshToken é obrigatório' });

        const supabaseUrl = requireEnv('SUPABASE_URL');
        const anonKey = requireEnv('SUPABASE_ANON_KEY');

        const resp = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
          method: 'POST',
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!resp.ok) return json(res, 401, { success: false, message: 'Refresh token inválido' });
        const payload = (await resp.json()) as {
          access_token?: string;
          refresh_token?: string;
          user?: { id?: string; email?: string };
        };

        const accessToken = payload?.access_token;
        const newRefreshToken = payload?.refresh_token;
        const userId = payload?.user?.id;
        if (!accessToken || !userId) return json(res, 500, { success: false, message: 'Resposta inválida do Supabase' });

        const supabaseAdmin = getSupabaseAdmin();
        const profileRes = await supabaseAdmin.from('profiles').select('role, username').eq('id', userId).maybeSingle();

        const user = {
          id: userId,
          email: payload?.user?.email,
          username: profileRes.data?.username || payload?.user?.email?.split('@')[0] || 'user',
          role: profileRes.data?.role || 'user',
        };

        return json(res, 200, {
          success: true,
          token: accessToken,
          data: { token: accessToken, refreshToken: newRefreshToken || refreshToken, user },
        });
      }

      if (a === 'profile' && req.method === 'PUT') {
        const user = await requireAuth(req);
        const body = await readJson(req);
        const allowed: { username?: string; role?: string } = {};
        if (typeof body.username === 'string') allowed.username = body.username;
        if (typeof body.role === 'string') {
          requireRole(user, ['admin']);
          allowed.role = body.role;
        }

        const supabaseAdmin = getSupabaseAdmin();
        const { data, error } = await supabaseAdmin
          .from('profiles')
          .upsert([{ id: user.id, ...allowed }], { onConflict: 'id' })
          .select('id, username, role')
          .single();

        if (error) return json(res, 500, { success: false, message: error.message });
        return json(res, 200, { success: true, data });
      }

      if (a === 'register' && req.method === 'POST') {
        const requester = await requireAuth(req);
        requireRole(requester, ['admin']);

        const body = await readJson(req);
        const email = body?.email;
        const password = body?.password;
        const username = body?.username;
        const role = body?.role;
        if (!email || !password) return json(res, 400, { success: false, message: 'email e password são obrigatórios' });

        const supabaseAdmin = getSupabaseAdmin();
        const createRes = await supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true });
        if (createRes.error || !createRes.data?.user) {
          return json(res, 500, { success: false, message: createRes.error?.message || 'Falha ao criar usuário' });
        }

        const userId = createRes.data.user.id;
        const profileRes = await supabaseAdmin
          .from('profiles')
          .upsert(
            [
              {
                id: userId,
                username: typeof username === 'string' ? username : String(email).split('@')[0],
                role: typeof role === 'string' ? role : 'user',
              },
            ],
            { onConflict: 'id' }
          )
          .select('id, username, role')
          .single();

        if (profileRes.error) return json(res, 500, { success: false, message: profileRes.error.message });
        return json(res, 201, { success: true, data: { user: profileRes.data } });
      }

      if (a === 'bootstrap-admin' && req.method === 'POST') {
        const expected = process.env.BOOTSTRAP_ADMIN_TOKEN;
        if (!expected) return json(res, 500, { success: false, message: 'BOOTSTRAP_ADMIN_TOKEN não configurado' });

        const body = await readJson(req);
        const provided =
          (typeof body?.token === 'string' ? body.token : null) ||
          (typeof req.headers?.['x-bootstrap-token'] === 'string' ? req.headers['x-bootstrap-token'] : null) ||
          (typeof req.headers?.['X-Bootstrap-Token'] === 'string' ? req.headers['X-Bootstrap-Token'] : null);

        if (!provided || provided !== expected) return json(res, 401, { success: false, message: 'Unauthorized' });

        const email = body?.email;
        const password = body?.password;
        const username = body?.username;
        if (!email || !password) return json(res, 400, { success: false, message: 'email e password são obrigatórios' });

        const supabaseAdmin = getSupabaseAdmin();
        const adminsCountRes = await supabaseAdmin
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'admin');

        if (adminsCountRes.error) return json(res, 500, { success: false, message: adminsCountRes.error.message });
        if ((adminsCountRes.count || 0) > 0) return json(res, 409, { success: false, message: 'Admin já configurado' });

        const createRes = await supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true });
        if (createRes.error || !createRes.data?.user) {
          return json(res, 500, { success: false, message: createRes.error?.message || 'Falha ao criar usuário' });
        }

        const userId = createRes.data.user.id;
        const profileRes = await supabaseAdmin
          .from('profiles')
          .upsert(
            [
              {
                id: userId,
                username: typeof username === 'string' ? username : String(email).split('@')[0],
                role: 'admin',
              },
            ],
            { onConflict: 'id' }
          )
          .select('id, username, role')
          .single();

        if (profileRes.error) return json(res, 500, { success: false, message: profileRes.error.message });
        return json(res, 201, { success: true, data: { user: profileRes.data } });
      }
    }

    if (resource === 'categories') {
      const supabase = getSupabaseAdmin();

      if (!a && req.method === 'GET') {
        const onlyStandard = getQuery(req, 'standard') || getQuery(req, 'onlyStandard');
        const includeAll = getQuery(req, 'all');
        const { data, error } = await supabase.from('categories').select('*').order('name', { ascending: true });
        if (error) return json(res, 500, { success: false, message: error.message });
        const list = data || [];
        if (!onlyStandard || includeAll) return json(res, 200, { success: true, data: list });

        const byName = new Map<string, any>();
        for (const c of list) {
          const key = normalizeCategoryName((c as any)?.name);
          if (!STANDARD_CATEGORY_NAME_SET.has(key)) continue;
          if (!byName.has(key)) byName.set(key, c);
        }

        const standardized = STANDARD_CATEGORIES
          .map((c) => byName.get(normalizeCategoryName(c.name)))
          .filter(Boolean);

        return json(res, 200, { success: true, data: standardized });
      }

      if (a === 'standardize' && req.method === 'POST') {
        const user = await requireAuth(req);
        requireRole(user, ['admin']);

        const body = await readJson(req);
        const action = body?.action;

        const { data, error } = await supabase.from('categories').select('*').order('name', { ascending: true });
        if (error) return json(res, 500, { success: false, message: error.message });
        const list = data || [];

        const byName = new Map<string, any>();
        for (const c of list) {
          const key = normalizeCategoryName((c as any)?.name);
          if (!byName.has(key)) byName.set(key, c);
        }

        if (action === 'create-missing') {
          const missing = STANDARD_CATEGORIES.filter((c) => !byName.has(normalizeCategoryName(c.name)));
          if (!missing.length) return json(res, 200, { success: true, data: { created: 0 } });

          const insertRes = await supabase.from('categories').insert(missing).select('*');
          if (insertRes.error) return json(res, 500, { success: false, message: insertRes.error.message });
          return json(res, 200, { success: true, data: { created: missing.length, inserted: insertRes.data || [] } });
        }

        if (action === 'delete-nonstandard') {
          const nonStandardIds = (list || [])
            .filter((c: any) => !STANDARD_CATEGORY_NAME_SET.has(normalizeCategoryName(c?.name)))
            .map((c: any) => c.id)
            .filter((id: any) => typeof id === 'string' && id.length > 0);

          if (!nonStandardIds.length) return json(res, 200, { success: true, data: { deleted: 0 } });

          const subsDel = await supabase.from('subcategories').delete().in('category_id', nonStandardIds);
          if (subsDel.error) return json(res, 500, { success: false, message: subsDel.error.message });

          const catDel = await supabase.from('categories').delete().in('id', nonStandardIds);
          if (catDel.error) return json(res, 500, { success: false, message: catDel.error.message });

          return json(res, 200, { success: true, data: { deleted: nonStandardIds.length } });
        }

        return json(res, 400, { success: false, message: 'action inválida' });
      }

      if (!a && req.method === 'POST') {
        const user = await requireAuth(req);
        requireRole(user, ['admin']);
        const body = await readJson(req);
        const name = body?.name;
        const icon = body?.icon;
        if (!name) return json(res, 400, { success: false, message: 'name é obrigatório' });

        const { data, error } = await supabase.from('categories').insert([{ name, icon: icon || null }]).select('*').single();
        if (error) return json(res, 500, { success: false, message: error.message });
        return json(res, 201, { success: true, data });
      }

      if (a && req.method === 'PUT') {
        const user = await requireAuth(req);
        requireRole(user, ['admin']);
        const body = await readJson(req);
        const updatePayload: Record<string, unknown> = { ...(body as Record<string, unknown>) };
        delete updatePayload.id;
        const { data, error } = await supabase.from('categories').update(updatePayload).eq('id', a).select('*').single();
        if (error) return json(res, 500, { success: false, message: error.message });
        return json(res, 200, { success: true, data });
      }

      if (a && req.method === 'DELETE') {
        const user = await requireAuth(req);
        requireRole(user, ['admin']);
        const { error } = await supabase.from('categories').delete().eq('id', a);
        if (error) return json(res, 500, { success: false, message: error.message });
        return json(res, 200, { success: true });
      }

      return methodNotAllowed(res);
    }

    if (resource === 'subcategories') {
      const supabase = getSupabaseAdmin();

      if (!a && req.method === 'GET') {
        const category = getQuery(req, 'category');
        let q = supabase.from('subcategories').select('*, category:categories(id,name)').order('name', { ascending: true });
        if (category) q = q.eq('category_id', category);
        const { data, error } = await q;
        if (error) return json(res, 500, { success: false, message: error.message });
        return json(res, 200, { success: true, data: data || [] });
      }

      if (a && req.method === 'GET') {
        const { data, error } = await supabase
          .from('subcategories')
          .select('*, category:categories(id,name)')
          .eq('category_id', a)
          .order('name', { ascending: true });
        if (error) return json(res, 500, { success: false, message: error.message });
        return json(res, 200, { success: true, data: data || [] });
      }

      if (!a && req.method === 'POST') {
        const user = await requireAuth(req);
        requireRole(user, ['admin']);
        const body = await readJson(req);
        const name = body?.name;
        const categoryId = body?.category_id;
        if (!name || typeof name !== 'string') return json(res, 400, { success: false, message: 'name é obrigatório' });
        if (!categoryId || typeof categoryId !== 'string') return json(res, 400, { success: false, message: 'category_id é obrigatório' });

        const { data, error } = await supabase
          .from('subcategories')
          .insert([{ name, category_id: categoryId }])
          .select('*, category:categories(id,name)')
          .single();

        if (error) return json(res, 500, { success: false, message: error.message });
        return json(res, 201, { success: true, data });
      }

      if (a && req.method === 'PUT') {
        const user = await requireAuth(req);
        requireRole(user, ['admin']);
        const body = await readJson(req);
        const updatePayload: Record<string, unknown> = { ...(body as Record<string, unknown>) };
        delete updatePayload.id;

        const { data, error } = await supabase
          .from('subcategories')
          .update(updatePayload)
          .eq('id', a)
          .select('*, category:categories(id,name)')
          .single();

        if (error) return json(res, 500, { success: false, message: error.message });
        return json(res, 200, { success: true, data });
      }

      if (a && req.method === 'DELETE') {
        const user = await requireAuth(req);
        requireRole(user, ['admin']);
        const { error } = await supabase.from('subcategories').delete().eq('id', a);
        if (error) return json(res, 500, { success: false, message: error.message });
        return json(res, 200, { success: true });
      }

      return methodNotAllowed(res);
    }

    if (resource === 'businesses') {
      const supabase = getSupabaseAdmin();
      const requester = await (async () => {
        const token = getBearerToken(req);
        if (!token) return null;
        try {
          return await requireAuthFromToken(token);
        } catch {
          return null;
        }
      })();
      const isAdmin = requester?.role === 'admin';

      if (!a && req.method === 'GET') {
        const search = getQuery(req, 'search');
        const category = getQuery(req, 'category');
        const neighborhood = getQuery(req, 'neighborhood');
        const limitRaw = getQuery(req, 'limit');
        const limit = limitRaw ? Number.parseInt(limitRaw, 10) : null;

        const buildQuery = (includeMainProduct: boolean) => {
          let q = supabase
            .from('businesses')
            .select('*, category:categories(id,name), subcategory:subcategories(id,name)')
            .order('created_at', { ascending: false });
          if (!isAdmin) q = q.eq('status', 'active');
          if (category) q = q.eq('category_id', category);
          if (getQuery(req, 'subcategory')) q = q.eq('subcategory_id', getQuery(req, 'subcategory'));
          if (neighborhood) q = q.ilike('neighborhood', `%${neighborhood}%`);
          if (search) {
            const pattern = `%${search}%`;
            q = q.or(
              [
                `name.ilike.${pattern}`,
                ...(includeMainProduct ? [`main_product.ilike.${pattern}`] : []),
                `description.ilike.${pattern}`,
                `neighborhood.ilike.${pattern}`,
                `address.ilike.${pattern}`,
              ].join(',')
            );
          }
          if (Number.isFinite(limit) && (limit as number) > 0) q = q.limit(limit as number);
          return q;
        };

        let { data, error } = await buildQuery(true);
        if (error && search && isMissingColumnError(error, 'main_product')) {
          ({ data, error } = await buildQuery(false));
        }

        if (error) return json(res, 500, { success: false, message: error.message });
        return json(res, 200, { success: true, data: data || [] });
      }

      if (!a && req.method === 'POST') {
        const user = await requireAuth(req);
        requireRole(user, ['admin']);
        const body = await readJson(req);
        if (!body?.name) return json(res, 400, { success: false, message: 'name é obrigatório' });

        const delivery = normalizeBoolean(body.delivery ?? body.hasDelivery ?? body.has_delivery) ?? false;
        const openingHoursInput = body.opening_hours ?? body.openingHours ?? null;
        const openingHoursText = typeof openingHoursInput === 'string' ? openingHoursInput.trim() : null;
        const openingHoursJson =
          openingHoursText ? { description: openingHoursText } : openingHoursInput && typeof openingHoursInput === 'object' ? openingHoursInput : null;

        const insertPayloadBase = {
          name: body.name,
          main_product: typeof body.main_product === 'string' ? body.main_product : typeof body.mainProduct === 'string' ? body.mainProduct : null,
          description: body.description || '',
          address: body.address || '',
          delivery,
          phone: body.phone || '',
          whatsapp: body.whatsapp || null,
          email: body.email || '',
          website: body.website || null,
          instagram: body.instagram || null,
          facebook: body.facebook || null,
          other_social: body.other_social || body.otherSocial || null,
          category_id: body.category_id || null,
          subcategory_id: body.subcategory_id || null,
          status: body.status || 'pending',
          image_url: body.image_url || null,
          logo_url: body.logo_url || null,
          neighborhood: body.neighborhood || null,
          city: body.city || null,
          state: body.state || null,
          zip_code: body.zip_code || null,
          latitude: body.latitude || null,
          longitude: body.longitude || null,
        };

        const attemptInsert = async (payload: Record<string, unknown>) =>
          supabase.from('businesses').insert([payload]).select('*, category:categories(id,name), subcategory:subcategories(id,name)').single();

        const insertPayloadJson = { ...(insertPayloadBase as Record<string, unknown>), opening_hours: openingHoursJson };
        const insertPayloadText = { ...(insertPayloadBase as Record<string, unknown>), opening_hours: openingHoursText || null };

        let { data, error } = await attemptInsert(insertPayloadJson);

        if (error) {
          const missingColumns = findMissingColumns(error, Object.keys(insertPayloadJson));
          if (missingColumns.length > 0) {
            console.error('[businesses] missing columns', { missingColumns, error: normalizeSupabaseError(error) });
            return json(res, 500, { success: false, message: missingColumnsMessage(missingColumns), error: { missingColumns } });
          }

          if (typeof openingHoursText === 'string' && insertPayloadText.opening_hours !== insertPayloadJson.opening_hours) {
            ({ data, error } = await attemptInsert(insertPayloadText));

            if (error) {
              const missingColumnsRetry = findMissingColumns(error, Object.keys(insertPayloadText));
              if (missingColumnsRetry.length > 0) {
                console.error('[businesses] missing columns', { missingColumns: missingColumnsRetry, error: normalizeSupabaseError(error) });
                return json(res, 500, { success: false, message: missingColumnsMessage(missingColumnsRetry), error: { missingColumns: missingColumnsRetry } });
              }
            }
          }
        }

        if (error) return json(res, 500, { success: false, message: error.message });
        return json(res, 201, { success: true, data });
      }

      if (a === 'category' && b && req.method === 'GET') {
        let q = supabase
          .from('businesses')
          .select('*, category:categories(id,name)')
          .eq('category_id', b)
          .order('created_at', { ascending: false });
        if (!isAdmin) q = q.eq('status', 'active');
        const { data, error } = await q;

        if (error) return json(res, 500, { success: false, message: error.message });
        return json(res, 200, { success: true, data: data || [] });
      }

      if (a === 'subcategory' && b && req.method === 'GET') {
        let q = supabase
          .from('businesses')
          .select('*, category:categories(id,name)')
          .eq('subcategory_id', b)
          .order('created_at', { ascending: false });
        if (!isAdmin) q = q.eq('status', 'active');
        const { data, error } = await q;

        if (error) return json(res, 500, { success: false, message: error.message });
        return json(res, 200, { success: true, data: data || [] });
      }

      if (a === 'search' && req.method === 'GET') {
        const query = (getQuery(req, 'q') || '').trim();
        if (!query) return json(res, 200, { success: true, data: [] });

        const pattern = `%${query}%`;
        const attempt = async (includeMainProduct: boolean) =>
          ((): any => {
            let q = supabase
              .from('businesses')
              .select('*, category:categories(id,name)')
              .or(
                [
                  `name.ilike.${pattern}`,
                  ...(includeMainProduct ? [`main_product.ilike.${pattern}`] : []),
                  `description.ilike.${pattern}`,
                  `neighborhood.ilike.${pattern}`,
                  `address.ilike.${pattern}`,
                ].join(',')
              );
            if (!isAdmin) q = q.eq('status', 'active');
            return q;
          })();

        let { data, error } = await attempt(true);
        if (error && isMissingColumnError(error, 'main_product')) {
          ({ data, error } = await attempt(false));
        }

        if (error) return json(res, 500, { success: false, message: error.message });
        return json(res, 200, { success: true, data: data || [] });
      }

      if (a && req.method === 'GET') {
        const { data, error } = await supabase
          .from('businesses')
          .select('*, category:categories(id,name), subcategory:subcategories(id,name)')
          .eq('id', a)
          .limit(1);

        if (error) return json(res, 500, { success: false, message: error.message });
        const business = data?.[0];
        if (!business) return json(res, 404, { success: false, message: 'Não encontrado' });
        if (!isAdmin && (business as { status?: unknown }).status !== 'active') return json(res, 404, { success: false, message: 'Não encontrado' });
        return json(res, 200, { success: true, data: business });
      }

      if (a && req.method === 'PUT') {
        const user = await requireAuth(req);
        requireRole(user, ['admin']);
        const body = await readJson(req);
        const updatePayload = normalizeBusinessUpdatePayload(body);

        const attemptUpdate = async (payload: Record<string, unknown>) =>
          supabase.from('businesses').update(payload).eq('id', a).select('*, category:categories(id,name), subcategory:subcategories(id,name)').single();

        const openingHoursInput = (body as Record<string, unknown>)?.opening_hours ?? (body as Record<string, unknown>)?.openingHours ?? null;
        const openingHoursText = typeof openingHoursInput === 'string' ? openingHoursInput.trim() : null;
        const updatePayloadJson = { ...(updatePayload as Record<string, unknown>) };
        const updatePayloadText = { ...(updatePayload as Record<string, unknown>) };

        if (typeof openingHoursText === 'string') {
          updatePayloadJson.opening_hours = openingHoursText ? { description: openingHoursText } : null;
          updatePayloadText.opening_hours = openingHoursText || null;
        }

        let { data, error } = await attemptUpdate(updatePayloadJson);

        if (error) {
          const missingColumns = findMissingColumns(error, Object.keys(updatePayloadJson));
          if (missingColumns.length > 0) {
            console.error('[businesses] missing columns', { missingColumns, error: normalizeSupabaseError(error) });
            return json(res, 500, { success: false, message: missingColumnsMessage(missingColumns), error: { missingColumns } });
          }

          if (typeof openingHoursText === 'string' && updatePayloadText.opening_hours !== updatePayloadJson.opening_hours) {
            ({ data, error } = await attemptUpdate(updatePayloadText));

            if (error) {
              const missingColumnsRetry = findMissingColumns(error, Object.keys(updatePayloadText));
              if (missingColumnsRetry.length > 0) {
                console.error('[businesses] missing columns', { missingColumns: missingColumnsRetry, error: normalizeSupabaseError(error) });
                return json(res, 500, { success: false, message: missingColumnsMessage(missingColumnsRetry), error: { missingColumns: missingColumnsRetry } });
              }
            }
          }
        }

        if (error) return json(res, 500, { success: false, message: error.message });
        return json(res, 200, { success: true, data });
      }

      if (a && req.method === 'DELETE') {
        const user = await requireAuth(req);
        requireRole(user, ['admin']);
        const { error } = await supabase.from('businesses').delete().eq('id', a);
        if (error) return json(res, 500, { success: false, message: error.message });
        return json(res, 200, { success: true });
      }

      return methodNotAllowed(res);
    }

    if (resource === 'dashboard') {
      const supabase = getSupabaseAdmin();

      if (a === 'recent' && req.method === 'GET') {
        const user = await requireAuth(req);
        requireRole(user, ['admin']);

        const limitBusinessesRaw = getQuery(req, 'limitBusinesses');
        const limitActivitiesRaw = getQuery(req, 'limitActivities');
        const limitBusinesses = limitBusinessesRaw ? Number.parseInt(limitBusinessesRaw, 10) : 8;
        const limitActivities = limitActivitiesRaw ? Number.parseInt(limitActivitiesRaw, 10) : 12;

        const safeLimitBusinesses = Number.isFinite(limitBusinesses) && limitBusinesses > 0 ? Math.min(limitBusinesses, 50) : 8;
        const safeLimitActivities = Number.isFinite(limitActivities) && limitActivities > 0 ? Math.min(limitActivities, 100) : 12;

        const [
          recentBusinessesRes,
          businessesActivityRes,
          categoriesRes,
          categoriesAllRes,
          subcategoriesRes,
          leadsRes,
          favoritesRes,
          businessesCountRes,
          reviewsCountRes,
          leadsCountRes,
        ] = await Promise.all([
          supabase
            .from('businesses')
            .select('id, name, status, neighborhood, city, created_at, updated_at')
            .order('created_at', { ascending: false })
            .limit(safeLimitBusinesses),
          supabase
            .from('businesses')
            .select('id, name, status, created_at, updated_at')
            .order('updated_at', { ascending: false })
            .limit(50),
          supabase
            .from('categories')
            .select('id, name, created_at')
            .order('created_at', { ascending: false })
            .limit(30),
          supabase.from('categories').select('id, name'),
          supabase
            .from('subcategories')
            .select('id, name, category_id, created_at')
            .order('created_at', { ascending: false })
            .limit(30),
          supabase
            .from('leads')
            .select('id, name, whatsapp, created_at')
            .order('created_at', { ascending: false })
            .limit(30),
          supabase
            .from('favorites')
            .select('id, business_id, user_id, created_at, business:businesses(id,name)')
            .order('created_at', { ascending: false })
            .limit(30),
          supabase.from('businesses').select('id', { count: 'exact', head: true }),
          supabase.from('reviews').select('id', { count: 'exact', head: true }),
          supabase.from('leads').select('id', { count: 'exact', head: true }),
        ]);

        const recentBusinesses = recentBusinessesRes.data || [];
        const recentLeads = leadsRes.data || [];

        type Activity = {
          id: string;
          type: 'business' | 'category' | 'subcategory' | 'lead' | 'favorite';
          action: string;
          title: string;
          created_at: string;
          entity_id?: string;
        };

        const activities: Activity[] = [];

        for (const bItem of businessesActivityRes.data || []) {
          const createdAt = typeof bItem.created_at === 'string' ? bItem.created_at : new Date().toISOString();
          const updatedAt = typeof bItem.updated_at === 'string' ? bItem.updated_at : createdAt;
          const isNew = Math.abs(new Date(updatedAt).getTime() - new Date(createdAt).getTime()) < 5000;
          activities.push({
            id: `business:${bItem.id}:${updatedAt}`,
            type: 'business',
            action: isNew ? 'Novo negócio' : 'Negócio atualizado',
            title: bItem.name ? String(bItem.name) : 'Negócio',
            created_at: updatedAt,
            entity_id: bItem.id,
          });
        }

        for (const cItem of categoriesRes.data || []) {
          const createdAt = typeof cItem.created_at === 'string' ? cItem.created_at : new Date().toISOString();
          activities.push({
            id: `category:${cItem.id}:${createdAt}`,
            type: 'category',
            action: 'Nova categoria',
            title: cItem.name ? String(cItem.name) : 'Categoria',
            created_at: createdAt,
            entity_id: cItem.id,
          });
        }

        for (const sItem of subcategoriesRes.data || []) {
          const createdAt = typeof sItem.created_at === 'string' ? sItem.created_at : new Date().toISOString();
          activities.push({
            id: `subcategory:${sItem.id}:${createdAt}`,
            type: 'subcategory',
            action: 'Nova subcategoria',
            title: sItem.name ? String(sItem.name) : 'Subcategoria',
            created_at: createdAt,
            entity_id: sItem.id,
          });
        }

        for (const lItem of leadsRes.data || []) {
          const createdAt = typeof lItem.created_at === 'string' ? lItem.created_at : new Date().toISOString();
          activities.push({
            id: `lead:${lItem.id}:${createdAt}`,
            type: 'lead',
            action: 'Novo lead',
            title: lItem.name ? String(lItem.name) : 'Lead',
            created_at: createdAt,
            entity_id: lItem.id,
          });
        }

        for (const fItem of favoritesRes.data || []) {
          const createdAt = typeof fItem.created_at === 'string' ? fItem.created_at : new Date().toISOString();
          const businessName = (fItem as { business?: { name?: string } }).business?.name;
          activities.push({
            id: `favorite:${fItem.id}:${createdAt}`,
            type: 'favorite',
            action: 'Favorito adicionado',
            title: businessName ? String(businessName) : 'Negócio',
            created_at: createdAt,
            entity_id: fItem.business_id,
          });
        }

        activities.sort((x, y) => new Date(y.created_at).getTime() - new Date(x.created_at).getTime());
        const standardCategoriesFound = new Set<string>();
        for (const cItem of categoriesAllRes.data || []) {
          const key = normalizeCategoryName((cItem as any)?.name);
          if (STANDARD_CATEGORY_NAME_SET.has(key)) standardCategoriesFound.add(key);
        }

        return json(res, 200, {
          success: true,
          data: {
            totals: {
              businesses: businessesCountRes.count || 0,
              categories: standardCategoriesFound.size,
              reviews: reviewsCountRes.count || 0,
              leads: leadsCountRes.count || 0,
            },
            recentBusinesses,
            recentLeads,
            activities: activities.slice(0, safeLimitActivities),
          },
        });
      }

      return methodNotAllowed(res);
    }

    if (resource === 'favorites') {
      const supabase = getSupabaseAdmin();
      const user = await requireAuth(req);
      const attemptUserIdField = async (fn: (userIdField: 'user_id' | 'profile_id') => Promise<{ data: any; error: any }>) => {
        let { data, error } = await fn('user_id');
        if (error && isMissingColumnError(error, 'user_id')) {
          ({ data, error } = await fn('profile_id'));
        }
        return { data, error, userIdField: error && isMissingColumnError(error, 'user_id') ? 'profile_id' : 'user_id' as 'user_id' | 'profile_id' };
      };

      if (!a && req.method === 'GET') {
        const { data, error } = await attemptUserIdField((userIdField) =>
          supabase
            .from('favorites')
            .select(`id, business_id, ${userIdField}, created_at, business:businesses(*, category:categories(id,name))`)
            .eq(userIdField, user.id)
            .order('created_at', { ascending: false })
        );

        if (error) {
          console.error('[favorites] GET failed', { userId: user.id, error: normalizeSupabaseError(error) });
          const resp = supabaseErrorResponse(error);
          return json(res, resp.status, resp.body);
        }
        return json(res, 200, { success: true, data: data || [] });
      }

      if (!a && req.method === 'POST') {
        const body = await readJson(req);
        const businessId = body?.business_id;
        if (!businessId || typeof businessId !== 'string') return json(res, 400, { success: false, message: 'business_id é obrigatório' });

        const attemptInsert = async (userIdField: 'user_id' | 'profile_id') =>
          supabase.from('favorites').insert([{ [userIdField]: user.id, business_id: businessId }]);

        let { error } = await attemptInsert('user_id');
        if (error && isMissingColumnError(error, 'user_id')) {
          ({ error } = await attemptInsert('profile_id'));
        }

        if (error) {
          const code = (error as { code?: string } | null)?.code;
          const msg = error.message || '';
          if (code === '23505' || msg.toLowerCase().includes('duplicate')) {
            return json(res, 200, { success: true, message: 'Favorito já existe' });
          }
          console.error('[favorites] POST failed', { userId: user.id, businessId, error: normalizeSupabaseError(error) });
          const resp = supabaseErrorResponse(error);
          return json(res, resp.status, resp.body);
        }
        return json(res, 201, { success: true, message: 'Favorito adicionado' });
      }

      if (a === 'check' && b && req.method === 'GET') {
        const { data, error } = await attemptUserIdField((userIdField) =>
          supabase.from('favorites').select('id').eq(userIdField, user.id).eq('business_id', b).maybeSingle()
        );
        if (error) {
          console.error('[favorites] CHECK failed', { userId: user.id, businessId: b, error: normalizeSupabaseError(error) });
          const resp = supabaseErrorResponse(error);
          return json(res, resp.status, resp.body);
        }
        return json(res, 200, { success: true, is_favorite: Boolean(data?.id) });
      }

      if (a && req.method === 'DELETE') {
        const { error } = await attemptUserIdField((userIdField) =>
          supabase.from('favorites').delete().eq(userIdField, user.id).eq('business_id', a)
        );
        if (error) {
          console.error('[favorites] DELETE failed', { userId: user.id, businessId: a, error: normalizeSupabaseError(error) });
          const resp = supabaseErrorResponse(error);
          return json(res, resp.status, resp.body);
        }
        return json(res, 200, { success: true, message: 'Favorito removido' });
      }

      return methodNotAllowed(res);
    }

    if (resource === 'leads') {
      if (req.method !== 'POST') return methodNotAllowed(res);
      const body = await readJson(req);
      const name = body?.name;
      const whatsapp = body?.whatsapp;
      const searchTerm = body?.searchTerm;
      if (!name || !whatsapp) return json(res, 400, { success: false, message: 'name e whatsapp são obrigatórios' });

      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('leads')
        .insert([{ name, whatsapp, search_term: searchTerm || null }])
        .select('*')
        .single();

      if (error) return json(res, 500, { success: false, message: error.message });
      return json(res, 201, { success: true, data });
    }

    if (resource === 'upload' && a === 'image') {
      if (req.method !== 'POST') return methodNotAllowed(res);
      const { fields, file } = await parseMultipart(req);
      const token = getBearerToken(req) || (typeof fields.token === 'string' ? fields.token : null);
      const user = await requireAuthFromToken(token);
      requireRole(user, ['admin']);

      const businessId = fields.businessId || 'misc';

      const supabase = getSupabaseAdmin();
      const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'business-images';
      const safeName = file.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `businesses/${businessId}/${Date.now()}-${safeName}`;

      const uploadRes = await supabase.storage.from(bucket).upload(path, file.buffer, { contentType: file.mimeType, upsert: true });
      if (uploadRes.error) return json(res, 500, { success: false, message: uploadRes.error.message });

      const publicUrl = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
      return json(res, 200, { success: true, data: { url: publicUrl, path } });
    }

    if (resource === 'reviews') {
      const supabase = getSupabaseAdmin();

      if (!a && req.method === 'GET') {
        const user = await requireAuth(req);
        requireRole(user, ['admin']);

        const limitRaw = getQuery(req, 'limit');
        const limit = limitRaw ? Number.parseInt(limitRaw, 10) : 200;
        const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 500) : 200;

        const attempt = async (options: { withProfile: boolean; withBusiness: boolean; useCommentField: boolean; useProfileId: boolean }) => {
          const contentField = options.useCommentField ? 'comment' : 'content';
          const userIdField = options.useProfileId ? 'profile_id' : 'user_id';
          const base = `id, business_id, ${userIdField}, rating, ${contentField}, created_at`;
          const select = [
            base,
            options.withBusiness ? 'business:businesses(id,name)' : null,
            options.withProfile ? 'user:profiles(id, username)' : null,
          ]
            .filter(Boolean)
            .join(', ');

          return supabase.from('reviews').select(select).order('created_at', { ascending: false }).limit(safeLimit);
        };

        let { data, error } = await attempt({ withProfile: true, withBusiness: true, useCommentField: false, useProfileId: false });
        if (error && isMissingColumnError(error, 'content')) {
          ({ data, error } = await attempt({ withProfile: true, withBusiness: true, useCommentField: true, useProfileId: false }));
        }
        if (error && isMissingColumnError(error, 'user_id')) {
          ({ data, error } = await attempt({ withProfile: true, withBusiness: true, useCommentField: isMissingColumnError(error, 'content'), useProfileId: true }));
        }
        if (error) {
          ({ data, error } = await attempt({
            withProfile: false,
            withBusiness: true,
            useCommentField: isMissingColumnError(error, 'content'),
            useProfileId: isMissingColumnError(error, 'user_id'),
          }));
        }
        if (error) {
          console.error('[reviews] LIST failed', { error: normalizeSupabaseError(error) });
          const resp = supabaseErrorResponse(error);
          return json(res, resp.status, resp.body);
        }

        const mapped = Array.isArray(data)
          ? data.map((r) => {
            const rr = r as Record<string, unknown>;
            const content = typeof rr.content === 'string' ? rr.content : typeof rr.comment === 'string' ? rr.comment : '';
            const userIdValue = typeof rr.user_id === 'string' ? rr.user_id : typeof rr.profile_id === 'string' ? rr.profile_id : null;
            return { ...rr, content, user_id: userIdValue };
          })
          : [];

        return json(res, 200, { success: true, data: mapped });
      }

      if (a && req.method === 'GET') {
        const attempt = async (options: { withProfile: boolean; useCommentField: boolean; useProfileId: boolean }) => {
          const contentField = options.useCommentField ? 'comment' : 'content';
          const userIdField = options.useProfileId ? 'profile_id' : 'user_id';
          const base = `id, business_id, ${userIdField}, rating, ${contentField}, created_at`;
          const select = options.withProfile ? `${base}, user:profiles(id, username)` : base;

          return supabase.from('reviews').select(select).eq('business_id', a).order('created_at', { ascending: false });
        };

        let { data, error } = await attempt({ withProfile: true, useCommentField: false, useProfileId: false });
        if (error && isMissingColumnError(error, 'content')) {
          ({ data, error } = await attempt({ withProfile: true, useCommentField: true, useProfileId: false }));
        }
        if (error && isMissingColumnError(error, 'user_id')) {
          ({ data, error } = await attempt({ withProfile: true, useCommentField: isMissingColumnError(error, 'content'), useProfileId: true }));
        }
        if (error) {
          ({ data, error } = await attempt({
            withProfile: false,
            useCommentField: isMissingColumnError(error, 'content'),
            useProfileId: isMissingColumnError(error, 'user_id'),
          }));
        }

        if (error) {
          console.error('[reviews] GET failed', { businessId: a, error: normalizeSupabaseError(error) });
          const resp = supabaseErrorResponse(error);
          return json(res, resp.status, resp.body);
        }

        const mapped = Array.isArray(data)
          ? data.map((r) => {
            const rr = r as Record<string, unknown>;
            const content = typeof rr.content === 'string' ? rr.content : typeof rr.comment === 'string' ? rr.comment : '';
            const userIdValue = typeof rr.user_id === 'string' ? rr.user_id : typeof rr.profile_id === 'string' ? rr.profile_id : null;
            return { ...rr, content, user_id: userIdValue };
          })
          : [];

        return json(res, 200, { success: true, data: mapped });
      }

      if (a && req.method === 'DELETE') {
        const user = await requireAuth(req);
        requireRole(user, ['admin']);

        const { error } = await supabase.from('reviews').delete().eq('id', a);
        if (error) {
          console.error('[reviews] DELETE failed', { reviewId: a, error: normalizeSupabaseError(error) });
          const resp = supabaseErrorResponse(error);
          return json(res, resp.status, resp.body);
        }
        return json(res, 200, { success: true });
      }

      if (req.method === 'POST') {
        const user = await requireAuth(req);
        const body = await readJson(req);
        const businessId = body?.business_id;
        const rating = body?.rating;
        const commentOrContent = body?.comment ?? body?.content;

        if (!businessId || typeof businessId !== 'string') return json(res, 400, { success: false, message: 'business_id é obrigatório' });
        if (!Number.isFinite(rating) || typeof rating !== 'number') return json(res, 400, { success: false, message: 'rating é obrigatório' });
        if (!commentOrContent || typeof commentOrContent !== 'string') return json(res, 400, { success: false, message: 'comment é obrigatório' });

        const safeRating = Math.max(1, Math.min(5, Math.round(rating)));

        const attemptInsert = async (options: { withProfile: boolean; useCommentField: boolean; useProfileId: boolean }) => {
          const contentField = options.useCommentField ? 'comment' : 'content';
          const userIdField = options.useProfileId ? 'profile_id' : 'user_id';

          const selectBase = `id, business_id, ${userIdField}, rating, ${contentField}, created_at`;
          const select = options.withProfile ? `${selectBase}, user:profiles(id, username)` : selectBase;

          const payload: Record<string, unknown> = {
            business_id: businessId,
            rating: safeRating,
            [userIdField]: user.id,
            [contentField]: commentOrContent,
          };

          return supabase.from('reviews').insert([payload]).select(select).single();
        };

        let { data, error } = await attemptInsert({ withProfile: true, useCommentField: false, useProfileId: false });
        if (error && isMissingColumnError(error, 'content')) {
          ({ data, error } = await attemptInsert({ withProfile: true, useCommentField: true, useProfileId: false }));
        }
        if (error && isMissingColumnError(error, 'user_id')) {
          ({ data, error } = await attemptInsert({ withProfile: true, useCommentField: isMissingColumnError(error, 'content'), useProfileId: true }));
        }
        if (error) {
          ({ data, error } = await attemptInsert({ withProfile: false, useCommentField: isMissingColumnError(error, 'content'), useProfileId: isMissingColumnError(error, 'user_id') }));
        }

        if (error) {
          console.error('[reviews] POST failed', {
            businessId,
            userId: user.id,
            error: normalizeSupabaseError(error),
          });
          const resp = supabaseErrorResponse(error);
          return json(res, resp.status, resp.body);
        }

        const mapped = (data && typeof data === 'object'
          ? (() => {
            const rr = data as Record<string, unknown>;
            const content = typeof rr.content === 'string' ? rr.content : typeof rr.comment === 'string' ? rr.comment : '';
            const userIdValue = typeof rr.user_id === 'string' ? rr.user_id : typeof rr.profile_id === 'string' ? rr.profile_id : null;
            return { ...rr, content, user_id: userIdValue };
          })()
          : data) as unknown;

        return json(res, 201, { success: true, data: mapped });
      }

      return methodNotAllowed(res);
    }

    if (resource === 'business-images') {
      const supabase = getSupabaseAdmin();

      if (a && req.method === 'GET') {
        const attemptTable = async () =>
          supabase
            .from('business_images')
            .select('*')
            .eq('business_id', a)
            .order('created_at', { ascending: false });

        let { data, error } = await attemptTable();

        if (error) {
          data = [];
        }

        if (Array.isArray(data) && data.length > 0) {
          return json(res, 200, { success: true, data });
        }

        const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'business-images';
        const prefix = `businesses/${a}`;
        const listRes = await supabase.storage.from(bucket).list(prefix, { limit: 100 });
        if (listRes.error) return json(res, 200, { success: true, data: [] });

        const items = (listRes.data || [])
          .filter((f) => typeof f.name === 'string' && f.name.length > 0)
          .map((f, idx) => {
            const path = `${prefix}/${f.name}`;
            const url = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
            return {
              id: f.id || `${a}:${f.name}:${idx}`,
              business_id: a,
              image_url: url,
              is_primary: idx === 0,
              created_at: f.created_at || new Date().toISOString(),
            };
          });

        return json(res, 200, { success: true, data: items });
      }

      if (req.method === 'POST') {
        const user = await requireAuth(req);
        requireRole(user, ['admin']);

        const body = await readJson(req);
        const businessId = (typeof a === 'string' && a.length > 0) ? a : body?.business_id;
        const imageUrl = body?.image_url;
        const isPrimary = Boolean(body?.is_primary);

        if (!businessId || typeof businessId !== 'string') {
          return json(res, 400, { success: false, message: 'business_id é obrigatório' });
        }
        if (!imageUrl || typeof imageUrl !== 'string') {
          return json(res, 400, { success: false, message: 'image_url é obrigatório' });
        }

        const { data, error } = await supabase
          .from('business_images')
          .insert([{ business_id: businessId, image_url: imageUrl, is_primary: isPrimary }])
          .select('*')
          .single();

        if (error) return json(res, 500, { success: false, message: error.message });
        return json(res, 201, { success: true, data });
      }

      if (a && req.method === 'DELETE') {
        const user = await requireAuth(req);
        requireRole(user, ['admin']);

        const { error } = await supabase.from('business_images').delete().eq('id', a);
        if (error) return json(res, 500, { success: false, message: error.message });
        return json(res, 200, { success: true });
      }

      return methodNotAllowed(res);
    }

    return notFound(res);
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string };
    const status = err?.statusCode || 500;
    return json(res, status, { success: false, message: err?.message || 'Erro interno' });
  }
}
