import { NextRequest, NextResponse } from 'next/server';

const mockDestinations = [
  {
    id: "dest-1",
    name: "Roma",
    country: "Italia",
    slug: "roma",
    image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&h=600&fit=crop",
    description: "Coliseo, Vaticano y más",
    activities: 150
  },
  {
    id: "dest-2",
    name: "París",
    country: "Francia",
    slug: "paris",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=600&fit=crop",
    description: "Torre Eiffel, Louvre, Versalles",
    activities: 200
  },
  {
    id: "dest-3",
    name: "Madrid",
    country: "España",
    slug: "madrid",
    image: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&h=600&fit=crop",
    description: "Prado, Palacio Real, Toledo",
    activities: 120
  },
  {
    id: "dest-4",
    name: "Barcelona",
    country: "España",
    slug: "barcelona",
    image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&h=600&fit=crop",
    description: "Sagrada Familia, Park Güell",
    activities: 180
  },
  {
    id: "dest-5",
    name: "Nueva York",
    country: "Estados Unidos",
    slug: "nueva-york",
    image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=600&fit=crop",
    description: "Estatua de la Libertad, Broadway",
    activities: 250
  },
  {
    id: "dest-6",
    name: "Londres",
    country: "Reino Unido",
    slug: "londres",
    image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=600&fit=crop",
    description: "Big Ben, Tower Bridge, Museos",
    activities: 220
  },
  {
    id: "dest-7",
    name: "Cancún",
    country: "México",
    slug: "cancun",
    image: "https://images.unsplash.com/photo-1568402102990-bc541580b59f?w=800&h=600&fit=crop",
    description: "Playas, Chichén Itzá, Cenotes",
    activities: 90
  }
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q')?.toLowerCase() || '';

    let filtered = mockDestinations;
    if (query) {
      filtered = mockDestinations.filter(d => d.name.toLowerCase().includes(query) || d.country.toLowerCase().includes(query));
    }

    await new Promise(resolve => setTimeout(resolve, 300));

    return NextResponse.json({
      success: true,
      data: filtered
    });

  } catch (error) {
    console.error('Error fetching mock Civitatis destinations:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al consultar destinos'
    }, { status: 500 });
  }
}
