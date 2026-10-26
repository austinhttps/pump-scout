import {useCallback,useEffect,useRef,useState} from 'react'
import type {Viewport,StationPage} from './domain'
import {loadStationPage} from './backend'
import {viewportKey} from './geo'
import {collectViewport} from './viewportSnapshot'
const initial:StationPage={stations:[],clusters:[],nextCursor:null,sharedReports:false,overview:true,source:'openstreetmap'}
export function useViewportData(view:Viewport){
 const [snapshot,setSnapshot]=useState(initial),[settled,setSettled]=useState(false)
 const [loading,setLoading]=useState(true),[error,setError]=useState(''),[revision,setRevision]=useState(0)
 const request=useRef(0),key=viewportKey(view.bounds,view.zoom)
 useEffect(()=>{
  const controller=new AbortController(),id=++request.current
  setLoading(true);setError('')
  const timer=setTimeout(async()=>{
   try{
    const next=await collectViewport(view,controller.signal,loadStationPage)
    if(controller.signal.aborted||id!==request.current)return
    setSnapshot(next);setSettled(true)
   }catch(e){if(!controller.signal.aborted&&id===request.current)setError(e instanceof Error?e.message:'Could not load stations.')}
   finally{if(!controller.signal.aborted&&id===request.current)setLoading(false)}
  },220)
  return()=>{clearTimeout(timer);controller.abort()}
 },[key,revision])
 const refresh=useCallback(()=>setRevision(v=>v+1),[])
 return {...snapshot,notice:snapshot.notice||'',settled,loading,error,refresh}
}
