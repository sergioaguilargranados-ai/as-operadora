import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, UploadCloud, File as FileIcon, X } from 'lucide-react'

const DOC_TYPES = [
    { value: 'passport', label: 'Pasaporte' },
    { value: 'visa', label: 'Visa' },
    { value: 'id', label: 'Identificación Oficial' },
    { value: 'driver_license', label: 'Licencia de Conducir' },
    { value: 'other', label: 'Otro' }
]

const CATEGORIES = [
    { value: 'identification', label: 'Identificación' },
    { value: 'legal', label: 'Legal' },
    { value: 'travel', label: 'Viaje' },
    { value: 'financial', label: 'Financiero' },
    { value: 'medical', label: 'Médico' },
    { value: 'other', label: 'Otro' }
]

interface Contact {
    id: number
    first_name: string
    last_name: string
    email: string
}

export function UploadDocumentModal({
    isOpen,
    onClose,
    onSuccess
}: {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}) {
    const [contacts, setContacts] = useState<Contact[]>([])
    const [loadingContacts, setLoadingContacts] = useState(false)
    
    const [selectedContact, setSelectedContact] = useState('')
    const [docType, setDocType] = useState('id')
    const [category, setCategory] = useState('identification')
    const [file, setFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (isOpen) {
            fetchContacts()
            setFile(null)
            setError('')
            setSelectedContact('')
        }
    }, [isOpen])

    const fetchContacts = async () => {
        setLoadingContacts(true)
        try {
            const res = await fetch('/api/crm/contacts?limit=500')
            const json = await res.json()
            if (json.success) {
                setContacts(json.data || [])
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoadingContacts(false)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            setError('')
        }
    }

    const handleUpload = async () => {
        if (!selectedContact) {
            setError('Selecciona un contacto')
            return
        }
        if (!file) {
            setError('Selecciona un archivo')
            return
        }

        setIsUploading(true)
        setError('')

        try {
            // 1. Upload to Blob
            const formData = new FormData()
            formData.append('file', file)
            formData.append('userId', '1') // hardcoded para el ejemplo
            formData.append('tenantId', '1')
            formData.append('documentType', docType)

            const uploadRes = await fetch('/api/documents/upload', {
                method: 'POST',
                body: formData
            })
            const uploadJson = await uploadRes.json()

            if (!uploadJson.success) {
                throw new Error(uploadJson.error || 'Error al subir el archivo')
            }

            const docUrl = uploadJson.document.url

            // 2. Link to CRM Contact
            const createRes = await fetch('/api/client-documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create',
                    tenant_id: 1,
                    crm_contact_id: parseInt(selectedContact),
                    user_id: 1,
                    document_type: docType,
                    file_name: file.name,
                    file_size: file.size,
                    file_type: file.type,
                    url: docUrl,
                    category: category
                })
            })

            const createJson = await createRes.json()
            if (!createJson.success) {
                throw new Error(createJson.error || 'Error al enlazar el documento')
            }

            onSuccess()
        } catch (e: any) {
            setError(e.message || 'Error desconocido')
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Subir Documento</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Contacto / Cliente</label>
                        <select 
                            className="w-full border-gray-300 rounded-md text-sm p-2 border"
                            value={selectedContact}
                            onChange={(e) => setSelectedContact(e.target.value)}
                            disabled={loadingContacts}
                        >
                            <option value="">Selecciona un contacto...</option>
                            {contacts.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.first_name} {c.last_name} ({c.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tipo</label>
                            <select 
                                className="w-full border-gray-300 rounded-md text-sm p-2 border"
                                value={docType}
                                onChange={(e) => setDocType(e.target.value)}
                            >
                                {DOC_TYPES.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Categoría</label>
                            <select 
                                className="w-full border-gray-300 rounded-md text-sm p-2 border"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                {CATEGORIES.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Archivo</label>
                        {!file ? (
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-500">
                                    <UploadCloud className="w-8 h-8 mb-2 text-gray-400" />
                                    <p className="text-sm font-medium">Clic para seleccionar</p>
                                    <p className="text-xs">PDF, JPG, PNG (Max. 10MB)</p>
                                </div>
                                <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleFileChange} />
                            </label>
                        ) : (
                            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <FileIcon className="w-8 h-8 text-blue-500 flex-shrink-0" />
                                    <div className="truncate">
                                        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                        <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                </div>
                                <button onClick={() => setFile(null)} className="p-1 hover:bg-gray-200 rounded-full text-gray-500">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isUploading}>Cancelar</Button>
                    <Button onClick={handleUpload} disabled={isUploading || !file || !selectedContact}>
                        {isUploading ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Subiendo...</>
                        ) : 'Subir Documento'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
