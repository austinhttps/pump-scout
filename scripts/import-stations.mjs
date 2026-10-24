import {validateExtract} from './catalog-utils.mjs'
import {supabaseHeaders} from '../server/supabase-headers.js'
// Import genuine U.S. state Overpass extracts; never invent prices or station records.
import fs from 'node:fs/promises'
import path from 'node:path'
import {states} from '../server/states.js'
import {convertStations} from '../server/osm.js'
const directory=process.argv[2],partial=process.argv.includes('--allow-partial')
if(!directory)throw new Error('Usage: node --env-file=.env.local scripts/import-stations.mjs DIRECTORY [--allow-partial]')
const url=process.env.SUPABASE_URL?.replace(/\/$/,''),key=process.env.SUPABASE_SERVICE_ROLE_KEY
if(!url||!key)throw new Error('Set the server-side Supabase URL and service role key before importing.')
const required=Object.keys(states).filter(code=>code!=='DC'),files=[]
for(const code of Object.keys(states)){const filename=path.resolve(directory,code+'.json');try{await fs.access(filename);files.push({code,filename})}catch{if(!partial&&required.includes(code))throw new Error('Missing '+code+'.json. Supply all 50 states or use --allow-partial for an incremental import.')}}
if(!files.length)throw new Error('No state JSON extracts found.')
let imported=0
for(const {code,filename}of files){
 const data=validateExtract(JSON.parse(await fs.readFile(filename,'utf8')))
 if(!Array.isArray(data.elements))throw new Error(code+'.json must be an Overpass extract with an elements array.')
 const rows=convertStations(data.elements).map(s=>({id:s.id,name:s.name.slice(0,100),brand:s.brand,address:s.address,city:s.city,zip:s.zip,state_code:code,country_code:'US',lat:s.lat,lng:s.lng,membership:s.membership,fuels:s.fuels||null,source:'openstreetmap',is_active:true}))
 for(let i=0;i<rows.length;i+=500){const response=await fetch(url+'/rest/v1/stations?on_conflict=id',{method:'POST',headers:{...supabaseHeaders(key),Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(rows.slice(i,i+500)),signal:AbortSignal.timeout(30000)});if(!response.ok)throw new Error('Import failed for '+code+': '+await response.text());imported+=Math.min(500,rows.length-i)}
 console.log(code+': '+rows.length+' genuine station listings imported.')
}
console.log('Completed '+files.length+' state extracts, '+imported+' station upserts. Existing crowdsourced price fields are preserved.')

