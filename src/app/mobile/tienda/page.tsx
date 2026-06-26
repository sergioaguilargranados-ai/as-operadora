"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, ShoppingCart, ChevronLeft, Loader2, Star } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface Product {
  id: number
  name: string
  description: string
  price: number
  offer_price: number | null
  image_url: string
  category: string
}

export default function MobileStorePage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      // Simulate API call for now. In real app, fetch from /api/store
      const res = await fetch("/api/store/products?tenantId=1")
      if (res.ok) {
        const data = await res.json()
        setProducts(data.data || [])
      } else {
        // Fallback mock data
        setProducts([
          {
            id: 1,
            name: "Kit de Viaje Premium",
            description: "Almohada cervical, antifaz, tapones y manta.",
            price: 499,
            offer_price: 399,
            image_url: "https://images.unsplash.com/photo-1550993077-0a427b235e16?auto=format&fit=crop&w=300&q=80",
            category: "Accesorios"
          },
          {
            id: 2,
            name: "Maleta de Cabina Rígida",
            description: "Maleta resistente con 4 ruedas 360°",
            price: 1299,
            offer_price: null,
            image_url: "https://images.unsplash.com/photo-1553531384-cc64ac80f931?auto=format&fit=crop&w=300&q=80",
            category: "Equipaje"
          }
        ])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/mobile")} className="-ml-2 text-gray-500">
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold text-gray-900">Tienda del Viajero</h1>
        </div>
        <div className="relative">
          <Button variant="ghost" size="icon" className="text-gray-500 relative">
            <ShoppingCart className="w-6 h-6" />
            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">2</span>
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="px-4 py-3 bg-white border-b">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          <Input 
            placeholder="Buscar productos..." 
            className="pl-10 bg-gray-100 border-transparent rounded-xl h-10 focus-visible:ring-[#0066FF]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#0066FF]" />
        </div>
      ) : (
        <div className="p-4 grid grid-cols-2 gap-4">
          {filteredProducts.map(product => (
            <div 
              key={product.id} 
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 active:scale-95 transition-transform cursor-pointer"
              onClick={() => router.push(`/mobile/tienda/${product.id}`)}
            >
              <div className="aspect-square bg-gray-100 relative">
                {product.offer_price && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-md z-10">
                    OFERTA
                  </div>
                )}
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-3">
                <h3 className="font-bold text-gray-900 text-sm line-clamp-2 leading-tight min-h-[40px]">{product.name}</h3>
                <div className="flex items-center gap-1 mt-1 mb-2">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  <span className="text-[10px] text-gray-500">4.8</span>
                </div>
                <div className="flex flex-col">
                  {product.offer_price ? (
                    <>
                      <span className="text-[10px] text-gray-400 line-through">${product.price.toLocaleString('es-MX')}</span>
                      <span className="font-extrabold text-[#0066FF] text-base">${product.offer_price.toLocaleString('es-MX')}</span>
                    </>
                  ) : (
                    <span className="font-extrabold text-[#0066FF] text-base">${product.price.toLocaleString('es-MX')}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
