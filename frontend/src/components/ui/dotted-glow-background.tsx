import * as React from 'react'
import { cn } from '@/lib/utils'

interface DottedGlowBackgroundProps {
  className?: string
  opacity?: number
  gap?: number
  radius?: number
  colorLightVar?: string
  glowColorLightVar?: string
  colorDarkVar?: string
  glowColorDarkVar?: string
  backgroundOpacity?: number
  speedMin?: number
  speedMax?: number
  speedScale?: number
}

export function DottedGlowBackground({
  className,
  opacity = 0.5,
  gap = 20,
  radius = 1.2,
  backgroundOpacity = 0.85,
}: DottedGlowBackgroundProps) {
  const dotSize = radius * 2

  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 -z-10 overflow-hidden',
        className,
      )}
      style={{
        opacity,
        backgroundColor: `rgba(15,15,15,${backgroundOpacity})`,
        // Neutral gray dotted layer + soft vertical gradient (no color)
        backgroundImage: `
          radial-gradient(circle at 1px 1px, rgba(255,255,255,0.16) 1px, transparent 0),
          linear-gradient(to bottom, rgba(15,15,15,0.4), rgba(15,15,15,0.95))
        `,
        backgroundSize: `${gap}px ${gap}px, 100% 100%`,
      }}
    />
  )
}

