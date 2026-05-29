// Backfill de main_country para tours que no lo tienen
// Estrategia: Inferir país desde el nombre del tour o desde las ciudades
require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

// Mapeo de palabras clave → país
const COUNTRY_KEYWORDS = {
  // Europa
  'España': ['españa', 'madrid', 'barcelona', 'sevilla', 'granada', 'andalucia', 'andalucía', 'ibérica', 'iberica'],
  'Francia': ['francia', 'paris', 'parís', 'lyon', 'marsella', 'niza', 'provenza'],
  'Italia': ['italia', 'roma', 'venecia', 'florencia', 'milán', 'milan', 'toscana', 'napoles', 'nápoles', 'sicilia', 'capri', 'amalfi'],
  'Inglaterra': ['inglaterra', 'londres', 'london', 'reino unido', 'escocia', 'edimburgo', 'gales', 'britanico', 'británico', 'gran bretaña'],
  'Alemania': ['alemania', 'berlin', 'berlín', 'munich', 'múnich', 'frankfurt'],
  'Portugal': ['portugal', 'lisboa', 'oporto', 'porto', 'fátima', 'fatima'],
  'Grecia': ['grecia', 'atenas', 'santorini', 'mykonos', 'creta'],
  'Suiza': ['suiza', 'zurich', 'zúrich', 'ginebra', 'berna', 'lucerna', 'interlaken'],
  'Holanda': ['holanda', 'amsterdam', 'ámsterdam', 'paises bajos', 'países bajos'],
  'Bélgica': ['bélgica', 'belgica', 'bruselas', 'brujas'],
  'Austria': ['austria', 'viena', 'salzburgo'],
  'Croacia': ['croacia', 'dubrovnik', 'split', 'zagreb'],
  'Chequia': ['chequia', 'praga', 'república checa', 'republica checa'],
  'Hungría': ['hungría', 'hungria', 'budapest'],
  'Polonia': ['polonia', 'varsovia', 'cracovia'],
  'Irlanda': ['irlanda', 'dublin', 'dublín'],
  'Noruega': ['noruega', 'oslo', 'fiordos', 'fjordos'],
  'Suecia': ['suecia', 'estocolmo'],
  'Dinamarca': ['dinamarca', 'copenhague'],
  'Finlandia': ['finlandia', 'helsinki', 'laponia'],
  'Islandia': ['islandia', 'reikiavik', 'reykjavik'],
  'Rusia': ['rusia', 'moscú', 'moscu', 'san petersburgo'],
  'Turquía': ['turquía', 'turquia', 'estambul', 'istanbul', 'capadocia'],
  // Asia
  'Japón': ['japón', 'japon', 'tokio', 'tokyo', 'kioto', 'kyoto', 'osaka'],
  'China': ['china', 'pekin', 'pekín', 'beijing', 'shanghai', 'gran muralla'],
  'India': ['india', 'delhi', 'agra', 'taj mahal', 'rajasthan', 'bombay', 'mumbai', 'jaipur'],
  'Tailandia': ['tailandia', 'bangkok', 'phuket', 'chiang mai'],
  'Vietnam': ['vietnam', 'hanoi', 'ho chi minh', 'saigon'],
  'Corea del Sur': ['corea', 'seúl', 'seul', 'busan'],
  'Emiratos Árabes': ['emiratos', 'dubai', 'dubái', 'abu dhabi'],
  'Israel': ['israel', 'jerusalén', 'jerusalem', 'tel aviv', 'tierra santa'],
  'Jordania': ['jordania', 'petra', 'amman', 'ammán'],
  // África
  'Egipto': ['egipto', 'cairo', 'el cairo', 'pirámides', 'piramides', 'luxor', 'nilo'],
  'Marruecos': ['marruecos', 'marrakech', 'fez', 'casablanca'],
  'Sudáfrica': ['sudáfrica', 'sudafrica', 'johannesburgo', 'ciudad del cabo', 'cape town'],
  'Kenia': ['kenia', 'kenya', 'nairobi', 'safari'],
  'Tanzania': ['tanzania', 'kilimanjaro', 'serengeti'],
  // América
  'Estados Unidos': ['estados unidos', 'nueva york', 'new york', 'los angeles', 'los ángeles', 'miami', 'las vegas', 'san francisco', 'washington', 'chicago', 'orlando', 'hawaii', 'hawái'],
  'Canadá': ['canadá', 'canada', 'toronto', 'vancouver', 'montreal', 'quebec', 'ottawa'],
  'México': ['méxico', 'mexico', 'cancún', 'cancun', 'riviera maya', 'playa del carmen'],
  'Perú': ['perú', 'peru', 'lima', 'cusco', 'cuzco', 'machu picchu'],
  'Brasil': ['brasil', 'río de janeiro', 'rio de janeiro', 'sao paulo', 'são paulo'],
  'Argentina': ['argentina', 'buenos aires', 'patagonia', 'iguazú', 'iguazu', 'mendoza'],
  'Colombia': ['colombia', 'bogotá', 'bogota', 'cartagena', 'medellín', 'medellin'],
  'Chile': ['chile', 'santiago', 'atacama', 'torres del paine'],
  'Cuba': ['cuba', 'habana', 'la habana'],
  'Costa Rica': ['costa rica', 'san josé'],
  'Panamá': ['panamá', 'panama'],
  // Oceanía
  'Australia': ['australia', 'sídney', 'sidney', 'sydney', 'melbourne'],
  'Nueva Zelanda': ['nueva zelanda', 'new zealand', 'auckland'],
}

