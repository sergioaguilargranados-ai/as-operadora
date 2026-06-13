import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Video, Layout } from "lucide-react";

export function LandingContentManager({ showToast }: { showToast: (msg: string, type: 'success' | 'error') => void }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [content, setContent] = useState({
    hero_video_url: '',
    hero_title: '',
    hero_subtitle: '',
    sections_json: {} as any
  });

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const res = await fetch('/api/inicio/content');
      const data = await res.json();
      if (data.success && data.data) {
        setContent({
          hero_video_url: data.data.hero_video_url || '',
          hero_title: data.data.hero_title || '',
          hero_subtitle: data.data.hero_subtitle || '',
          sections_json: typeof data.data.sections_json === 'string' 
            ? JSON.parse(data.data.sections_json) 
            : (data.data.sections_json || {})
        });
      }
    } catch (err) {
      console.error(err);
      showToast('Error cargando contenido de la Landing', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/inicio/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Contenido de la Landing guardado', 'success');
      } else {
        showToast(data.error || 'Error al guardar', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error de conexión', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Cargando contenido de Landing...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 text-blue-700 p-4 rounded-xl text-sm border border-blue-100 flex items-start gap-3">
        <Layout className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Landing Principal (/inicio)</p>
          <p>La nueva estructura de la Landing utiliza valores predeterminados (hardcoded) para mantener su diseño impecable (secciones de ayudas, destinos, servicios). Puedes usar esta sección para modificar el título, subtítulo e imagen principal del Hero.</p>
        </div>
      </div>

      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Video className="w-5 h-5" />
          Configuración Hero
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">URL de Imagen/Video de Fondo</label>
            <Input 
              value={content.hero_video_url} 
              onChange={e => setContent({...content, hero_video_url: e.target.value})}
              placeholder="/inicio/WhatsApp Image... o URL externa"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Título Principal</label>
              <Input 
                value={content.hero_title} 
                onChange={e => setContent({...content, hero_title: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Subtítulo</label>
              <Input 
                value={content.hero_subtitle} 
                onChange={e => setContent({...content, hero_subtitle: e.target.value})}
              />
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-black text-white hover:bg-gray-800">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>
    </div>
  );
}
