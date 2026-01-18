import { PackageResult } from "@/app/api/packages/search/route"

/**
 * Adaptador para obtener y normalizar paquetes desde Mega Travel.
 * 
 * NOTA TÉCNICA:
 * Actualmente la integración simula la conexión ya que el sitio público de Mega Travel (vi.php)
 * utiliza rendering del lado del cliente (Next.js) protegido contra scraping simple.
 * 
 * Para pasar a PRODUCCIÓN, se recomienda una de las siguientes opciones:
 * 1. Solicitar a Mega Travel acceso a su Feed XML o API JSON oficial (común en B2B).
 * 2. Implementar un servicio de "Headless Browser" (Puppeteer) para renderizar y extraer datos reales.
 */
export class MegaTravelAdapter {
    private marginPercentage: number

    constructor(marginPercentage: number = 0.15) {
        this.marginPercentage = marginPercentage
    }

    /**
     * Busca paquetes en Mega Travel (Simulado)
     */
    async search(destination: string): Promise<PackageResult[]> {
        // En el futuro, aquí iría el fetch real a la API/Scraper
        // const html = await fetch(`https://www.megatravel.com.mx/tools/vi.php?Dest=...`).then(r => r.text())

        // Simulación de respuesta basada en los destinos más populares de Mega Travel
        const mockData = this.getMockDataForDestination(destination)

        // Procesar y aplicar margen
        return mockData.map(pkg => this.processPackage(pkg))
    }

    private processPackage(rawPkg: any): PackageResult {
        // Lógica de cálculo de precio
        const basePrice = rawPkg.price // Precio NETO (lo que nos cobra Mega Travel)
        const salesPrice = Math.ceil(basePrice * (1 + this.marginPercentage)) // Precio VENTA
        const savings = Math.round(salesPrice * 0.10) // Calculamos un ahorro ficticio de marketing

        return {
            id: `mt-${rawPkg.id}`,
            destination: rawPkg.title,
            city: rawPkg.cities[0] || rawPkg.title,
            country: rawPkg.country,
            duration: rawPkg.days,
            includes: ['flight', 'hotel', 'transfer', 'activities', 'insurance'], // Mega travel suele incluir esto básico
            hotel: {
                name: rawPkg.hotel || "Hotel Categoría Turista",
                stars: 4,
                rating: 4.5,
                image: rawPkg.image, // Usamos la misma imagen del paquete para el hotel por ahora
                mealPlan: "Desayuno incluido"
            },
            flight: {
                airline: "Aerolínea Regular",
                departureTime: "12:00",
                arrivalTime: "08:00+1",
                stops: 1
            },
            price: salesPrice,
            originalPrice: salesPrice + savings,
            currency: "USD", // Mega Travel cotiza mayormente en USD
            savings: savings,
            image: rawPkg.image,
            featured: rawPkg.featured || false,
            allInclusive: false
        }
    }

    private getMockDataForDestination(destination: string): any[] {
        const term = destination.toLowerCase()

        // Base de datos simulada de Mega Travel
        const db = [
            {
                id: "eur-01",
                title: "Europa Total",
                country: "Europa",
                cities: ["Madrid", "Bordeaux", "Paris", "Heidelberg", "Innsbruck", "Venecia", "Roma", "Florencia", "Niza", "Barcelona"],
                days: 17,
                price: 1899, // USD
                image: "https://images.unsplash.com/photo-1499856871940-a09627c6d7db?w=800",
                featured: true
            },
            {
                id: "eur-02",
                title: "Turquía de Ensueño",
                country: "Turquía",
                cities: ["Estambul", "Ankara", "Capadocia", "Pamukkale", "Éfeso", "Kusadasi"],
                days: 11,
                price: 999, // USD
                image: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800",
                featured: true
            },
            {
                id: "eur-03",
                title: "Mega Europa",
                country: "Europa",
                cities: ["Londres", "Paris", "Brujas", "Amsterdam", "Frankfurt"],
                days: 15,
                price: 2150, // USD
                image: "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?w=800",
                featured: false
            },
            {
                id: "usa-01",
                title: "Nueva York y Washington",
                country: "Estados Unidos",
                cities: ["Nueva York", "Filadelfia", "Washington"],
                days: 7,
                price: 1499, // USD
                image: "https://images.unsplash.com/photo-1496442226666-8d4a0e62e6e9?w=800",
                featured: true
            },
            {
                id: "per-01",
                title: "Perú Mágico",
                country: "Perú",
                cities: ["Lima", "Cusco", "Machu Picchu"],
                days: 6,
                price: 899, // USD
                image: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800",
                featured: false
            }
        ]

        // Filtrado simple
        if (!term || term === 'europa') return db.filter(p => p.country === 'Europa' || p.country === 'Turquía')

        return db.filter(p =>
            p.title.toLowerCase().includes(term) ||
            p.country.toLowerCase().includes(term) ||
            p.cities.some(c => c.toLowerCase().includes(term))
        )
    }
}
