"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ShoppingCart, Star, Share2, Plus, Minus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface Product {
  id: number
  name: string
  description: string
  price: number
  offer_price: number | null
  image_url: string
  category: string
}

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    fetchProduct()
  }, [])

  const fetchProduct = async () => {
    try {
      // Simulate API call
      // const res = await fetch(`/api/store/products/${params.id}`)
      await new Promise(r => setTimeout(r, 500))
      
      setProduct({
        id: parseInt(params.id),
        name: params.id === '2' ? "Maleta de Cabina Rígida" : "Kit de Viaje Premium",
        description: "Diseñado para brindar el máximo confort durante tus vuelos. Incluye una almohada cervical viscoelástica, antifaz bloqueador de luz, tapones para los oídos y una manta ultra suave de viaje. Ideal para viajes largos en avión o tren.",
        price: params.id === '2' ? 1299 : 499,
        offer_price: params.id === '2' ? null : 399,
        image_url: params.id === '2' ? "https://images.unsplash.com/photo-1553531384-cc64ac80f931?auto=format&fit=crop&w=600&q=80" : "https://images.unsplash.com/photo-1550993077-0a427b235e16?auto=format&fit=crop&w=600&q=80",
        category: params.id === '2' ? "Equipaje" : "Accesorios"
      })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = () => {
    toast({
      title: "Agregado al carrito",
      description: `${quantity}x ${product?.name} añadido exitosamente.`
    })
    router.push('/mobile/tienda')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0066FF]" />
      </div>
    )
  }

  if (!product) return null

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
        <Button variant="secondary" size="icon" onClick={() => router.back()} className="rounded-full bg-white/80 backdrop-blur shadow-sm">
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <div className="flex gap-2">
          <Button variant="secondary" size="icon" className="rounded-full bg-white/80 backdrop-blur shadow-sm">
            <Share2 className="w-5 h-5" />
          </Button>
          <Button variant="secondary" size="icon" className="rounded-full bg-white/80 backdrop-blur shadow-sm relative">
            <ShoppingCart className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">2</span>
          </Button>
        </div>
      </div>

      {/* Product Image */}
      <div className="w-full h-80 bg-gray-200 relative">
        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
      </div>

      {/* Details */}
      <div className="bg-white rounded-t-3xl -mt-6 relative z-10 p-6 shadow-sm">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <span className="text-[#0066FF] text-xs font-bold uppercase tracking-wider">{product.category}</span>
            <h1 className="text-2xl font-bold text-gray-900 mt-1 leading-tight">{product.name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <div className="flex text-yellow-400">
            <Star className="w-4 h-4 fill-current" />
            <Star className="w-4 h-4 fill-current" />
            <Star className="w-4 h-4 fill-current" />
            <Star className="w-4 h-4 fill-current" />
            <Star className="w-4 h-4 fill-current" />
          </div>
          <span className="text-sm text-gray-500 font-medium">5.0 (24 reseñas)</span>
        </div>

        <div className="flex items-end gap-3 mb-6">
          {product.offer_price ? (
            <>
              <span className="text-3xl font-extrabold text-[#0066FF]">${product.offer_price.toLocaleString('es-MX')}</span>
              <span className="text-lg text-gray-400 line-through mb-1">${product.price.toLocaleString('es-MX')}</span>
            </>
          ) : (
            <span className="text-3xl font-extrabold text-[#0066FF]">${product.price.toLocaleString('es-MX')}</span>
          )}
        </div>

        <div>
          <h3 className="font-bold text-gray-900 mb-2">Descripción del Producto</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            {product.description}
          </p>
        </div>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex items-center gap-4 z-20">
        <div className="flex items-center justify-between border rounded-xl p-1 bg-gray-50">
          <Button variant="ghost" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="h-10 w-10 text-gray-500 hover:text-gray-900">
            <Minus className="w-4 h-4" />
          </Button>
          <span className="w-10 text-center font-bold text-gray-900">{quantity}</span>
          <Button variant="ghost" size="icon" onClick={() => setQuantity(quantity + 1)} className="h-10 w-10 text-gray-500 hover:text-gray-900">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <Button 
          className="flex-1 h-12 bg-[#0066FF] hover:bg-blue-700 text-white font-bold rounded-xl text-lg shadow-lg shadow-blue-200"
          onClick={handleAddToCart}
        >
          Agregar al Carrito
        </Button>
      </div>
    </div>
  )
}
