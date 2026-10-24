import test from 'node:test'
import assert from 'node:assert/strict'
import {GET as stations} from '../api/stations.js'
import {POST as reports} from '../api/reports.js'
import {GET as geocode} from '../api/geocode.js'
const envNames=['SUPABASE_URL','SUPABASE_ANON_KEY','SUPABASE_PUBLISHABLE_KEY','SUPABASE_SERVICE_ROLE_KEY','REPORT_RATE_LIMIT_SALT']
async function isolated(fn:()=>Promise<void>){const old=Object.fromEntries(envNames.map(k=>[k,process.env[k]])),fetcher=globalThis.fetch;envNames.forEach(k=>delete process.env[k]);try{await fn()}finally{globalThis.fetch=fetcher;for(const [k,v]of Object.entries(old)){if(v===undefined)delete process.env[k];else process.env[k]=v}}}
test('national overview never falls back to fabricated Raleigh stations',()=>isolated(async()=>{
 const response=await stations(new Request('https://pumpscout.test/api/stations?min_long=-180&min_lat=18&max_long=180&max_lat=72&zoom=3'))
 assert.equal(response.status,200);const data=await response.json();assert.equal(data.overview,true);assert.deepEqual(data.stations,[]);assert.equal(data.sharedReports,false)
}))
test('city viewport discovers real OSM stations with longitude/latitude in correct order',()=>isolated(async()=>{
 let query='';globalThis.fetch=async(_url,options)=>{query=String(options?.body);return Response.json({elements:[{type:'node',id:123,lat:47.6,lon:-122.33,tags:{amenity:'fuel',name:'Example station',brand:'Shell'}}]})}
 const response=await stations(new Request('https://pumpscout.test/api/stations?min_long=-123&min_lat=47&max_long=-122&max_lat=48&zoom=12'))
 const data=await response.json();assert.equal(response.status,200);assert.equal(data.stations[0].id,'osm:node:123');assert.deepEqual(data.stations[0].prices,{})
 assert.match(decodeURIComponent(query),/47,-123,48,-122/);assert.match(decodeURIComponent(query),/ISO3166-1/);assert.equal(data.source,'openstreetmap')
}))
test('database proxy forwards exact active bounds and keyset cursor',()=>isolated(async()=>{
 process.env.SUPABASE_URL='https://database.test';process.env.SUPABASE_ANON_KEY='test-key';let body:Record<string,unknown>={}
 globalThis.fetch=async(url,options)=>{assert.match(String(url),/rpc\/stations_in_view$/);body=JSON.parse(String(options?.body));return Response.json({stations:[],nextCursor:'osm:node:500'})}
 const response=await stations(new Request('https://pumpscout.test/api/stations?min_long=170&min_lat=50&max_long=-130&max_lat=72&zoom=10&cursor=osm:node:1'))
 const data=await response.json();assert.equal(body.min_long,170);assert.equal(body.max_long,-130);assert.equal(body.after_id,'osm:node:1');assert.equal(data.nextCursor,'osm:node:500')
}))
test('invalid viewports return 400 instead of triggering an expensive upstream call',()=>isolated(async()=>{
 globalThis.fetch=async()=>{throw new Error('Should not fetch')}
 assert.equal((await stations(new Request('https://pumpscout.test/api/stations?zoom=5'))).status,400)
}))
test('anonymous public report uses server validation and a salted rate key, without a user session',()=>isolated(async()=>{
 process.env.SUPABASE_URL='https://database.test';process.env.SUPABASE_ANON_KEY='public-test';process.env.SUPABASE_SERVICE_ROLE_KEY='private-test';process.env.REPORT_RATE_LIMIT_SALT='test-only-salt';let payload:Record<string,string>={}
 globalThis.fetch=async(_url,options)=>{payload=JSON.parse(String(options?.body));return Response.json({id:'report-1',price:3.09})}
 const response=await reports(new Request('https://pumpscout.test/api/reports',{method:'POST',headers:{'Content-Type':'application/json','x-forwarded-for':'192.0.2.1'},body:JSON.stringify({stationId:'osm:node:123',fuel:'regular',price:3.09})}))
 assert.equal(response.status,201);assert.equal(payload.p_handle,'Anonymous');assert.match(payload.p_throttle_key,/^[a-f0-9]{64}$/);assert.equal(JSON.stringify(payload).includes('192.0.2.1'),false);assert.equal('author_id' in payload,false)
}))
test('missing shared storage is explicit, not a login requirement',()=>isolated(async()=>{
 const response=await reports(new Request('https://pumpscout.test/api/reports',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({stationId:'osm:node:1',fuel:'regular',price:3})}))
 assert.equal(response.status,503);assert.match((await response.json()).message,/browser/)
}))
test('a real database rate-limit error produces 429',()=>isolated(async()=>{
 process.env.SUPABASE_URL='https://database.test';process.env.SUPABASE_ANON_KEY='test';process.env.SUPABASE_SERVICE_ROLE_KEY='test';process.env.REPORT_RATE_LIMIT_SALT='test'
 globalThis.fetch=async()=>Response.json({message:'Too many reports. Please wait a minute.'},{status:400})
 const response=await reports(new Request('https://pumpscout.test/api/reports',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({stationId:'osm:node:1',fuel:'regular',price:3})}))
 assert.equal(response.status,429)
}))
test('state searches resolve all U.S. states without an external geocoder',()=>isolated(async()=>{
 globalThis.fetch=async()=>{throw new Error('State search should be local')}
 for(const q of ['California','AK','Hawaii','North Carolina']){const response=await geocode(new Request('https://pumpscout.test/api/geocode?q='+encodeURIComponent(q)));assert.equal(response.status,200);assert.equal((await response.json()).kind,'state')}
}))
