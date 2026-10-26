import test from 'node:test'
import assert from 'node:assert/strict'
import {GET} from '../api/averages.js'
test('EIA validates regions and configuration, sanitizes responses, and handles upstream failure',async()=>{
 const originalFetch=globalThis.fetch,originalKey=process.env.EIA_API_KEY
 try{
  delete process.env.EIA_API_KEY
  assert.equal((await GET(new Request('https://example.test/api/averages'))).status,503)
  assert.equal((await GET(new Request('https://example.test/api/averages?area=evil'))).status,400)
  process.env.EIA_API_KEY='test-secret'
  globalThis.fetch=async(input)=>{
   const url=new URL(String(input))
   assert.equal(url.searchParams.get('facets[series][]'),'EMM_EPMR_PTE_R20_DPG')
   return Response.json({request:{api_key:'test-secret'},response:{data:[{value:'3.123',period:'2026-10-19'}]}})
  }
  const response=await GET(new Request('https://example.test/api/averages?area=R20'))
  assert.equal(response.status,200)
  const body=await response.text()
  assert.ok(body.includes('Midwest'));assert.ok(!body.includes('test-secret'))
  globalThis.fetch=async()=>Response.json({response:{data:[{value:null,period:'2026-10-19'}]}})
  assert.equal((await GET(new Request('https://example.test/api/averages'))).status,503)
  globalThis.fetch=async()=>{throw new Error('secret upstream URL')}
  const failed=await GET(new Request('https://example.test/api/averages'))
  assert.equal(failed.status,503);assert.ok(!(await failed.text()).includes('secret upstream'))
 }finally{globalThis.fetch=originalFetch;if(originalKey===undefined)delete process.env.EIA_API_KEY;else process.env.EIA_API_KEY=originalKey}
})

