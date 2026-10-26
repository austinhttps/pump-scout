import {respond} from '../server/database.js'
export const areas={NUS:'United States',R10:'East Coast',R20:'Midwest',R30:'Gulf Coast',R40:'Rocky Mountain',R50:'West Coast'}
export async function GET(request){
 const area=new URL(request.url).searchParams.get('area')||'NUS'
 if(!Object.hasOwn(areas,area))return respond({message:'Unknown EIA region.'},400)
 if(!process.env.EIA_API_KEY)return respond({message:'EIA averages are not configured yet.'},503)
 try{
  const url=new URL('https://api.eia.gov/v2/petroleum/pri/gnd/data/')
  const params={api_key:process.env.EIA_API_KEY,frequency:'weekly','data[0]':'value','facets[series][]':'EMM_EPMR_PTE_'+area+'_DPG','sort[0][column]':'period','sort[0][direction]':'desc',length:'1'}
  for(const [key,value] of Object.entries(params))url.searchParams.set(key,value)
  const response=await fetch(url,{signal:AbortSignal.timeout(12000)})
  if(!response.ok)throw new Error('Upstream unavailable')
  const body=await response.json(),row=body.response?.data?.[0],value=Number(row?.value)
  if(!row||!/^\d{4}-\d{2}-\d{2}$/.test(row.period)||!Number.isFinite(value)||value<=0)throw new Error('Invalid observation')
  return respond({area:areas[area],value,period:row.period,units:'USD/gallon',source:'EIA'},200,'public, s-maxage=21600, stale-while-revalidate=3600')
 }catch{return respond({message:'EIA averages are temporarily unavailable. Station reports still work.'},503)}
}

