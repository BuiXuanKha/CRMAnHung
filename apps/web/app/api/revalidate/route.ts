import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

type Body = {
  paths?: unknown;
};

/**
 * On-demand ISR — Nest gọi loopback `http://127.0.0.1:5001/api/revalidate`
 * (nginx `/api/` → Nest, nên không dùng https://anhungland.com/api/…).
 */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ ok: false, error: 'REVALIDATE_SECRET chưa cấu hình' }, { status: 503 });
  }

  const headerSecret = request.headers.get('x-revalidate-secret')?.trim();
  if (!headerSecret || headerSecret !== secret) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: 'JSON không hợp lệ' }, { status: 400 });
  }

  const paths = Array.isArray(body.paths)
    ? body.paths.filter((p): p is string => typeof p === 'string' && p.startsWith('/'))
    : [];
  if (paths.length === 0) {
    return NextResponse.json({ ok: false, error: 'Thiếu paths' }, { status: 400 });
  }

  for (const path of paths) {
    revalidatePath(path);
  }

  return NextResponse.json({ ok: true, revalidated: paths });
}
