import {spawnSync} from 'node:child_process'
const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY
if(!url||!key)throw new Error('Missing local SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Vercel variables are not automatically available to local scripts.')
if(!process.env.OVERPASS_URL)throw new Error('Set OVERPASS_URL to your authorized bulk Overpass provider.')
for(const args of [['scripts/download-stations.mjs',...process.argv.slice(2)],['scripts/import-stations.mjs','data/station-extracts',...(process.env.IMPORT_STATES?['--allow-partial']:[])]]){
 const result=spawnSync(process.execPath,args,{stdio:'inherit',env:process.env})
 if(result.error)throw result.error
 if(result.status!==0)process.exit(result.status||1)
}
