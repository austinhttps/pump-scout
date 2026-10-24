import type { Station } from './domain'
const rows:[string,string,string,string,number,number,number,boolean,number][]=[
 ['Costco','Costco','2838 Wake Forest Rd','27609',35.8215,-78.6210,2.89,true,12],
 ["Sam's Club","Sam's Club",'2537 S Saunders St','27603',35.7461,-78.6464,2.92,true,23],
 ['Sheetz','Sheetz','5200 New Bern Ave','27610',35.7975,-78.5545,2.95,false,8],
 ['Circle K','Circle K','2720 Lake Wheeler Rd','27603',35.7452,-78.6702,3.05,false,31],
 ['Shell','Shell','1610 Glenwood Ave','27608',35.8045,-78.6478,3.19,false,45],
 ['Exxon','Exxon','1701 Capital Blvd','27604',35.8020,-78.6232,3.29,false,62],
 ['BP','BP','4101 Glenwood Ave','27612',35.8332,-78.6695,3.09,false,18],
 ['Marathon','Marathon','1201 S Wilmington St','27601',35.7652,-78.6390,3.02,false,52],
 ['Speedway','Speedway','3912 Western Blvd','27606',35.7854,-78.6921,3.12,false,37],
 ['Valero','Valero','2810 Hillsborough St','27607',35.7903,-78.6748,3.15,false,85],
 ['Shell','Shell','3300 New Bern Ave','27610',35.7894,-78.5864,3.25,false,120],
 ['Exxon','Exxon','3600 S Wilmington St','27603',35.7295,-78.6508,3.35,false,155],
 ['Sheetz','Sheetz','1000 N Rogers Ln','27610',35.8049,-78.5414,2.99,false,19],
 ['BP','BP','2501 Blue Ridge Rd','27607',35.8151,-78.7030,3.07,false,28],
 ['Circle K','Circle K','4400 Falls of Neuse Rd','27609',35.8411,-78.6110,3.11,false,71],
 ['Speedway','Speedway','2401 Capital Blvd','27604',35.8138,-78.6063,3.04,false,41]
]
export function seedStations():Station[]{const now=Date.now();return rows.map(([name,brand,address,zip,lat,lng,base,membership,minutes],i)=>({id:'station-'+(i+1),name,brand,address,city:'Raleigh, NC',zip,lat,lng,membership,prices:Object.fromEntries((['regular','midgrade','premium','diesel','e85'] as const).filter(f=>f!=='e85'||brand==='Sheetz').filter(f=>f!=='diesel'||i%4!==0).map((fuel)=>[fuel,{price:Number((base+({regular:0,midgrade:.35,premium:.65,diesel:.56,e85:-.5}[fuel])).toFixed(2)),reportedAt:new Date(now-minutes*60000).toISOString(),handle:['roadtripr','oakcitydriver','fuelwise','carolinacruiser'][i%4],sample:true}]))}))}

