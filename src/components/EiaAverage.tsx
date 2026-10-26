import {useEffect,useState} from 'react'
type Observation={area:string;value:number;period:string}
const regions={NUS:'United States',R10:'East Coast',R20:'Midwest',R30:'Gulf Coast',R40:'Rocky Mountain',R50:'West Coast'}
export default function EiaAverage(){
 const [area,setArea]=useState('NUS'),[data,setData]=useState<Observation|null>(null),[message,setMessage]=useState('Loading EIA average...'),[retry,setRetry]=useState(0)
 useEffect(()=>{
  const controller=new AbortController();setData(null);setMessage('Loading EIA average...')
  void (async()=>{try{
   const response=await fetch('/api/averages?area='+area,{signal:controller.signal}),body=await response.json()
   if(!response.ok)throw new Error(body.message||'EIA average unavailable.')
   if(!controller.signal.aborted){setData(body);setMessage('')}
  }catch(error){if(!controller.signal.aborted)setMessage(error instanceof Error?error.message:'EIA average unavailable.')}})()
  return()=>controller.abort()
 },[area,retry])
 return <section className="benchmark" aria-label="EIA weekly benchmark"><div><strong>EIA weekly average · Regular gasoline</strong><p>Regional benchmark, not a station price. Independent of the map fuel filter.</p></div><label>Region <select value={area} onChange={e=>setArea(e.target.value)}>{Object.entries(regions).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label><div role="status">{data?<><strong>${data.value.toFixed(3)}/gal</strong><p>{data.area} · Week of {data.period}</p></>:<><span>{message}</span>{!message.startsWith('Loading')&&<button onClick={()=>setRetry(v=>v+1)}>Retry</button>}</>}</div><a href="https://www.eia.gov/petroleum/gasdiesel/" target="_blank" rel="noreferrer">Source: EIA</a></section>
}

