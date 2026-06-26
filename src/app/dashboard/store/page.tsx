"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/PageHeader"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ExcelUploader } from "@/components/ui/ExcelUploader"
import { useToast } from "@/hooks/use-toast"
import { Download, Plus, Edit, Trash2, Loader2, ShoppingBag } from "lucide-react"

export default function StoreAdminPage() {
  const { toast } = useToast()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploader, setShowUploader] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/store/products?tenantId=1") // Simulate
      if (res.ok) {
        const data = await res.json()
        setProducts(data.data || [])
      } else {
        setProducts([
          { id: 1, name: "Kit de Viaje Premium", category: "Accesorios", price: 499, offer_price: 399, status: "active" },
          { id: 2, name: "Maleta de Cabina Rígida", category: "Equipaje", price: 1299, offer_price: null, status: "active" }
        ])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async (data: any[]) => {
    try {
      // En un entorno real se haría un POST a /api/store/products/import
      toast({ title: "Éxito", description: `${data.length} productos importados correctamente.` })
      setShowUploader(false)
      fetchProducts()
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <PageHeader showBackButton={true} backButtonHref="/dashboard">
        <div>
          <h1 className="text-xl font-bold">Administración de Tienda Online</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona el catálogo de productos de la PWA
          </p>
        </div>
      </PageHeader>

      <div className="flex justify-between items-center mb-6 mt-6">
        <h2 className="text-2xl font-bold">Catálogo de Productos</h2>
        <div className="flex gap-2">
          <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50" onClick={() => setShowUploader(true)}>
            <Download className="w-4 h-4 mr-2" />
            Importar Excel
          </Button>
          <Button className="bg-[#0066FF] hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>
      </div>

      <Dialog open={showUploader} onOpenChange={setShowUploader}>
        <DialogContent className="sm:max-w-[600px] bg-white">
          <DialogHeader>
            <DialogTitle>Importar Catálogo de Tienda</DialogTitle>
          </DialogHeader>
          <ExcelUploader 
            onUpload={handleImport} 
            expectedColumns={['name', 'description', 'price', 'offer_price', 'image_url', 'category', 'status']} 
            templateName="Plantilla_Tienda" 
            buttonText="Importar Productos"
          />
        </DialogContent>
      </Dialog>

      <Card className="bg-white border rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#0066FF]" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Precio Base</TableHead>
                  <TableHead>Precio Oferta</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No hay productos en el catálogo
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">#{p.id}</TableCell>
                      <TableCell>{p.name}</TableCell>
                      <TableCell>{p.category}</TableCell>
                      <TableCell>${p.price}</TableCell>
                      <TableCell>{p.offer_price ? <span className="text-green-600 font-bold">${p.offer_price}</span> : "-"}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          {p.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-800">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  )
}
