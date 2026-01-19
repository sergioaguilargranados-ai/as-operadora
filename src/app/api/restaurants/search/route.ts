import { NextResponse } from 'next/server'

// MOCK DATA para cuando no hay API Key o para pruebas
const MOCK_RESTAURANTS = [
    {
        place_id: "mock-1",
        name: "La Bella Italia",
        photos: [{ photo_reference: "mock_photo_1" }],
        rating: 4.8,
        user_ratings_total: 1250,
        price_level: 2,
        vicinity: "Av. Reforma 123, Ciudad de México",
        geometry: { location: { lat: 19.4326, lng: -99.1332 } },
        opening_hours: { open_now: true },
        types: ["restaurant", "food", "point_of_interest", "establishment"],
        cuisine: ["Italiana", "Pizza", "Romántico"] // Campo enriquecido manualmente en el mock
    },
    {
        place_id: "mock-2",
        name: "El Tizoncito",
        photos: [{ photo_reference: "mock_photo_2" }],
        rating: 4.5,
        user_ratings_total: 3200,
        price_level: 1,
        vicinity: "Condesa, Ciudad de México",
        geometry: { location: { lat: 19.4126, lng: -99.1732 } },
        opening_hours: { open_now: true },
        types: ["restaurant", "food"],
        cuisine: ["Mexicana", "Tacos", "Casual"]
    },
    {
        place_id: "mock-3",
        name: "Suntory Lomas",
        photos: [{ photo_reference: "mock_photo_3" }],
        rating: 4.9,
        user_ratings_total: 850,
        price_level: 4,
        vicinity: "Lomas de Chapultepec, Ciudad de México",
        geometry: { location: { lat: 19.4226, lng: -99.2032 } },
        opening_hours: { open_now: false },
        types: ["restaurant", "food"],
        cuisine: ["Japonesa", "Sushi", "Alta cocina", "Romántico"]
    },
    {
        place_id: "mock-4",
        name: "Sonora Grill Prime",
        photos: [{ photo_reference: "mock_photo_4" }],
        rating: 4.7,
        user_ratings_total: 2100,
        price_level: 3,
        vicinity: "Polanco, Ciudad de México",
        geometry: { location: { lat: 19.4350, lng: -99.1950 } },
        opening_hours: { open_now: true },
        types: ["restaurant", "food"],
        cuisine: ["Filete", "Americana", "Grupos"]
    },
    {
        place_id: "mock-5",
        name: "Fisher's",
        photos: [{ photo_reference: "mock_photo_5" }],
        rating: 4.6,
        user_ratings_total: 4500,
        price_level: 2,
        vicinity: "Roma Norte, Ciudad de México",
        geometry: { location: { lat: 19.4180, lng: -99.1630 } },
        opening_hours: { open_now: true },
        types: ["restaurant", "food"],
        cuisine: ["A base de mariscos", "Divertido", "Casual", "Cumpleaños"]
    }
];

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query') || searchParams.get('city') // Support 'city' param too

    // API KEY del servidor (segura)
    const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY

    // Log para depuración
    console.log(`[API Restaurants] Search Query: ${query}`)
    console.log(`[API Restaurants] API Key configured: ${!!apiKey}`)

    // Si no hay API Key, usamos Mock Data en lugar de error
    if (!apiKey) {
        console.warn("⚠️ API KEY faltante. Usando MOCK_DATA.")
        return NextResponse.json({
            results: MOCK_RESTAURANTS,
            status: "OK",
            source: "MOCK (No Key)"
        })
    }

    try {
        // 1. Text Search (Google Places API New - v1)
        const searchText = query ? `restaurantes en ${query}` : 'restaurantes populares'
        const url = 'https://places.googleapis.com/v1/places:searchText'

        const requestBody = {
            textQuery: searchText,
            languageCode: 'es',
            maxResultCount: 20
        }

        const fieldMask = [
            'places.id',
            'places.displayName',
            'places.formattedAddress',
            'places.priceLevel',
            'places.rating',
            'places.userRatingCount',
            'places.location',
            'places.photos',
            'places.types',
            'places.regularOpeningHours'
        ].join(',')

        // Log URL (sin key)
        console.log(`[API Restaurants] Fetching from Google (New API): ${url}`)

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': fieldMask
            },
            body: JSON.stringify(requestBody)
        })

        const data = await response.json()

        if (!response.ok) {
            console.error('Google Places API Error:', data)
            throw new Error(data.error ? data.error.message : `API Error: ${response.status}`)
        }

        // Mapear resultados (Formato v1 a Formato App)
        const results = (data.places || []).map((place: any) => ({
            place_id: place.id,
            name: place.displayName?.text || 'Restaurante',
            photos: (place.photos || []).map((p: any) => ({ photo_reference: p.name })), // En v1 'name' es el recurso de la foto
            rating: place.rating,
            user_ratings_total: place.userRatingCount,
            price_level: place.priceLevel ? (place.priceLevel === 'PRICE_LEVEL_EXPENSIVE' ? 4 : place.priceLevel === 'PRICE_LEVEL_CHEAP' ? 1 : 2) : 2,
            vicinity: place.formattedAddress,
            geometry: { location: { lat: place.location?.latitude, lng: place.location?.longitude } },
            opening_hours: { open_now: place.regularOpeningHours?.openNow },
            types: place.types,
            cuisine: place.types
        }))

        console.log(`[API Restaurants] Found ${results.length} results`)

        return NextResponse.json({
            results: results,
            status: "OK",
            source: "GOOGLE_V1"
        })

    } catch (error) {
        console.error('Error en API de Restaurantes:', error)
        // Fallback a Mock Data en caso de error de API o Red
        console.warn("⚠️ Error en Fetch Google Places. Usando MOCK_DATA fallback.")
        return NextResponse.json({
            results: MOCK_RESTAURANTS,
            status: "OK",
            source: "MOCK (Fallback)"
        })
    }
}
