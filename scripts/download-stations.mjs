// Sequential, resumable bulk downloader. Use a provider authorized for national extracts.
import fs from 'node:fs/promises'
import path from 'node:path'
import {states} from '../server/states.js'
import {stateQuery,validateExtract,retry} from './catalog-utils.mjs'
const directory=path.resolve('data/station-extracts')
const endpoint=process.env.OVERPASS_URL
if(!endpoint)throw new Error('Set OVERPASS_URL to an Overpass provider authorized for nationwide bulk extracts.')
const selected=process.env.IMPORT_STATES?.split(',').map(s=>s.trim().toUpperCase())||Object.keys(states)
for(const code of selected)stateQuery(code)
await fs.mkdir(directory,{recursive:true})
const minimumDelay=Number(process.env.IMPORT_DELAY_MS||45000)
if(!Number.isFinite(minimumDelay)||minimumDelay<1000)throw new Error('IMPORT_DELAY_MS must be at least 1000.')
for(const code of selected){
 const filename=path.join(directory,code+'.json')
 if(!process.argv.includes('--refresh')){
  try{validateExtract(JSON.parse(await fs.readFile(filename,'utf8')));console.log(code+': cached valid extract');continue}catch(error){if(error.code!=='ENOENT')console.log(code+': replacing invalid cached extract')}
 }
 console.log(code+': downloading genuine OSM fuel stations')
 const data=await retry(async()=>{
  const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','User-Agent':'PumpScout/2.0 national catalog import'},body:new URLSearchParams({data:stateQuery(code)}),signal:AbortSignal.timeout(210000)})
  if(!response.ok)throw new Error(code+': provider HTTP '+response.status)
  return validateExtract(await response.json())
 })
 await fs.writeFile(filename+'.tmp',JSON.stringify(data))
 await fs.rename(filename+'.tmp',filename)
 console.log(code+': saved '+data.elements.length+' listings')
 await new Promise(resolve=>setTimeout(resolve,minimumDelay))
}
console.log('Download complete. Run the station importer to upsert these extracts.')
