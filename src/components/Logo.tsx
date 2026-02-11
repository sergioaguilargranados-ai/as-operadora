'use client';

import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import Image from 'next/image';

interface LogoProps {
  className?: string
  forceDefault?: boolean  // Forzar logo AS Operadora (ej: en footer "Powered by")
  size?: 'sm' | 'md' | 'lg'
}

export function Logo({ className = "", forceDefault = false, size = 'md' }: LogoProps) {
  const { logoUrl, companyName, isWhiteLabel, isLoading } = useWhiteLabel()

  // Tamaños según prop
  const sizeClasses = {
    sm: { logo: 'h-8 w-auto', text: 'text-2xl', sub: 'text-[7px]' },
    md: { logo: 'h-12 w-auto', text: 'text-4xl md:text-5xl', sub: 'text-[9px] md:text-[11px]' },
    lg: { logo: 'h-16 w-auto', text: 'text-5xl md:text-6xl', sub: 'text-[11px] md:text-[13px]' },
  }
  const s = sizeClasses[size]

  // Si tenemos logo URL de white-label Y no es forzado default
  if (!forceDefault && isWhiteLabel && logoUrl && !isLoading) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <Image
          src={logoUrl}
          alt={companyName}
          width={size === 'sm' ? 32 : size === 'md' ? 48 : 64}
          height={size === 'sm' ? 32 : size === 'md' ? 48 : 64}
          className={`${s.logo} object-contain`}
          unoptimized // Para URLs externas
        />
        <div className="flex flex-col">
          <span
            className="font-bold tracking-tight leading-none"
            style={{
              fontFamily: 'Georgia, serif',
              color: 'var(--brand-primary, #0066FF)',
              fontSize: size === 'sm' ? '14px' : size === 'md' ? '18px' : '22px'
            }}
          >
            {companyName}
          </span>
        </div>
      </div>
    )
  }

  // Si es white-label pero SIN logo URL, mostrar nombre con colores del tenant
  if (!forceDefault && isWhiteLabel && !isLoading) {
    return (
      <div className={`flex flex-col ${className}`}>
        <div className="flex items-baseline gap-1">
          <span
            className={`${s.text} font-bold tracking-tighter leading-none`}
            style={{
              fontFamily: 'Georgia, serif',
              color: 'var(--brand-primary, #0066FF)'
            }}
          >
            {companyName.substring(0, 2).toUpperCase()}
          </span>
        </div>
        <div
          className={`${s.sub} tracking-[0.15em] font-medium leading-tight mt-0.5 uppercase`}
          style={{
            fontFamily: 'Georgia, serif',
            color: 'var(--brand-primary, #0066FF)'
          }}
        >
          {companyName}
        </div>
      </div>
    )
  }

  // Default: Logo AS Operadora (sin cambios del diseño original)
  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-baseline gap-1">
        <span className={`${s.text} font-bold tracking-tighter leading-none text-black`} style={{ fontFamily: 'Georgia, serif' }}>
          A<span className={s.text}>S</span>
        </span>
      </div>
      <div className={`${s.sub} tracking-[0.15em] font-medium leading-tight mt-0.5 uppercase text-black`} style={{ fontFamily: 'Georgia, serif' }}>
        AS OPERADORA DE VIAJES Y EVENTOS
      </div>
      <div className={`${s.sub} text-gray-700 leading-tight -mt-0.5`} style={{ fontFamily: 'Georgia, serif' }}>
        AS Viajando
      </div>
    </div>
  )
}
