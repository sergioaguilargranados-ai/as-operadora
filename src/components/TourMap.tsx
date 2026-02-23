// Componente de mapa interactivo con marcadores para tours
// Build: 23 Feb 2026 - v2.326 - Mejorado geocoding y fallback

'use client'

import { useEffect, useRef, useState } from 'react'

// Declaración de tipos para Google Maps
declare global {
    interface Window {
        google: any
    }
}


interface TourMapProps {
    cities: string[]
    countries: string[]
    mainCountry: string
    tourName: string
}

export function TourMap({ cities, countries, mainCountry, tourName }: TourMapProps) {
    const mapRef = useRef<HTMLDivElement>(null)
    const googleMapRef = useRef<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [hasError, setHasError] = useState(false)

    useEffect(() => {
        // Cargar Google Maps API
        const loadGoogleMaps = () => {
            if (typeof (window as any).google !== 'undefined') {
                initMap()
                return
            }

            const script = document.createElement('script')
            script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDc8NB8nvcbY2OTv6Dcvzm7AwAbV7tPgF0&libraries=places`
            script.async = true
            script.defer = true
            script.onload = () => initMap()
            script.onerror = () => {
                setIsLoading(false)
                setHasError(true)
            }
            document.head.appendChild(script)
        }

        const initMap = async () => {
            if (!mapRef.current) return

            const google = (window as any).google
            if (!google) {
                setIsLoading(false)
                setHasError(true)
                return
            }

            // Determinar el contexto de país para geocoding
            // Si mainCountry es 'World' o vacío, usar el primer país disponible
            const countryContext = (mainCountry && mainCountry !== 'World')
                ? mainCountry
                : (countries && countries.length > 0 ? countries[0] : '')

            // Geocodificar las ciudades para obtener coordenadas
            const geocoder = new google.maps.Geocoder()
            const bounds = new google.maps.LatLngBounds()

            // Crear el mapa centrado en el país principal
            let centerLocation = { lat: 20, lng: 0 } // Default: centro del mundo
            try {
                if (countryContext) {
                    centerLocation = await geocodeLocation(geocoder, countryContext)
                }
            } catch {
                console.log('No se pudo geocodificar el país principal, usando default')
            }

            const map = new google.maps.Map(mapRef.current, {
                zoom: 5,
                center: centerLocation,
                mapTypeControl: true,
                streetViewControl: false,
                fullscreenControl: true,
                styles: [
                    {
                        featureType: 'poi',
                        elementType: 'labels',
                        stylers: [{ visibility: 'off' }]
                    }
                ]
            })

            googleMapRef.current = map

            // Agregar marcadores para cada ciudad
            let markersAdded = 0
            const cityPromises = cities.slice(0, 15).map(async (city, index) => {
                try {
                    // Intentar con contexto de país primero, luego sin él
                    let location
                    try {
                        const query = countryContext ? `${city}, ${countryContext}` : city
                        location = await geocodeLocation(geocoder, query)
                    } catch {
                        // Fallback: intentar sin contexto de país
                        try {
                            location = await geocodeLocation(geocoder, city)
                        } catch {
                            console.warn(`No se pudo geocodificar: ${city}`)
                            return null
                        }
                    }

                    // Crear marcador
                    const marker = new google.maps.Marker({
                        position: location,
                        map: map,
                        title: city,
                        label: {
                            text: `${index + 1}`,
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: 'bold'
                        },
                        icon: {
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 20,
                            fillColor: '#2563eb',
                            fillOpacity: 1,
                            strokeColor: 'white',
                            strokeWeight: 3
                        }
                    })

                    // Info window
                    const infoWindow = new google.maps.InfoWindow({
                        content: `
                            <div style="padding: 8px;">
                                <h3 style="margin: 0 0 4px 0; font-weight: bold; color: #1f2937;">${city}</h3>
                                <p style="margin: 0; color: #6b7280; font-size: 14px;">Parada ${index + 1} - ${tourName}</p>
                            </div>
                        `
                    })

                    marker.addListener('click', () => {
                        infoWindow.open(map, marker)
                    })

                    bounds.extend(location)
                    markersAdded++
                    return marker
                } catch (error) {
                    console.error(`Error geocoding ${city}:`, error)
                    return null
                }
            })

            await Promise.all(cityPromises)

            // Ajustar el mapa para mostrar todos los marcadores
            if (markersAdded > 1) {
                map.fitBounds(bounds)
            } else if (markersAdded === 1) {
                map.setZoom(8)
            }

            setIsLoading(false)
            if (markersAdded === 0) {
                setHasError(true)
            }
        }

        const geocodeLocation = (geocoder: any, address: string): Promise<any> => {
            return new Promise((resolve, reject) => {
                geocoder.geocode({ address }, (results: any, status: any) => {
                    if (status === 'OK' && results && results[0]) {
                        resolve(results[0].geometry.location)
                    } else {
                        reject(new Error(`Geocoding failed for "${address}": ${status}`))
                    }
                })
            })
        }

        loadGoogleMaps()
    }, [cities, countries, mainCountry, tourName])

    if (hasError && !isLoading) {
        return (
            <div className="w-full h-64 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <p className="text-center">
                    <span className="text-3xl block mb-2">🗺️</span>
                    Ciudades del tour: {cities.join(' → ')}
                </p>
            </div>
        )
    }

    return (
        <div className="relative">
            {isLoading && (
                <div className="absolute inset-0 z-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <div className="text-center text-gray-500">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                        Cargando mapa...
                    </div>
                </div>
            )}
            <div
                ref={mapRef}
                className="w-full h-96 rounded-xl overflow-hidden bg-gray-100"
                style={{ minHeight: '400px' }}
            />
        </div>
    )
}

