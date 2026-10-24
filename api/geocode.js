import {stateResult} from '../server/states.js'
import {respond} from '../server/database.js'
export async function GET(request){
 const url=new URL(request.url),q=url.searchParams.get('q')?.trim()
 if(!q||q.length>160)return respond({message:'Enter a U.S. city, ZIP code, state, or address.'},400)
 const state=stateResult(q);if(state)return respond(state,200,'public, s-maxage=86400')
 try{
  const endpoint=new URL(process.env.GEOCODER_URL||'https://nominatim.openstreetmap.org/search')
  endpoint.search=new URLSearchParams({q:/^\d{5}(-\d{4})?$/.test(q)?q.slice(0,5):q,format:'jsonv2',countrycodes:'us',addressdetails:'1',limit:'1'}).toString()
  const response=await fetch(endpoint,{headers:{'User-Agent':'PumpScout/2.0 (US station search)','Accept-Language':'en'},signal:AbortSignal.any([request.signal,AbortSignal.timeout(10000)])})
  if(!response.ok)return respond({message:'Location search is busy. Please try again shortly.'},503)
  const [place]=await response.json();if(!place)return respond({message:'No U.S. location found. Add a state name or try a ZIP code.'},404)
  if(place.address?.country_code!=='us')return respond({message:'Choose a location in the United States.'},400)
  const [south,north,west,east]=place.boundingbox.map(Number)
  return respond({label:place.display_name,bounds:[west,south,east,north],center:[Number(place.lat),Number(place.lon)],kind:'place'},200,'public, s-maxage=86400, stale-while-revalidate=604800')
 }catch(error){console.error('Geocoding failed:',error instanceof Error?error.message:'unknown');return respond({message:'Location search timed out. Please try again.'},503)}
}
