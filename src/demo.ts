import {fuels} from './domain'
import type {Station} from './domain'
export function demoStations(now=Date.now()):Station[]{
 return [3.19,3.35,3.49,3.27,3.59,3.39].map((value,i)=>({
  id:'demo-'+i,name:'Sample Station '+(i+1),brand:'DEMO',address:'Fictional location - sample prices',city:'Raleigh',state:'NC',zip:'',
  lat:35.775+(i%3)*.012,lng:-78.655+Math.floor(i/3)*.025,membership:false,source:'demo',
  prices:Object.fromEntries(fuels.map((fuel,j)=>[fuel,{price:Number((value+j*.18).toFixed(2)),reportedAt:new Date(now-i*600000).toISOString(),handle:'SAMPLE - not a real report'}]))
 }))
}

