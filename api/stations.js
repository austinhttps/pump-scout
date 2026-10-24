import {parseViewport,longitudeSpan} from '../server/spatial.js'
import {databaseReady,sharedWritesReady,rpc,respond} from '../server/database.js'
import {discoverStations} from '../server/osm.js'
export async function GET(request){
 try{
  const {bounds,zoom,cursor}=parseViewport(new URL(request.url).searchParams)
  const [min_long,min_lat,max_long,max_lat]=bounds
  if(databaseReady()){
   const args={min_long,min_lat,max_long,max_lat}
   if(zoom<8){const clusters=await rpc('station_clusters_in_view',{...args,map_zoom:zoom},{signal:request.signal});return respond({stations:[],clusters,nextCursor:null,source:'database',sharedReports:sharedWritesReady(),overview:true},200,'public, s-maxage=60, stale-while-revalidate=120')}
   const result=await rpc('stations_in_view',{...args,after_id:cursor||'',page_size:1000},{signal:request.signal})
   return respond({stations:result.stations,clusters:[],nextCursor:result.nextCursor,source:'database',sharedReports:sharedWritesReady(),overview:false},200,'public, s-maxage=15, stale-while-revalidate=30')
  }
  if(zoom<9||longitudeSpan(bounds)>4||bounds[3]-bounds[1]>4)return respond({stations:[],clusters:[],nextCursor:null,source:'openstreetmap',sharedReports:false,overview:true,notice:'Zoom in or search a city or ZIP to discover real stations. Shared nationwide prices require the price database connection.'},200,'public, s-maxage=300')
  const stations=await discoverStations(bounds,request.signal)
  return respond({stations,clusters:[],nextCursor:null,source:'openstreetmap',sharedReports:false,overview:false,notice:'Real OpenStreetMap station listings. Manual prices are saved in this browser until shared storage is connected.'},200,'public, s-maxage=3600, stale-while-revalidate=86400')
 }catch(error){const message=error instanceof Error?error.message:'Could not load stations.';const bad=/^(All four map|Map bounds|Invalid map|Invalid station cursor)/.test(message);if(!bad)console.error('Station lookup failed:',message);return respond({message},bad?400:503)}
}
