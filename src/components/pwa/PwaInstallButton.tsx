"use client"

import { useState, useEffect } from "react";
import { Download } from "lucide-react";

export function PwaInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if we have the global prompt
    if (typeof window !== 'undefined' && (window as any).pwaDeferredPrompt) {
      setDeferredPrompt((window as any).pwaDeferredPrompt);
    }
    
    // Listen for future events
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).pwaDeferredPrompt = e;
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  if (!deferredPrompt) return null;

  return (
    <button
      onClick={handleInstall}
      className="text-gray-400 hover:text-white transition-colors text-[10px] flex items-center gap-1 opacity-50 hover:opacity-100"
      title="Instalar como Aplicación"
    >
      <Download className="w-3 h-3" />
      Instalar App
    </button>
  );
}
