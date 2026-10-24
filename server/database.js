import {supabaseHeaders} from './supabase-headers.js'
const url=()=>process.env.SUPABASE_URL?.replace(/\/$/,'')
const readKey=()=>process.env.SUPABASE_ANON_KEY||process.env.SUPABASE_PUBLISHABLE_KEY
export function databaseReady(){return !!(url()&&readKey())}
export function sharedWritesReady(){return databaseReady()&&!!(process.env.SUPABASE_SERVICE_ROLE_KEY&&process.env.REPORT_RATE_LIMIT_SALT)}
export async function rpc(name,body,{write=false,signal}={}){
 const key=write?process.env.SUPABASE_SERVICE_ROLE_KEY:readKey()
 if(!url()||!key)throw new Error('Shared price storage is not configured.')
 const response=await fetch(url()+'/rest/v1/rpc/'+name,{method:'POST',headers:supabaseHeaders(key),body:JSON.stringify(body),signal:signal?AbortSignal.any([signal,AbortSignal.timeout(15000)]):AbortSignal.timeout(15000)})
 const data=await response.json().catch(()=>null)
 if(!response.ok){const message=data?.message||'The price database is temporarily unavailable.';throw new Error(message)}
 return data
}
export function respond(data,status=200,cache='no-store'){return Response.json(data,{status,headers:{'Cache-Control':cache,'X-Content-Type-Options':'nosniff'}})}
