import {useCallback,useEffect,useRef,useState} from 'react'
import type {Viewport,Station,OverviewCluster} from './domain'
import {loadStationPage} from './backend'
import {viewportKey} from './geo'
const MAX_POINTS=50000
export function useViewportData(view:Viewport){
 const [stations,setStations]=useState<Station[]>([])
 const [clusters,setClusters]=useState<OverviewCluster[]>([])
 const [loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState('')
 const [sharedReports,setShared]=useState(false),[overview,setOverview]=useState(true)
 const [source,setSource]=useState('openstreetmap'),[revision,setRevision]=useState(0)
 const request=useRef(0)
 const key=viewportKey(view.bounds,view.zoom)
 useEffect(()=>{
  const controller=new AbortController();const id=++request.current
  setLoading(true);setError('');setStations([]);setClusters([]);setNotice('')
  const timer=setTimeout(async()=>{
   try{let cursor:string|null=null;let collected:Station[]=[];let partial=false
    do{const data=await loadStationPage(view.bounds,view.zoom,cursor,controller.signal)
     if(controller.signal.aborted||id!==request.current)return
     setShared(data.sharedReports);setOverview(data.overview);setSource(data.source);setClusters(data.clusters)
     collected=collected.concat(data.stations);cursor=data.nextCursor
     if(data.notice)setNotice(data.notice)
     if(collected.length>=MAX_POINTS&&cursor){partial=true;break}
    }while(cursor)
    if(id!==request.current)return
    setStations(collected);if(partial)setNotice('Showing the first 50,000 stations in this view. Zoom in for complete local comparisons.')
   }catch(e){if(!controller.signal.aborted&&id===request.current)setError(e instanceof Error?e.message:'Could not load stations.')}
   finally{if(!controller.signal.aborted&&id===request.current)setLoading(false)}
  },220)
  return()=>{clearTimeout(timer);controller.abort()}
 },[key,revision])
 const refresh=useCallback(()=>setRevision(v=>v+1),[])
 return {stations,clusters,loading,error,notice,sharedReports,overview,source,refresh}
}
