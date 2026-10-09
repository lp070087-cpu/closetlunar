import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Campos de formulario do painel.
 *
 * Nos prints os campos sao retangulos claros com raio grande, borda bem suave e
 * rotulo em caixa alta minuscula acima. Estes componentes ja carregam esse
 * rotulo, o estado de erro e o foco, para que nenhuma tela precise repetir.
 */

const CONTROL_BASE =
  'focus-ring w-full rounded-xl border bg-background px-4 text-sm text-foreground transition-colors placeholder:text-muted-foreground/70 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70';

const CONTROL_IDLE = 'border-input hover:border-border';
const CONTROL_ERROR = 'border-danger focus-visible:ring-danger';

export interface FieldProps {
  label?: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  /**
   * Cor do rotulo. Existe porque os prints pintam rotulos especificos
   * (`PREÇO DE CUSTO` em vermelho, `DESCONTO %` em ambar) sem que o campo
   * deixe de ser um campo comum.
   */
  labelClassName?: string;
  children: ReactNode;
}

/** Envelope de campo: rotulo em caixa alta + controle + apoio/erro. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  className,
  labelClassName,
  children,
}: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label ? (
        <label htmlFor={htmlFor} className={cn('label-caps', labelClassName)}>
          {label}
          {required ? <span className="ml-1 text-danger">*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="text-xs font-medium text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  /** Icone decorativo a esquerda (ex.: lupa da busca). */
  icon?: ReactNode;
  labelClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, hint, error, icon, id, required, labelClassName, ...props },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const control = (
    <div className="relative">
      {icon ? (
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground [&>svg]:size-4">
          {icon}
        </span>
      ) : null}
      <input
        ref={ref}
        id={fieldId}
        aria-invalid={error ? true : undefined}
        className={cn(
          CONTROL_BASE,
          error ? CONTROL_ERROR : CONTROL_IDLE,
          'h-11',
          icon && 'pl-10',
          className,
        )}
        {...props}
      />
    </div>
  );
  if (!label && !hint && !error) return control;
  return (
    <Field
      label={label}
      htmlFor={fieldId}
      hint={hint}
      error={error}
      required={required}
      labelClassName={labelClassName}
    >
      {control}
    </Field>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, label, hint, error, id, required, rows = 4, ...props },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const control = (
    <textarea
      ref={ref}
      id={fieldId}
      rows={rows}
      aria-invalid={error ? true : undefined}
      className={cn(
        CONTROL_BASE,
        error ? CONTROL_ERROR : CONTROL_IDLE,
        'resize-y py-3 leading-relaxed',
        className,
      )}
      {...props}
    />
  );
  if (!label && !hint && !error) return control;
  return (
    <Field label={label} htmlFor={fieldId} hint={hint} error={error} required={required}>
      {control}
    </Field>
  );
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  options?: { value: string; label: string; disabled?: boolean }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, label, hint, error, options, children, id, required, ...props },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const control = (
    <div className="relative">
      <select
        ref={ref}
        id={fieldId}
        aria-invalid={error ? true : undefined}
        className={cn(
          CONTROL_BASE,
          error ? CONTROL_ERROR : CONTROL_IDLE,
          'h-11 cursor-pointer appearance-none pr-10',
          className,
        )}
        {...props}
      >
        {options
          ? options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))
          : children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
  if (!label && !hint && !error) return control;
  return (
    <Field label={label} htmlFor={fieldId} hint={hint} error={error} required={required}>
      {control}
    </Field>
  );
});

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, label, description, id, ...props },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <input
        ref={ref}
        id={fieldId}
        type="checkbox"
        className="focus-ring mt-0.5 size-4 shrink-0 cursor-pointer rounded border-input text-foreground accent-foreground"
        {...props}
      />
      {label ? (
        <label htmlFor={fieldId} className="cursor-pointer text-sm leading-snug">
          <span className="font-medium">{label}</span>
          {description ? (
            <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
          ) : null}
        </label>
      ) : null}
    </div>
  );
});

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

/** Interruptor liga/desliga (status ativo, exibir na loja, etc.). */
export function Switch({
  checked,
  onCheckedChange,
  label,
  description,
  disabled,
  id,
  className,
}: SwitchProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <button
        type="button"
        id={fieldId}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          'focus-ring relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors duration-200 disabled:opacity-50',
          checked ? 'bg-foreground' : 'bg-border',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 size-5 rounded-full bg-background shadow-soft transition-transform duration-200',
            checked ? 'translate-x-[1.375rem]' : 'translate-x-0.5',
          )}
        />
      </button>
      {label ? (
        <label htmlFor={fieldId} className="cursor-pointer text-sm leading-snug">
          <span className="font-medium">{label}</span>
          {description ? (
            <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
          ) : null}
        </label>
      ) : null}
    </div>
  );
}

/** Campo de busca com lupa, como o "Buscar por nome, e-mail ou telefone...". */
export function SearchInput({
  value,
  onValueChange,
  placeholder = 'Buscar...',
  className,
  ...props
}: {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <div className={cn('relative', className)}>
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground [&>svg]:size-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
      </span>
      <input
        type="search"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder={placeholder}
        className={cn(
          CONTROL_BASE,
          CONTROL_IDLE,
          'h-12 pl-11 shadow-card',
        )}
        {...props}
      />
    </div>
  );
}

/** Agrupamento em duas colunas, como nos formularios de cupom e produto. */
export function FieldGrid({
  columns = 2,
  className,
  children,
}: {
  columns?: 1 | 2 | 3;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'grid gap-x-6 gap-y-5',
        columns === 1 && 'grid-cols-1',
        columns === 2 && 'grid-cols-1 md:grid-cols-2',
        columns === 3 && 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
        className,
      )}
    >
      {children}
    </div>
  );
}
