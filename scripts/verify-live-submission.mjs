// Creates only an isolated test listing; always removes it and its cascading reports.
import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import {supabaseHeaders} from '../server/supabase-headers.js'
const db=process.env.SUPABASE_URL?.replace(/\/$/,''),key=process.env.SUPABASE_SERVICE_ROLE_KEY
const site=process.env.SITE_URL?.replace(/\/$/,'')||'https://pump-scout-nine.vercel.app'
if(!db||!key)throw new Error('Missing local server database credentials.')
const id='test:'+randomUUID(),headers=supabaseHeaders(key)
async function database(method,suffix,body){
 const response=await fetch(db+'/rest/v1/stations'+suffix,{method,headers,body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)})
 if(!response.ok)throw new Error('Test database operation failed: HTTP '+response.status)
 return response.status===204?null:response.text()
}
const query='?id=eq.'+encodeURIComponent(id)
try{
 await database('POST','',[{id,name:'AUTOMATED TEST - NOT A REAL STATION',brand:'Test',lat:35,lng:-100,source:'test',state_code:'TX'}])
 const response=await fetch(site+'/api/reports',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({stationId:id,fuel:'regular',price:3.123,handle:'TestReporter'}),signal:AbortSignal.timeout(30000)})
 const result=await response.json()
 assert.equal(response.status,201,JSON.stringify(result))
 assert.equal(result.report.stationId,id)
 const read=await fetch(site+'/api/stations?min_long=-100.001&min_lat=34.999&max_long=-99.999&max_lat=35.001&zoom=15&verification='+encodeURIComponent(id),{signal:AbortSignal.timeout(30000)})
 assert.equal(read.status,200)
 const data=await read.json()
 assert.equal(data.source,'database')
 const station=data.stations.find(s=>s.id===id)
 assert.ok(station,'Test listing absent from live viewport read')
 assert.equal(Number(station.prices.regular.price),3.123)
 console.log('PASS: unauthenticated HTTP submission persisted and appeared in a live viewport read.')
}finally{
 await database('DELETE',query)
 const remaining=JSON.parse(await database('GET',query+'&select=id'))
 assert.equal(remaining.length,0,'Test station cleanup failed')
 console.log('Cleanup verified: isolated station and cascading reports removed.')
}
