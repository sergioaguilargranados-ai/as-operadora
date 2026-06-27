import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

const mockDetailedActivities: Record<string, any> = {
  "civ-1": {
    id: "civ-1",
    title: "Visita guiada por el Coliseo, Foro y Palatino",
    destination: "Roma",
    image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&h=600&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1531572753322-ad011cfce45d?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1542820229-081e0c12af0b?w=800&h=600&fit=crop"
    ],
    price: 45,
    currency: "EUR",
    duration: "3h",
    rating: 4.8,
    reviews: 15400,
    description: "Recorre la Roma Antigua descubriendo el Coliseo, el Foro Romano y la colina del Palatino con un guía experto en historia de Roma.",
    itinerary: "Comenzaremos la visita en la entrada del Coliseo, donde evitaremos las colas. Tras conocer la historia de los gladiadores, caminaremos hacia el Foro Romano, el corazón de la antigua ciudad, para finalmente ascender a la colina del Palatino, lugar de residencia de los emperadores.",
    includes: [
      "Guía oficial de habla hispana",
      "Entrada sin colas al Coliseo",
      "Entrada sin colas al Foro y Palatino",
      "Auriculares para escuchar mejor al guía"
    ],
    not_includes: [
      "Comida y bebida",
      "Transporte al punto de encuentro"
    ],
    meeting_point: "Arco de Constantino, junto al Coliseo.",
    cancellation_policy: "¡Gratis! Cancela sin gastos hasta 24 horas antes de la actividad.",
    available_dates: ["2026-06-28", "2026-06-29", "2026-06-30", "2026-07-01", "2026-07-02", "2026-07-03"],
    pricing_categories: [
      { id: "adult", name: "Adultos (mayores de 18 años)", price: 45 },
      { id: "child", name: "Niños (6 a 17 años)", price: 30 },
      { id: "infant", name: "Menores de 6 años", price: 0 }
    ]
  },
  "civ-2": {
    id: "civ-2",
    title: "Paseo en barco por el Sena",
    destination: "París",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=600&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1522093007474-d86e9bf7ba6f?w=800&h=600&fit=crop"
    ],
    price: 18,
    currency: "EUR",
    duration: "1h",
    rating: 4.5,
    reviews: 8900,
    description: "Disfruta de las mejores vistas de París con un relajante paseo en barco panorámico por el río Sena.",
    itinerary: "Embárcate a los pies de la Torre Eiffel para un recorrido de una hora donde podrás admirar el Museo de Orsay, Notre Dame, el Louvre y muchos más monumentos iluminados (o de día).",
    includes: [
      "Paseo en barco panorámico de 1 hora",
      "Audioguía en español (app o a bordo)"
    ],
    not_includes: [
      "Recogida en el hotel"
    ],
    meeting_point: "Port de la Bourdonnais (al pie de la Torre Eiffel).",
    cancellation_policy: "¡Gratis! Cancela sin gastos hasta 24 horas antes de la actividad.",
    available_dates: ["2026-06-28", "2026-06-29", "2026-06-30", "2026-07-01", "2026-07-02", "2026-07-03"],
    pricing_categories: [
      { id: "adult", name: "Adultos (mayores de 12 años)", price: 18 },
      { id: "child", name: "Niños (4 a 11 años)", price: 9 },
      { id: "infant", name: "Menores de 4 años", price: 0 }
    ]
  }
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    // Si no lo tenemos detallado, usamos el de Roma como genérico para la demo
    let activity = mockDetailedActivities[id];
    
    if (!activity) {
      // Create a generic detailed response for the other mock activities
      activity = {
        id: id,
        title: "Actividad Seleccionada",
        destination: "Destino",
        image: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&h=600&fit=crop",
        gallery: [
          "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&h=600&fit=crop"
        ],
        price: 50,
        currency: "USD",
        duration: "4h",
        rating: 4.5,
        reviews: 1200,
        description: "Una experiencia inolvidable en tu destino. Explora los mejores lugares con esta actividad completa y recomendada.",
        itinerary: "El recorrido comienza en el punto de encuentro central, desde donde partiremos a descubrir las maravillas locales durante el tiempo establecido de la actividad.",
        includes: ["Guía en español", "Entradas a atracciones mencionadas"],
        not_includes: ["Comida y bebida", "Propinas"],
        meeting_point: "Plaza Central de la Ciudad.",
        cancellation_policy: "¡Gratis! Cancela sin gastos hasta 24 horas antes.",
        available_dates: ["2026-06-28", "2026-06-29", "2026-06-30", "2026-07-01", "2026-07-02", "2026-07-03"],
        pricing_categories: [
          { id: "adult", name: "Adultos", price: 50 },
          { id: "child", name: "Niños", price: 30 }
        ]
      }
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json({
      success: true,
      data: activity
    });

  } catch (error) {
    console.error('Error fetching mock Civitatis activity detail:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al consultar detalle del tour'
    }, { status: 500 });
  }
}
