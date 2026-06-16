'use client'

import Link from 'next/link'
import { Logo } from './Logo'
import { UserMenu } from './UserMenu'
import { Button } from './ui/button'
import { ArrowLeft } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface PageHeaderProps {
  showBackButton?: boolean
  backButtonText?: string
  backButtonHref?: string
  showUserMenu?: boolean
  children?: React.ReactNode
}

export function PageHeader({
  showBackButton = true,
  backButtonText = 'Volver',
  backButtonHref,
  showUserMenu = true,
  children
}: PageHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { logout } = useAuth()

  const handleBack = () => {
    if (backButtonHref) {
      router.push(backButtonHref)
    } else {
      router.back()
    }
  }

  const handleLogoClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    
    // Si ya estamos en el inicio del portal
    if (pathname === '/portal' || pathname === '/dashboard') {
      // Desconectar y mandar a la landing para evitar el loop del middleware
      await logout()
      router.push('/')
    } else {
      // Si estamos en otra página, regresar al inicio del portal
      router.push('/dashboard')
    }
  }

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-200/50 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Button
                variant="ghost"
                onClick={handleBack}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                {backButtonText}
              </Button>
            )}
            <a href="/" onClick={handleLogoClick} className="cursor-pointer">
              <Logo className="py-2" />
            </a>
          </div>
          <div className="flex items-center gap-3 md:gap-6 text-sm">
            {children}
            {showUserMenu && <UserMenu />}
          </div>
        </div>
      </div>
    </header>
  )
}
