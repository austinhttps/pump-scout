import {splitBounds} from './spatial.js'
export function overpassQuery(bounds){
 const boxes=splitBounds(bounds).map(([w,s,e,n])=>'nwr["amenity"="fuel"](area.us)('+[s,w,n,e].join(',')+');').join('')
 return '[out:json][timeout:8];area["ISO3166-1"="US"]["admin_level"="2"]->.us;('+boxes+');out center tags qt;'
}
export function convertStations(elements){
 const seen=new Set()
 return elements.flatMap(el=>{
  const t=el.tags||{},lat=el.lat??el.center?.lat,lng=el.lon??el.center?.lon
  if(!Number.isFinite(lat)||!Number.isFinite(lng)||lat<18||lat>72)return []
  const brand=t.brand||t.operator||'Independent',name=t.name||t.brand||'Gas station'
  const dedupe=[name.toLowerCase(),lat.toFixed(4),lng.toFixed(4)].join(':')
  if(seen.has(dedupe))return [];seen.add(dedupe)
  const hasFuelTags=Object.keys(t).some(k=>k.startsWith('fuel:'))
  const fuelTags={regular:['fuel:octane_87','fuel:octane_91','fuel:gasoline'],midgrade:['fuel:octane_89'],premium:['fuel:octane_93','fuel:octane_95','fuel:octane_98'],diesel:['fuel:diesel'],e85:['fuel:e85']}
  const fuels=hasFuelTags?Object.entries(fuelTags).filter(([,keys])=>keys.some(k=>t[k]==='yes')).map(([fuel])=>fuel):undefined
  return [{id:'osm:'+el.type+':'+el.id,name,brand,address:[t['addr:housenumber'],t['addr:street']].filter(Boolean).join(' ')||'Street address not listed',city:t['addr:city']||'',state:t['addr:state']||'',zip:t['addr:postcode']||'',lat,lng,membership:t.membership==='yes'||/costco|sam.s club/i.test(brand+' '+name),...(fuels?.length?{fuels}:{}),prices:{},source:'openstreetmap'}]
 })
}
export async function discoverStations(bounds,signal){
 const endpoints=process.env.OVERPASS_URL?[process.env.OVERPASS_URL]:['https://overpass.private.coffee/api/interpreter','https://overpass-api.de/api/interpreter']
 for(const endpoint of endpoints){
  try{
   const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','User-Agent':'PumpScout/2.0 (US gas station directory)'},body:new URLSearchParams({data:overpassQuery(bounds)}),signal:signal?AbortSignal.any([signal,AbortSignal.timeout(11000)]):AbortSignal.timeout(11000)})
   if(!response.ok)continue
   const result=await response.json()
   if(result.remark)continue
   return convertStations(result.elements||[])
  }catch(error){if(signal?.aborted)throw error}
 }
 throw new Error('The public station directory is busy. Retry or zoom into a smaller area.')
}
