import test from 'node:test'
import assert from 'node:assert/strict'
import {jsonResponse} from '../src/http.ts'
test('successful minimal inserts and logout do not fail after saving',async()=>{assert.equal(await jsonResponse(new Response(null,{status:201}),'Failed'),null);assert.equal(await jsonResponse(new Response(null,{status:204}),'Failed'),null)})
test('API validation messages survive to the user',async()=>{await assert.rejects(()=>jsonResponse(new Response(JSON.stringify({message:'Please wait 30 seconds between price reports.'}),{status:400}),'Failed'),/Please wait 30 seconds/);await assert.rejects(()=>jsonResponse(new Response('Bad Gateway',{status:502}),'Connection failed'),/Connection failed/)})
test('successful API JSON is returned without changes',async()=>{assert.deepEqual(await jsonResponse(new Response('[{"id":"station-1"}]',{status:200}),'Failed'),[{id:'station-1'}])})

