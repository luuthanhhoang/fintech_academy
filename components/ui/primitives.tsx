import Link from 'next/link'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-paper hover:opacity-90',
  secondary: 'border border-rule bg-paper hover:bg-paper-2 text-ink',
  ghost: 'text-ink-2 hover:bg-paper-2',
  danger: 'border border-bad text-bad hover:bg-bad-soft',
}

const BASE = 'inline-flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed'

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
  return <As className={`rounded-lg border border-rule bg-paper p-4 sm:p-5 ${className}`}>{children}</As>
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-xs font-medium text-ink-3">{children}</p>
}

export function PageTitle({ eyebrow, title, en, lead }: { eyebrow?: string; title: string; en?: string; lead?: ReactNode }) {
  return (
    <header className="mb-8">
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h1 className="mt-1 font-serif text-3xl font-semibold leading-tight sm:text-4xl">
        {title}
        {en && <span className="mt-1 block font-sans text-base font-normal text-ink-3">{en}</span>}
      </h1>
      {lead && <div className="mt-3 max-w-2xl text-ink-2">{lead}</div>}
    </header>
  )
}

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
