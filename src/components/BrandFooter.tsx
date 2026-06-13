"use client"

import React from 'react';
import { Logo } from './Logo';

export function BrandFooter() {
    return (
      <footer className="py-8 bg-white border-t border-gray-100 text-center text-gray-500 text-sm">
        <div className="flex flex-col items-center justify-center gap-4">
          <Logo />
          <p>© {new Date().getFullYear()} AS Operadora de Viajes y Eventos. Todos los derechos reservados.</p>
          <p className="text-xs mt-2 opacity-50">
            v2.347 | Build: 12 Jun 2026, 23:23 CST
          </p>
        </div>
      </footer>
    );
}
