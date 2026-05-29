require('dotenv').config({path:'.env.local'})
const {Pool}=require('pg')
const p=new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}})
p.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='megatravel_packages' ORDER BY ordinal_position")
.then(r=>{
  console.log('=== Columnas megatravel_packages ===')
  r.rows.forEach(c=>console.log(`  ${c.column_name} (${c.data_type})`))
  return p.query("SELECT COUNT(*) as total, COUNT(CASE WHEN main_country IS NULL OR main_country='' THEN 1 END) as no_country, COUNT(CASE WHEN price_usd IS NULL OR price_usd=0 THEN 1 END) as no_price, COUNT(CASE WHEN days IS NULL OR days=0 THEN 1 END) as no_days FROM megatravel_packages")
}).then(r=>{
  console.log('\n=== Datos faltantes ===')
  const d=r.rows[0]
  console.log(`  Total: ${d.total}`)
  console.log(`  Sin país: ${d.no_country}`)
  console.log(`  Sin precio: ${d.no_price}`)
  console.log(`  Sin días: ${d.no_days}`)
  return p.query("SELECT main_country, COUNT(*) as c FROM megatravel_packages WHERE main_country IS NOT NULL AND main_country != '' GROUP BY main_country ORDER BY c DESC LIMIT 10")
}).then(r=>{
  console.log('\n=== Top 10 países ===')
  r.rows.forEach(x=>console.log(`  ${x.main_country}: ${x.c}`))
  return p.query("SELECT tour_code, SUBSTRING(title,1,40) as t, main_country, days, price_usd FROM megatravel_packages WHERE main_country IS NULL OR main_country='' LIMIT 5")
}).then(r=>{
  console.log('\n=== Sin país (muestra) ===')
  r.rows.forEach(x=>console.log(`  [${x.tour_code}] ${x.t} — ${x.days}d $${x.price_usd}`))
  return p.query("SELECT COUNT(DISTINCT package_id) as itin FROM megatravel_itinerary")
}).then(r=>{
  console.log(`\n  Itinerarios: ${r.rows[0].itin}`)
  return p.query("SELECT COUNT(DISTINCT package_id) as dep FROM megatravel_departures")
}).then(r=>{
  console.log(`  Fechas salida: ${r.rows[0].dep}`)
  p.end()
}).catch(e=>{console.error(e.message);p.end()})
