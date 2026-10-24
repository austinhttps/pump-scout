/// <reference lib="webworker" />
import Supercluster from '../vendor/supercluster/index.js'
import type {Feature} from '../vendor/supercluster/index.js'
let index:Supercluster|null=null
let version=0
self.onmessage=(event:MessageEvent)=>{
 const message=event.data
 try{
  if(message.type==='load'){index=new Supercluster({radius:70,maxZoom:19,nodeSize:64});index.load(message.points as Feature[]);version=message.version}
  if(!index)return
  const features=index.getClusters(message.bounds,Math.floor(message.zoom)).map(f=>({...f,properties:{...f.properties,...(f.properties.cluster?{expansionZoom:index!.getClusterExpansionZoom(Number(f.properties.cluster_id))}:{})}}))
  self.postMessage({type:'clusters',version,request:message.request,features})
 }catch(error){self.postMessage({type:'error',version,request:message.request,message:error instanceof Error?error.message:'Clustering failed.'})}
}
