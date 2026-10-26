import test from 'node:test'
import assert from 'node:assert/strict'
import {collectViewport} from '../src/viewportSnapshot.ts'
import type {StationPage,Viewport} from '../src/domain.ts'
const view:Viewport={bounds:[-101,34,-99,36],center:[35,-100],zoom:13}
const page:StationPage={stations:[],clusters:[],nextCursor:null,source:'database',overview:false,sharedReports:true}
test('publishes a viewport only after all cursor pages arrive',async()=>{
 const calls:(string|null)[]=[],controller=new AbortController()
 let release!:(value:StationPage)=>void,settled=false
 const promise=collectViewport(view,controller.signal,async(bounds,zoom,cursor)=>{
  assert.equal(bounds,view.bounds);assert.equal(zoom,13);calls.push(cursor)
  if(!cursor)return {...page,nextCursor:'page2'}
  return new Promise(resolve=>{release=resolve})
 }).then(result=>{settled=true;return result})
 await new Promise(resolve=>setTimeout(resolve,0))
 assert.deepEqual(calls,[null,'page2']);assert.equal(settled,false)
 release(page);assert.deepEqual((await promise).stations,[]);assert.equal(settled,true)
})
test('aborted viewport cannot publish even when transport completes late',async()=>{
 const controller=new AbortController()
 await assert.rejects(collectViewport(view,controller.signal,async()=>{controller.abort();return page}),{name:'AbortError'})
})
test('failed later page rejects the entire replacement snapshot',async()=>{
 await assert.rejects(collectViewport(view,new AbortController().signal,async(_b,_z,cursor)=>{
  if(cursor)throw new Error('provider unavailable')
  return {...page,nextCursor:'next'}
 }),/provider unavailable/)
})
