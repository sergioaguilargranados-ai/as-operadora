"use client"

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
    ChevronDown,
    ChevronUp,
    Star
} from 'lucide-react'

export interface RestaurantFiltersState {
    cuisine: string[]
    priceLevel: number[] // 1: Barato, 2: Moderado, 3: Caro, 4: Muy caro
    minRating: number
    openNow: boolean
}

interface RestaurantFiltersProps {
    filters: RestaurantFiltersState
    onFiltersChange: (filters: RestaurantFiltersState) => void
    totalResults: number
    filteredCount: number
}

const CUISINE_TYPES = [
    "Romántico", "Italiana", "Brunch", "Mexicana", "Pizza",
    "A base de mariscos", "Americana", "Divertido", "Japonesa",
    "Cumpleaños", "Sushi", "Filete", "Casual", "China",
    "Mediterránea", "India", "Grupos", "Alta cocina",
    "Apto para niños", "Tapas"
]

const PRICE_LEVELS = [
    { value: 1, label: '$ Económico' },
    { value: 2, label: '$$ Moderado' },
    { value: 3, label: '$$$ Caro' },
    { value: 4, label: '$$$$ Muy caro' },
]

export function RestaurantFilters({
    filters,
    onFiltersChange,
    totalResults,
    filteredCount
}: RestaurantFiltersProps) {
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        cuisine: true,
        price: true,
        rating: true,
        openNow: true
    })

    const toggleSection = (section: string) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
    }

    const updateFilter = <K extends keyof RestaurantFiltersState>(
        key: K,
        value: RestaurantFiltersState[K]
    ) => {
        onFiltersChange({ ...filters, [key]: value })
    }

    const toggleArrayFilter = (
        key: 'cuisine' | 'priceLevel',
        value: string | number
    ) => {
        const currentArray = filters[key] as (string | number)[]
        const newArray = currentArray.includes(value)
            ? currentArray.filter(v => v !== value)
            : [...currentArray, value]
        updateFilter(key, newArray as any)
    }

    const clearAllFilters = () => {
        onFiltersChange({
            cuisine: [],
            priceLevel: [],
            minRating: 0,
            openNow: false
        })
    }

    const activeFiltersCount =
        filters.cuisine.length +
        filters.priceLevel.length +
        (filters.minRating > 0 ? 1 : 0) +
        (filters.openNow ? 1 : 0)

    return (
        <Card className="p-4 sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b">
                <div>
                    <h2 className="font-bold text-lg">Filtrar por</h2>
                    <p className="text-xs text-muted-foreground">
                        {filteredCount} de {totalResults} restaurantes
                    </p>
                </div>
                {activeFiltersCount > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="text-xs text-blue-600 hover:text-blue-700"
                    >
                        Limpiar ({activeFiltersCount})
                    </Button>
                )}
            </div>

            {/* Abierto Ahora */}
            <div className="mb-4 pb-3 border-b">
                <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                    <Checkbox
                        checked={filters.openNow}
                        onCheckedChange={(checked) => updateFilter('openNow', !!checked)}
                    />
                    <span className="text-sm font-medium">Abierto ahora</span>
                </label>
            </div>

            {/* Tipos de Comida */}
            <Collapsible open={openSections.cuisine} onOpenChange={() => toggleSection('cuisine')}>
                <CollapsibleTrigger className="flex items-center justify-between w-full py-2 border-b">
                    <span className="font-semibold text-sm">Tipo de Comida</span>
                    {openSections.cuisine ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3 pb-4 space-y-2 max-h-60 overflow-y-auto">
                    {CUISINE_TYPES.map((type) => (
                        <label
                            key={type}
                            className={`flex items-center gap-3 cursor-pointer p-2 rounded-lg transition-colors ${filters.cuisine.includes(type) ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                                }`}
                        >
                            <Checkbox
                                checked={filters.cuisine.includes(type)}
                                onCheckedChange={() => toggleArrayFilter('cuisine', type)}
                            />
                            <span className="text-sm">{type}</span>
                        </label>
                    ))}
                </CollapsibleContent>
            </Collapsible>

            {/* Precio */}
            <Collapsible open={openSections.price} onOpenChange={() => toggleSection('price')}>
                <CollapsibleTrigger className="flex items-center justify-between w-full py-2 border-b">
                    <span className="font-semibold text-sm">Precio</span>
                    {openSections.price ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3 pb-4 space-y-2">
                    {PRICE_LEVELS.map((level) => (
                        <label
                            key={level.value}
                            className={`flex items-center justify-between cursor-pointer p-2 rounded-lg transition-colors ${filters.priceLevel.includes(level.value) ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Checkbox
                                    checked={filters.priceLevel.includes(level.value)}
                                    onCheckedChange={() => toggleArrayFilter('priceLevel', level.value)}
                                />
                                <span className="text-sm">{level.label}</span>
                            </div>
                        </label>
                    ))}
                </CollapsibleContent>
            </Collapsible>

            {/* Calificación */}
            <Collapsible open={openSections.rating} onOpenChange={() => toggleSection('rating')}>
                <CollapsibleTrigger className="flex items-center justify-between w-full py-2 border-b">
                    <span className="font-semibold text-sm">Puntuación</span>
                    {openSections.rating ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3 pb-4 space-y-2">
                    {[4.5, 4, 3.5, 3].map((rating) => (
                        <label
                            key={rating}
                            className={`flex items-center gap-3 cursor-pointer p-2 rounded-lg transition-colors ${filters.minRating === rating ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                                }`}
                        >
                            <input
                                type="radio"
                                name="rating"
                                checked={filters.minRating === rating}
                                onChange={() => updateFilter('minRating', rating)}
                                className="accent-blue-600"
                            />
                            <div className="flex items-center gap-1">
                                <span className="text-sm">{rating}+</span>
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            </div>
                        </label>
                    ))}
                    <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                        <input
                            type="radio"
                            name="rating"
                            checked={filters.minRating === 0}
                            onChange={() => updateFilter('minRating', 0)}
                            className="accent-blue-600"
                        />
                        <span className="text-sm">Cualquiera</span>
                    </label>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    )
}
