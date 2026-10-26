import type {Station,StationPage,Viewport} from './domain'
type Loader=(bounds:Viewport['bounds'],zoom:number,cursor:string|null,signal:AbortSignal)=>Promise<StationPage>
export async function collectViewport(view:Viewport,signal:AbortSignal,load:Loader):Promise<StationPage>{
 let cursor:string|null=null,stations:Station[]=[],snapshot:StationPage
 do{
  signal.throwIfAborted()
  snapshot=await load(view.bounds,view.zoom,cursor,signal)
  signal.throwIfAborted()
  stations=stations.concat(snapshot.stations);cursor=snapshot.nextCursor
  if(stations.length>=50000&&cursor)return {...snapshot,stations:stations.slice(0,50000),clusters:snapshot.clusters||[],nextCursor:null,notice:'Showing the first 50,000 stations in this view. Zoom in for complete local comparisons.'}
 }while(cursor)
 return {...snapshot,stations,clusters:snapshot.clusters||[]}
}
