import Link from 'next/link'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-paper hover:opacity-90',
  secondary: 'border border-rule bg-card hover:bg-paper-2 text-ink',
  ghost: 'text-ink-2 hover:bg-paper-2',
  danger: 'border border-bad text-bad hover:bg-bad-soft',
}

const BASE = 'inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed'

export function Button({ variant = 'secondary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type="button" className={`${BASE} ${VARIANTS[variant]} ${className}`} {...props} />
}

export function LinkButton({ href, variant = 'secondary', children, className = '' }: { href: string; variant?: Variant; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={`${BASE} ${VARIANTS[variant]} ${className}`}>
      {children}
    </Link>
  )
}

export function Card({ children, className = '', as: As = 'section' }: { children: ReactNode; className?: string; as?: 'section' | 'div' | 'article' }) {
  return <As className={`rounded-2xl border border-rule/70 bg-card p-4 sm:p-6 ${className}`}>{children}</As>
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-sm text-ink-3">{children}</p>
}

/**
 * Page header. `line` (a track id) draws that track's colour as a thick rail beside the title, so every page
 * that belongs to a track wears its line. `en` is the English term, kept for pages that teach terminology.
 */
export function PageTitle({ eyebrow, title, en, lead, line }: { eyebrow?: ReactNode; title: string; en?: string; lead?: ReactNode; line?: string }) {
  return (
    <header className={`mb-10 max-w-3xl ${line ? 'border-l-[6px] pl-5' : ''}`} style={line ? { borderColor: `var(--line-${line})` } : undefined}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h1 className="mt-1 font-display text-[2rem] font-bold leading-[1.12] sm:text-[2.6rem]">{title}</h1>
      {en && (
        <p lang="en" className="mt-1.5 text-base text-ink-3">
          {en}
        </p>
      )}
      {lead && <div className="mt-4 max-w-[65ch] text-[1.05rem] leading-relaxed text-ink-2">{lead}</div>}
    </header>
  )
}

/** "khoảng 45 phút" — written out: a bare "~45" reads as a minus sign in many fonts. */
export const minutes = (n: number) => `khoảng ${n} phút`

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="num rounded border border-rule bg-paper-2 px-1.5 py-0.5 text-[0.75rem] text-ink-2">{children}</kbd>
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100)
  return (
    <div role="progressbar" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} className="h-1.5 w-full overflow-hidden rounded-full bg-paper-2">
      <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${pct}%` }} />
    </div>
  )
}