// Mapeo de regiones/categorías → posible país
const REGION_KEYWORDS = {
  'Europa': ['europa', 'europeo', 'mediterráneo', 'mediterraneo', 'báltico', 'baltico', 'escandinavia', 'balcanes'],
  'Asia': ['asia', 'oriental', 'asiático', 'asiatico', 'oriente'],
  'América': ['sudamérica', 'sudamerica', 'centroamérica', 'centroamerica', 'norteamérica', 'norteamerica', 'caribe'],
  'África': ['áfrica', 'africa', 'africano'],
  'Oceanía': ['oceanía', 'oceania'],
  'Medio Oriente': ['medio oriente', 'oriente medio'],
}

function inferCountry(name, cities, countries) {
  const searchText = (name || '').toLowerCase()
  
  // Si countries ya tiene datos, usar el primero
  if (countries && Array.isArray(countries) && countries.length > 0 && countries[0]) {
    return countries[0]
  }
  
  // Buscar en el nombre del tour
  for (const [country, keywords] of Object.entries(COUNTRY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (searchText.includes(keyword)) {
        return country
      }
    }
  }
  
  // Buscar en ciudades
  if (cities && Array.isArray(cities)) {
    for (const city of cities) {
      const cityLower = (city || '').toLowerCase()
      for (const [country, keywords] of Object.entries(COUNTRY_KEYWORDS)) {
        for (const keyword of keywords) {
          if (cityLower.includes(keyword)) {
            return country
          }
        }
      }
    }
  }
  
  return null
}

async function backfill() {
  try {
    // Obtener tours sin país
    const tours = await pool.query(`
      SELECT id, name, cities, countries, destination_region 
      FROM megatravel_packages 
      WHERE main_country IS NULL OR main_country = ''
    `)
    
    console.log(`📊 Tours sin país: ${tours.rows.length}\n`)
    
    let updated = 0
    let notFound = 0
    
    for (const tour of tours.rows) {
      const country = inferCountry(tour.name, tour.cities, tour.countries)
      
      if (country) {
        await pool.query('UPDATE megatravel_packages SET main_country = $1 WHERE id = $2', [country, tour.id])
        updated++
        if (updated <= 10) {
          console.log(`  ✅ [${tour.id}] "${tour.name?.substring(0, 50)}" → ${country}`)
        }
      } else {
        notFound++
        if (notFound <= 5) {
          console.log(`  ❌ No se pudo inferir: "${tour.name?.substring(0, 60)}"`)
        }
      }
    }
    
    if (updated > 10) console.log(`  ... y ${updated - 10} más`)
    
    console.log(`\n═══════════════════════════════════════════════════`)
    console.log(`📊 Resultado: ${updated} actualizados, ${notFound} sin inferir`)
    console.log(`═══════════════════════════════════════════════════`)
    
    // Verificar restantes
    const remaining = await pool.query(`
      SELECT COUNT(*) as c FROM megatravel_packages 
      WHERE main_country IS NULL OR main_country = ''
    `)
    console.log(`\n  Tours sin país después del backfill: ${remaining.rows[0].c}`)
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await pool.end()
  }
}

backfill()
