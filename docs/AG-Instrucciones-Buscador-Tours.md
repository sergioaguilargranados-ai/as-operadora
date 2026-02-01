# Instrucciones para Agregar Buscador de Tours

## Paso 1: Agregar estado `tourSearch`

**Ubicación:** Después de la línea 48 (después de `const [rooms, setRooms] = useState(1)`)

**Código a agregar:**
```tsx
const [tourSearch, setTourSearch] = useState("")
```

---

## Paso 2: Modificar la sección de Tours y Viajes Grupales

**Ubicación:** Líneas 2539-2552

**Código ACTUAL:**
```tsx
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold">Ofertas en Tours y Viajes Grupales</h2>
                  <p className="text-gray-600 mt-1">Descubre el mundo con nuestros paquetes todo incluido</p>
                </div>
                <Button
                  variant="link"
                  className="text-[#0066FF] font-semibold"
                  onClick={() => router.push('/tours')}
                >
                  Ver todos los tours
                  <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
              </div>
```

**Código NUEVO:**
```tsx
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-3xl font-bold">Ofertas en Tours y Viajes Grupales</h2>
                    <p className="text-gray-600 mt-1">Descubre el mundo con nuestros paquetes todo incluido</p>
                  </div>
                  <Button
                    variant="link"
                    className="text-[#0066FF] font-semibold"
                    onClick={() => router.push('/tours')}
                  >
                    Ver todos los tours
                    <ChevronRight className="w-5 h-5 ml-1" />
                  </Button>
                </div>

                {/* Buscador de Tours */}
                <div className="max-w-2xl">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Buscar destino, país o tour..."
                      value={tourSearch}
                      onChange={(e) => setTourSearch(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && tourSearch.trim()) {
                          router.push(`/tours?search=${encodeURIComponent(tourSearch)}`)
                        }
                      }}
                      className="pl-12 pr-32 py-6 text-lg rounded-full border-2 border-gray-200 focus:border-blue-500 bg-white"
                    />
                    <Button
                      onClick={() => {
                        if (tourSearch.trim()) {
                          router.push(`/tours?search=${encodeURIComponent(tourSearch)}`)
                        }
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-8 py-5 bg-blue-600 hover:bg-blue-700"
                    >
                      Buscar
                    </Button>
                  </div>
                </div>
              </div>
```

---

## Resumen de Cambios

1. **Estado nuevo:** `tourSearch` para almacenar el texto de búsqueda
2. **Buscador:** Input con botón integrado que redirige a `/tours?search=TEXTO`
3. **Enter key:** Permite buscar presionando Enter
4. **Diseño:** Input redondeado con icono de búsqueda y botón azul

---

**¿Quieres que haga estos cambios automáticamente?**
