"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, User, Mail, Phone, Camera, Upload, FileText, CheckCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"

export default function MobileProfilePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(false)
  const [phone, setPhone] = useState(user?.phone || "+52 55 1234 5678")
  
  // Doc states
  const [ineFile, setIneFile] = useState<File | null>(null)
  const [passportFile, setPassportFile] = useState<File | null>(null)
  const [uploadingDoc, setUploadingDoc] = useState<'ine' | 'passport' | null>(null)

  const ineRef = useRef<HTMLInputElement>(null)
  const passportRef = useRef<HTMLInputElement>(null)

  const handleSaveProfile = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast({ title: "Perfil actualizado", description: "Tus datos se han guardado correctamente." })
    }, 1000)
  }

  const handleDocUpload = (type: 'ine' | 'passport', e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (type === 'ine') setIneFile(file)
      if (type === 'passport') setPassportFile(file)
      
      // Simulate upload
      setUploadingDoc(type)
      setTimeout(() => {
        setUploadingDoc(null)
        toast({ title: "Documento subido", description: `El documento se ha cargado correctamente.` })
      }, 1500)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-[#0066FF] px-4 py-4 flex items-center justify-between sticky top-0 z-20 text-white shadow-md">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/mobile")} className="-ml-2 text-white hover:bg-white/20">
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold">Mi Perfil</h1>
        </div>
      </div>

      {/* Avatar Section */}
      <div className="bg-white border-b px-4 py-6 flex flex-col items-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-[#0066FF] border-4 border-white shadow-sm overflow-hidden">
            {user?.image ? (
              <img src={user.image} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10" />
            )}
          </div>
          <button className="absolute bottom-0 right-0 w-8 h-8 bg-[#0066FF] text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm">
            <Camera className="w-4 h-4" />
          </button>
        </div>
        <h2 className="mt-3 text-xl font-bold text-gray-900">{user?.name || "Juan Pérez"}</h2>
        <p className="text-sm text-gray-500 font-medium">Cliente Frecuente</p>
      </div>

      {/* Basic Info */}
      <div className="px-4 mt-6">
        <h3 className="text-sm font-bold text-gray-900 mb-3 ml-1 uppercase tracking-wider">Datos Personales</h3>
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4 border border-gray-100">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Correo Electrónico
            </label>
            <Input 
              value={user?.email || "juan.perez@example.com"} 
              disabled 
              className="bg-gray-50 border-transparent text-gray-700" 
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> Teléfono Celular
            </label>
            <Input 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)}
              className="border-gray-200 focus-visible:ring-[#0066FF]" 
            />
          </div>
          <Button 
            className="w-full mt-2 bg-[#0066FF] hover:bg-blue-700 text-white font-bold rounded-xl"
            onClick={handleSaveProfile}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Guardar Cambios"}
          </Button>
        </div>
      </div>

      {/* Documents */}
      <div className="px-4 mt-6">
        <h3 className="text-sm font-bold text-gray-900 mb-3 ml-1 uppercase tracking-wider">Documentos de Viaje</h3>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y">
          
          {/* INE Upload */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-gray-900">Identificación Oficial (INE)</p>
                <p className="text-xs text-gray-400">{ineFile ? ineFile.name : "No hay archivo cargado"}</p>
              </div>
            </div>
            
            <input type="file" className="hidden" ref={ineRef} accept="image/*,.pdf" onChange={(e) => handleDocUpload('ine', e)} />
            
            {uploadingDoc === 'ine' ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#0066FF]" />
            ) : ineFile ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : (
              <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50 h-8" onClick={() => ineRef.current?.click()}>
                <Upload className="w-4 h-4 mr-1.5" /> Subir
              </Button>
            )}
          </div>

          {/* Passport Upload */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-gray-900">Pasaporte</p>
                <p className="text-xs text-gray-400">{passportFile ? passportFile.name : "No hay archivo cargado"}</p>
              </div>
            </div>
            
            <input type="file" className="hidden" ref={passportRef} accept="image/*,.pdf" onChange={(e) => handleDocUpload('passport', e)} />
            
            {uploadingDoc === 'passport' ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#0066FF]" />
            ) : passportFile ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : (
              <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50 h-8" onClick={() => passportRef.current?.click()}>
                <Upload className="w-4 h-4 mr-1.5" /> Subir
              </Button>
            )}
          </div>

        </div>
        <p className="text-[10px] text-gray-400 mt-2 px-1 text-center">
          Tus documentos están encriptados y protegidos según nuestras políticas de privacidad.
        </p>
      </div>

    </div>
  )
}
