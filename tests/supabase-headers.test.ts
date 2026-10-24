import test from 'node:test'
import assert from 'node:assert/strict'
import {supabaseHeaders} from '../server/supabase-headers.js'
test('modern Supabase keys are not incorrectly sent as bearer JWTs',()=>{
 for(const key of ['sb_secret_test_only','sb_publishable_test_only']){const headers=supabaseHeaders(key);assert.equal(headers.apikey,key);assert.equal('Authorization' in headers,false)}
})
test('legacy Supabase JWT keys retain bearer compatibility',()=>{
 const key='eyJ_test_only';assert.equal(supabaseHeaders(key).Authorization,'Bearer '+key)
})
test('an empty API key fails before sending a request',()=>{assert.throws(()=>supabaseHeaders(''),/API key/)})

