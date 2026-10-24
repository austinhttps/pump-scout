import test from 'node:test'
import assert from 'node:assert/strict'
import {stateQuery,validateExtract,retry} from '../scripts/catalog-utils.mjs'
import {states} from '../server/states.js'
test('all states and DC use exact state areas, including Alaska',()=>{
 assert.equal(Object.keys(states).length,51)
 for(const code of Object.keys(states))assert.ok(stateQuery(code).includes('US-'+code))
 assert.throws(()=>stateQuery('XX'))
})
test('rejects partial, empty, malformed, and unlocated extracts',()=>{
 for(const data of [{},{elements:[]},{remark:'timeout',elements:[]},{elements:[{type:'way',tags:{amenity:'fuel'}}]}])assert.throws(()=>validateExtract(data))
 const data={elements:[{type:'way',id:1,center:{lat:35,lon:-100},tags:{amenity:'fuel'}}]}
 assert.equal(validateExtract(data),data)
})
test('retry passes through success and bounds terminal failure',async()=>{
 assert.equal(await retry(async()=>42),42)
 await assert.rejects(retry(async()=>{throw new Error('offline')},1),/offline/)
})
