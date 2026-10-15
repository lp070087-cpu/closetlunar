
'use client';

import { useEffect } from 'react';
import { Ruler, X } from 'lucide-react';

type Medidas = {
  height: string;
  weight: string;
  age: string;
  bust: string;
  waist: string;
  hip: string;
};

const campos: Array<{
  key: keyof Medidas;
  label: string;
  unidade: string;
}> = [
  { key: 'height', label: 'Altura', unidade: 'cm' },
  { key: 'weight', label: 'Peso', unidade: 'kg' },
  { key: 'age', label: 'Idade', unidade: 'anos' },
  { key: 'bust', label: 'Busto', unidade: 'cm' },
  { key: 'waist', label: 'Cintura', unidade: 'cm' },
  { key: 'hip', label: 'Quadril', unidade: 'cm' },
];

export function AvatarMedidasModal({
  medidas,
  onClose,
}: {
  medidas: Medidas;
  onClose: () => void;
}) {
  useEffect(() => {
    const fechar = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', fechar);

    return () => document.removeEventListener('keydown', fechar);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="avatar-medidas-titulo"
        className="relative grid max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-background shadow-2xl md:grid-cols-2"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar visualizador"
          className="absolute right-4 top-4 z-10 rounded-full bg-background p-2 shadow-md"
        >
          <X className="size-5" />
        </button>

        <div className="flex min-h-[340px] items-center justify-center bg-secondary p-6 md:min-h-[520px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/site/avatar-provador.png"
            alt="Avatar ilustrativo Closet Lunnar"
            className="max-h-[470px] w-full object-contain"
          />
        </div>

        <div className="flex flex-col justify-center p-6 sm:p-10">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <Ruler className="size-4" />
            Closet Lunnar
          </div>

          <h2
            id="avatar-medidas-titulo"
            className="mt-4 font-serif text-3xl"
          >
            Seu perfil de medidas
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Visualize as medidas preenchidas no seu perfil.
            Esta é uma prévia ilustrativa, não uma simulação 3D.
          </p>

          <div className="mt-7 grid grid-cols-2 gap-3">
            {campos.map((campo) => (
              <div
                key={campo.key}
                className="rounded-2xl border border-border p-4"
              >
                <p className="text-xs text-muted-foreground">
                  {campo.label}
                </p>

                <p className="mt-1 text-lg font-medium">
                  {medidas[campo.key]
                    ? `${medidas[campo.key]} ${campo.unidade}`
                    : 'Não informado'}
                </p>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-8 rounded-full bg-foreground px-6 py-3 text-xs font-bold uppercase tracking-widest text-background"
          >
            Voltar às minhas medidas
          </button>
        </div>
      </div>
    </div>
  );
}
