import test from 'node:test'
import assert from 'node:assert/strict'
import {normalizeBounds,contains,insideViewport,nearestWorldLongitude} from '../src/geo.ts'
import {parseViewport,splitBounds,validReport} from '../server/spatial.js'
import {stateResult,states} from '../server/states.js'
import type {Station} from '../src/domain.ts'
test('active Leaflet bounds normalize wrapped worlds without losing Alaska',()=>{
 assert.deepEqual(normalizeBounds(-200,20,-130,72),[160,20,-130,72])
 assert.equal(contains([170,50,-130,72],60,179),true)
 assert.equal(contains([170,50,-130,72],60,-179),true)
 assert.equal(contains([170,50,-130,72],35,-78),false)
 assert.deepEqual(normalizeBounds(-300,18,300,72),[-180,18,180,72])
 assert.equal(splitBounds([170,50,-130,72]).length,2)
 assert.equal(nearestWorldLongitude(-150,201),210)
 assert.equal(nearestWorldLongitude(179,-179),-181)
})
test('viewport averages cannot accidentally include distant stations',()=>{
 const station=(id:string,lat:number,lng:number)=>({id,lat,lng} as Station)
 const data=[station('Seattle',47.6,-122.33),station('Honolulu',21.3,-157.8),station('Raleigh',35.78,-78.64)]
 assert.deepEqual(insideViewport(data,[-123,47,-122,48]).map(s=>s.id),['Seattle'])
})
test('request parser rejects malformed bounds and SQL-like input',()=>{
 const good='min_long=-123&min_lat=47&max_long=-122&max_lat=48&zoom=12'
 assert.equal(parseViewport(new URLSearchParams(good)).zoom,12)
 for(const bad of [good.replace('min_lat=47','min_lat='),good.replace('-123','Infinity'),good.replace('max_lat=48','max_lat=46'),good.replace('zoom=12','zoom=80'),good+'&cursor=1;DROP TABLE stations'])assert.throws(()=>parseViewport(new URLSearchParams(bad)))
})
test('all 50 states plus DC resolve locally, including state codes and date-line Alaska',()=>{
 assert.equal(Object.keys(states).length,51)
 for(const [code,[name]] of Object.entries(states)){assert.equal(stateResult(code)?.kind,'state');assert.equal(stateResult(name)?.kind,'state')}
 const alaska=stateResult('Alaska')!;assert.ok(alaska.bounds[0]>alaska.bounds[2])
 assert.equal(stateResult('Hawaii')?.center[0]>18,true)
 assert.equal(stateResult('North Carolina')?.label,'North Carolina, NC')
 assert.equal(stateResult('Raleigh'),null)
})
test('anonymous submissions need no identity but retain validation',()=>{
 assert.equal(validReport({stationId:'osm:node:1',fuel:'diesel',price:3.099}).handle,'Anonymous')
 for(const extra of [{price:0},{price:Infinity},{price:3.0001},{fuel:'rocket'},{stationId:'x;DROP'},{handle:'<script>'}])assert.throws(()=>validReport({stationId:'osm:node:1',fuel:'regular',price:3.09,...extra}))
})
