'use client';

import { useEffect, useState } from 'react';
import { getFooter } from '@/lib/conteudo/data';
import { phoneDigits } from '@/lib/whatsapp/metrics';

let contato: Promise<string> | undefined;

/** Reuses the configured footer contact; never opens an unrelated share picker. */
export function whatsappLinkFor(phone: string, message: string): string | undefined {
  const digits = phoneDigits(phone);
  if (!/^\d{10,15}$/.test(digits)) return undefined;
  return 'https://wa.me/' + digits + '?text=' + encodeURIComponent(message);
}

export function useStoreWhatsApp(): string {
  const [phone, setPhone] = useState('');
  useEffect(() => {
    let active = true;
    contato ??= getFooter().then(({ data }) => phoneDigits(data.whatsapp));
    contato.then((value) => { if (active) setPhone(value); }).catch(() => { contato = undefined; });
    return () => { active = false; };
  }, []);
  return phone;
}
