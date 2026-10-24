import {createHmac} from 'node:crypto'
import {validReport} from '../server/spatial.js'
import {sharedWritesReady,rpc,respond} from '../server/database.js'
export async function POST(request){
 try{
  if(request.headers.get('origin')&&request.headers.get('origin')!==new URL(request.url).origin)return respond({message:'Submit reports from the PumpScout website.'},403)
  if(!request.headers.get('content-type')?.includes('application/json'))return respond({message:'Send a JSON price report.'},415)
  const raw=await request.text()
  if(raw.length>4096)return respond({message:'This price report is too large.'},413)
  let input;try{input=JSON.parse(raw)}catch{return respond({message:'Invalid JSON report.'},400)}
  const body=validReport(input)
  if(!sharedWritesReady())return respond({message:'Shared storage is not connected. You can save this price in your browser.'},503)
  const ip=(request.headers.get('x-vercel-forwarded-for')||request.headers.get('x-forwarded-for')||'unknown').split(',')[0].trim()
  const day=new Date().toISOString().slice(0,10)
  const throttleKey=createHmac('sha256',process.env.REPORT_RATE_LIMIT_SALT).update(day+':'+ip).digest('hex')
  const report=await rpc('submit_public_price',{p_station_id:body.stationId,p_fuel:body.fuel,p_price:body.price,p_handle:body.handle,p_throttle_key:throttleKey},{write:true})
  return respond({report},201)
 }catch(error){const message=error instanceof Error?error.message:'Could not save price.';const limited=/wait|many reports|rate limit/i.test(message);const invalid=/valid|nickname|Choose|Enter|does not exist/.test(message);if(!limited&&!invalid)console.error('Public report failed:',message);return respond({message},limited?429:invalid?400:503)}
}
