import * as React from 'react'
import { cn } from '@/lib/utils'
import { DottedGlowBackground } from './dotted-glow-background'

interface DottedGlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function DottedGlowCard({
  children,
  className,
  ...props
}: DottedGlowCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl border border-slate-800 bg-[#050608]/90 shadow-[0_18px_45px_rgba(0,0,0,0.75)]',
        className,
      )}
      {...props}
    >
      <DottedGlowBackground className="opacity-70" />
      <div className="pointer-events-none absolute inset-0 rounded-3xl border border-white/5" />
      <div className="relative z-10 p-8 md:p-10">{children}</div>
    </div>
  )
}

