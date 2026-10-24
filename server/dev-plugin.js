import {loadEnv} from 'vite'
import {GET as stations} from '../api/stations.js'
import {GET as geocode} from '../api/geocode.js'
import {POST as reports} from '../api/reports.js'
export function publicApi(){
 return {name:'pumpscout-public-api',configureServer(server){
  const env=loadEnv(server.config.mode,server.config.root,'')
  for(const key of ['SUPABASE_URL','SUPABASE_ANON_KEY','SUPABASE_PUBLISHABLE_KEY','SUPABASE_SERVICE_ROLE_KEY','REPORT_RATE_LIMIT_SALT','OVERPASS_URL','GEOCODER_URL'])if(env[key])process.env[key]=env[key]
  server.middlewares.use(async(req,res,next)=>{
   const pathname=req.url?.split('?')[0]
   const handler=pathname==='/api/stations'&&req.method==='GET'?stations:pathname==='/api/geocode'&&req.method==='GET'?geocode:pathname==='/api/reports'&&req.method==='POST'?reports:null
   if(!handler)return next()
   try{let body='';if(req.method==='POST')for await(const chunk of req){body+=chunk;if(body.length>4096){res.statusCode=413;res.end('Report too large');return}}
    const request=new Request('http://'+(req.headers.host||'127.0.0.1:5173')+req.url,{method:req.method,headers:Object.fromEntries(Object.entries(req.headers).map(([k,v])=>[k,String(v)])),...(body?{body}:{})})
    const response=await handler(request);res.statusCode=response.status;response.headers.forEach((value,key)=>res.setHeader(key,value));res.end(await response.text())
   }catch(error){console.error('Public API failed:',error instanceof Error?error.message:'unknown');res.statusCode=500;res.end(JSON.stringify({message:'The station service is temporarily unavailable.'}))}
  })
 }}
}
