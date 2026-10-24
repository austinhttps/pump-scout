import type {BBox,Fuel,Station,StationPage} from './domain'
import {jsonResponse} from './http'
export async function loadStationPage(bounds:BBox,zoom:number,cursor:string|null,signal:AbortSignal):Promise<StationPage>{
 const [min_long,min_lat,max_long,max_lat]=bounds
 const q=new URLSearchParams({min_long:String(min_long),min_lat:String(min_lat),max_long:String(max_long),max_lat:String(max_lat),zoom:String(Math.floor(zoom))})
 if(cursor)q.set('cursor',cursor)
 const result=await fetch('/api/stations?'+q,{signal})
 return jsonResponse(result,'Station data is temporarily unavailable. Try again shortly.')
}
export async function submitReport(station:Station,fuel:Fuel,price:number,handle:string){
 const response=await fetch('/api/reports',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({stationId:station.id,fuel,price,handle}),signal:AbortSignal.timeout(15000)})
 return jsonResponse(response,'Your report could not be saved. Please try again.')
}
export type SearchResult={label:string;bounds:BBox;center:[number,number];kind:'state'|'place'}
export async function geocode(query:string,signal:AbortSignal):Promise<SearchResult>{
 return jsonResponse(await fetch('/api/geocode?q='+encodeURIComponent(query),{signal}),'Location search is temporarily unavailable.')
}
