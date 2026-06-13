"use client"

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Playfair_Display, Inter } from 'next/font/google';
import { Plane, Building, Users, Briefcase, ChevronRight, Shield, Star, HeartHandshake, Globe } from 'lucide-react';

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const inter = Inter({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'] });

export default function InicioLanding() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/inicio/content')
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setData(res.data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleRegister = (type: string) => {
    router.push(`/inicio/registro?type=${encodeURIComponent(type)}`);
  };

  // Helper for parsing JSON safely
  const getSections = () => {
    if (!data || !data.sections_json) return {};
    try {
      return typeof data.sections_json === 'string' 
        ? JSON.parse(data.sections_json) 
        : data.sections_json;
    } catch {
      return {};
    }
  };

  const sections = getSections();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F4F4F6]">Cargando...</div>;
  }

  return (
    <div className={`min-h-screen bg-white text-[#1C1C1E] ${inter.className}`}>
      {/* HEADER */}
      <header className="fixed w-full top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${playfair.className}`}>AS Operadora</span>
          </div>
          <button 
            onClick={() => handleRegister('Viajero')}
            className="bg-black text-white px-6 py-2.5 rounded-full font-medium hover:bg-gray-800 transition-colors"
          >
            Regístrate
          </button>
        </div>
      </header>

      {/* HERO PRINCIPAL */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-[#F4F4F6]">
        <div className="absolute inset-0 z-0">
          <img 
            src={data?.hero_video_url || "/inicio/WhatsApp Image 2026-06-12 at 11.15.55 AM.jpeg"} 
            alt="Hero Background" 
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        
        <div className="container relative z-10 mx-auto px-4 text-center">
          <h1 className={`text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight ${playfair.className}`}>
            {data?.hero_title || "Descubre el mundo con expertos"}
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-12 max-w-3xl mx-auto font-light">
            {data?.hero_subtitle || "Soluciones integrales de viaje para cada necesidad. Únete a la red más exclusiva."}
          </p>

          <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
            <button onClick={() => handleRegister('Viajero')} className="bg-white text-black px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-transform hover:scale-105 flex items-center gap-2">
              <Plane className="w-5 h-5" /> Soy viajero
            </button>
            <button onClick={() => handleRegister('Agencia de Viajes')} className="bg-black/80 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-full font-semibold hover:bg-black transition-transform hover:scale-105 flex items-center gap-2">
              <Briefcase className="w-5 h-5" /> Soy agencia de viajes
            </button>
            <button onClick={() => handleRegister('Agencia de Eventos')} className="bg-black/80 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-full font-semibold hover:bg-black transition-transform hover:scale-105 flex items-center gap-2">
              <Users className="w-5 h-5" /> Soy agencia de eventos
            </button>
            <button onClick={() => handleRegister('Empresa')} className="bg-black/80 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-full font-semibold hover:bg-black transition-transform hover:scale-105 flex items-center gap-2">
              <Building className="w-5 h-5" /> Soy empresa
            </button>
          </div>
        </div>
      </section>

      {/* ¿CÓMO PODEMOS AYUDARTE? */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <h2 className={`text-3xl md:text-5xl font-bold text-center mb-16 ${playfair.className}`}>¿Cómo podemos ayudarte?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: "Viajeros", desc: "Experiencias únicas y personalizadas para tus vacaciones soñadas.", icon: Plane },
              { title: "Agencias de Viajes", desc: "Plataforma B2B, comisiones atractivas y soporte prioritario.", icon: Briefcase },
              { title: "Agencias de Eventos", desc: "Coordinación logística, tarifas grupales y atención especializada.", icon: Users },
              { title: "Empresas", desc: "Gestión de viajes corporativos, control de gastos y beneficios exclusivos.", icon: Building }
            ].map((item, i) => (
              <div key={i} className="p-8 rounded-3xl bg-[#F4F4F6] hover:shadow-xl transition-shadow border border-gray-100 group">
                <div className="w-14 h-14 bg-black text-white rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className={`text-xl font-bold mb-4 ${playfair.className}`}>{item.title}</h3>
                <p className="text-gray-600 leading-relaxed mb-6">{item.desc}</p>
                <button onClick={() => handleRegister(item.title)} className="text-black font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                  Conocer más <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DESTINOS QUE TE ESPERAN */}
      <section className="py-24 bg-[#F4F4F6]">
        <div className="container mx-auto px-4">
          <h2 className={`text-3xl md:text-5xl font-bold text-center mb-16 ${playfair.className}`}>Destinos que te esperan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              { name: "América", img: "1WhatsApp Image 2026-06-12 at 11.15.55 AM.jpeg" },
              { name: "Europa", img: "3WhatsApp Image 2026-06-12 at 11.15.55 AM.jpeg" },
              { name: "África", img: "4WhatsApp Image 2026-06-12 at 11.15.55 AM.jpeg" },
              { name: "Asia", img: "5WhatsApp Image 2026-06-12 at 11.15.55 AM.jpeg" },
              { name: "Oceanía", img: "11WhatsApp Image 2026-06-12 at 11.15.57 AM.jpeg" }
            ].map((dest, i) => (
              <div key={i} className="relative rounded-3xl overflow-hidden aspect-[3/4] group cursor-pointer">
                <img src={`/inicio/${dest.img}`} alt={dest.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <h3 className={`absolute bottom-6 left-6 text-2xl font-bold text-white ${playfair.className}`}>{dest.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NUESTROS SERVICIOS */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <h2 className={`text-3xl md:text-5xl font-bold text-center mb-16 ${playfair.className}`}>Nuestros Servicios</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Viajes Vacacionales", img: "6WhatsApp Image 2026-06-12 at 11.15.56 AM.jpeg" },
              { title: "Grupos y Convenciones", img: "7WhatsApp Image 2026-06-12 at 11.15.56 AM.jpeg" },
              { title: "Operación para Agencias", img: "8WhatsApp Image 2026-06-12 at 11.15.56 AM.jpeg" }
            ].map((serv, i) => (
              <div key={i} className="rounded-3xl overflow-hidden bg-[#F4F4F6] group">
                <div className="h-64 overflow-hidden relative">
                  <img src={`/inicio/${serv.img}`} alt={serv.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-8">
                  <h3 className={`text-2xl font-bold mb-4 ${playfair.className}`}>{serv.title}</h3>
                  <button onClick={() => handleRegister('Viajero')} className="text-black font-medium border-b border-black pb-1 hover:opacity-70 transition-opacity">
                    Solicitar información
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFICIOS */}
      <section className="py-24 bg-black text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-center">
            {[
              { title: "Experiencias Memorables", icon: Star },
              { title: "Atención Personalizada", icon: HeartHandshake },
              { title: "Destinos Selectos", icon: Globe },
              { title: "Protección de Datos", icon: Shield }
            ].map((ben, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-6">
                  <ben.icon className="w-10 h-10" />
                </div>
                <h3 className={`text-xl font-bold ${playfair.className}`}>{ben.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-32 bg-[#F4F4F6]">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h2 className={`text-4xl md:text-6xl font-bold mb-10 ${playfair.className}`}>Tu próximo viaje comienza aquí</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <button onClick={() => handleRegister('Viajero')} className="bg-black text-white px-8 py-4 rounded-full font-medium hover:bg-gray-800 transition-transform hover:scale-105">
              Registrarme como viajero
            </button>
            <button onClick={() => handleRegister('Agencia de Viajes')} className="bg-white text-black border border-gray-200 px-8 py-4 rounded-full font-medium hover:bg-gray-50 transition-transform hover:scale-105">
              Registrar mi agencia de viajes
            </button>
            <button onClick={() => handleRegister('Agencia de Eventos')} className="bg-white text-black border border-gray-200 px-8 py-4 rounded-full font-medium hover:bg-gray-50 transition-transform hover:scale-105">
              Registrar mi agencia de eventos
            </button>
            <button onClick={() => handleRegister('Empresa')} className="bg-white text-black border border-gray-200 px-8 py-4 rounded-full font-medium hover:bg-gray-50 transition-transform hover:scale-105">
              Solicitar propuesta empresarial
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER BASICO */}
      <footer className="py-8 bg-white border-t border-gray-100 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} AS Operadora de Viajes y Eventos. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
