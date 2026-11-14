/**
 * Envio de imagem do painel para o storage (Vercel Blob) via `/api/admin/upload`.
 * Aceita PNG (inclusive transparente), JPG e WEBP ate 4 MB. Devolve a URL publica.
 */
export const TIPOS_IMAGEM = ['image/png', 'image/jpeg', 'image/webp'];
export const ACCEPT_IMAGEM = TIPOS_IMAGEM.join(',');

export async function enviarImagem(arquivo: File): Promise<string> {
  if (!TIPOS_IMAGEM.includes(arquivo.type)) throw new Error('Use PNG, JPG ou WEBP.');
  if (arquivo.size > 4 * 1024 * 1024) throw new Error('A imagem passa de 4 MB.');
  const corpo = new FormData();
  corpo.append('arquivo', arquivo);
  const r = await fetch('/api/admin/upload', { method: 'POST', body: corpo });
  const j = (await r.json().catch(() => ({}))) as { ok?: boolean; url?: string; erro?: string };
  if (!r.ok || !j.ok || !j.url) throw new Error(j.erro ?? 'Não foi possível enviar a imagem.');
  return j.url;
}
