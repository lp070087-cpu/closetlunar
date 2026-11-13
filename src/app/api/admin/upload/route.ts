import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { sessaoAtual } from '@/lib/auth/guardas';

export const dynamic = 'force-dynamic';

const TIPOS = ['image/png', 'image/jpeg', 'image/webp'];
const MAX = 4 * 1024 * 1024;

/** POST /api/admin/upload (multipart, campo "arquivo") -> { url } no Vercel Blob. Somente admin. */
export async function POST(req: Request) {
  const s = await sessaoAtual().catch(() => null);
  if (!s || s.papel !== 'admin') return NextResponse.json({ ok: false, erro: 'Apenas administradores.' }, { status: 401 });
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ ok: false, erro: 'Armazenamento de imagens não configurado.' }, { status: 503 });
  }
  const form = await req.formData().catch(() => null);
  const arquivo = form?.get('arquivo');
  if (!(arquivo instanceof File)) return NextResponse.json({ ok: false, erro: 'Arquivo ausente.' }, { status: 400 });
  if (!TIPOS.includes(arquivo.type) || arquivo.size > MAX) {
    return NextResponse.json({ ok: false, erro: 'Use PNG, JPG ou WEBP de até 4 MB.' }, { status: 400 });
  }
  const nome = arquivo.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-').slice(-60) || 'foto';
  const blob = await put(`produtos/${nome}`, arquivo, { access: 'public', addRandomSuffix: true, contentType: arquivo.type });
  return NextResponse.json({ ok: true, url: blob.url });
}
