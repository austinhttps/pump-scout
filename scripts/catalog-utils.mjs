import {states} from '../server/states.js'
export function stateQuery(code){
 if(!Object.hasOwn(states,code))throw new Error('Unknown US state: '+code)
 return `[out:json][timeout:180];area["ISO3166-2"="US-${code}"]["admin_level"="4"]->.state;nwr["amenity"="fuel"](area.state);out center tags;`
}
export function validateExtract(data){
 if(data?.remark||!Array.isArray(data?.elements)||!data.elements.length)throw new Error('Empty or incomplete state extract.')
 if(data.elements.some(el=>!['node','way','relation'].includes(el.type)||el.tags?.amenity!=='fuel'||!Number.isFinite(el.lat??el.center?.lat)||!Number.isFinite(el.lon??el.center?.lon)))throw new Error('Invalid station element.')
 return data
}
export async function retry(operation,attempts=4){
 for(let attempt=0;;attempt++){
  try{return await operation()}catch(error){if(attempt>=attempts-1)throw error;await new Promise(resolve=>setTimeout(resolve,Math.min(60000,5000*2**attempt)))}
 }
}

