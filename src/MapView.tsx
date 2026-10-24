import {useEffect,useMemo,useRef,useState} from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {Plus,Minus,LocateFixed,Layers,Search,Navigation,LoaderCircle} from 'lucide-react'
import type {BBox,Fuel,MapTarget,OverviewCluster,Station,Viewport} from './domain'
import {DEFAULT_CENTER,DEFAULT_BOUNDS,escapeHtml,isFresh,priceThresholds,priceTier} from './domain'
import {normalizeBounds,nearestWorldLongitude} from './geo'
type ClusterFeature={geometry:{coordinates:[number,number]};properties:{cluster?:boolean;cluster_id?:number;point_count?:number;stationId?:string;expansionZoom?:number}}
type Props={stations:Station[];overviewClusters:OverviewCluster[];fuel:Fuel;prices:number[];target:MapTarget|null;selected:string|null;dark:boolean;onSelect:(s:Station)=>void;onViewport:(view:Viewport)=>void;onLocate:()=>void;onSearch:(q:string)=>void;onMessage:(m:string)=>void;loading:boolean}
function fit(map:L.Map,bounds:BBox){const [w,s,e,n]=bounds;map.fitBounds([[s,w],[n,e<w?e+360:e]],{padding:[28,28],maxZoom:14})}
export default function MapView({stations,overviewClusters,fuel,prices,target,selected,dark,onSelect,onViewport,onLocate,onSearch,onMessage,loading}:Props){
 const node=useRef<HTMLDivElement>(null),map=useRef<L.Map|null>(null),layers=useRef<L.LayerGroup|null>(null),worker=useRef<Worker|null>(null)
 const callback=useRef(onViewport),select=useRef(onSelect),message=useRef(onMessage)
 callback.current=onViewport;select.current=onSelect;message.current=onMessage
 const version=useRef(0),request=useRef(0),currentView=useRef<Viewport>({bounds:DEFAULT_BOUNDS,zoom:4,center:DEFAULT_CENTER})
 const [features,setFeatures]=useState<ClusterFeature[]>([]),[clusterError,setClusterError]=useState(''),[view,setView]=useState(currentView.current)
 const [colorMap,setColorMap]=useState(false),[tileError,setTileError]=useState(false),[query,setQuery]=useState('')
 const stationIndex=useMemo(()=>new Map(stations.map(s=>[s.id,s])),[stations])
 const thresholds=useMemo(()=>priceThresholds(prices),[prices])
 useEffect(()=>{
  if(!node.current)return
  const m=L.map(node.current,{zoomControl:false,center:DEFAULT_CENTER,zoom:4,worldCopyJump:true,scrollWheelZoom:true,maxZoom:19,minZoom:2})
  map.current=m;layers.current=L.layerGroup().addTo(m);fit(m,DEFAULT_BOUNDS)
  let timer:ReturnType<typeof setTimeout>
  const changed=()=>{clearTimeout(timer);timer=setTimeout(()=>{const b=m.getBounds(),c=m.getCenter();const value:Viewport={bounds:normalizeBounds(b.getWest(),b.getSouth(),b.getEast(),b.getNorth()),zoom:m.getZoom(),center:[c.lat,((c.lng+180)%360+360)%360-180]};currentView.current=value;setView(value);callback.current(value)},70)}
  m.on('moveend zoomend',changed)
  const resize=new ResizeObserver(()=>{m.invalidateSize();changed()});resize.observe(node.current);changed()
  return()=>{clearTimeout(timer);resize.disconnect();m.off('moveend zoomend',changed);m.remove();map.current=null}
 },[])
 useEffect(()=>{
  const m=map.current;if(!m)return
  let loaded=0,failed=0,fallback=false
  const key=import.meta.env.VITE_CARTO_API_KEY as string|undefined
  const osm='https://tile.openstreetmap.org/{z}/{x}/{y}.png'
  const attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>'+(key?' &copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>':'')
  const layer=L.tileLayer(key?'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key='+encodeURIComponent(key):osm,{attribution,maxZoom:19,noWrap:false}).addTo(m)
  layer.on('tileload',()=>{loaded++;setTileError(false)})
  layer.on('tileerror',()=>{if(!loaded&&++failed>=3){if(key&&!fallback){fallback=true;failed=0;layer.setUrl(osm)}else setTileError(true)}})
  return()=>{layer.remove()}
 },[])
 useEffect(()=>{const m=map.current;if(!m||!target)return;if(target.bounds)fit(m,target.bounds);else if(target.center)m.flyTo(target.center,target.zoom??13,{duration:.8})},[target])
 useEffect(()=>{
  const w=new Worker(new URL('./cluster.worker.ts',import.meta.url),{type:'module'});worker.current=w
  w.onmessage=e=>{if(e.data.version!==version.current||e.data.request!==request.current)return;if(e.data.type==='error')setClusterError(e.data.message);else{setFeatures(e.data.features);setClusterError('')}}
  w.onerror=()=>setClusterError('Map clustering failed. Reload the page to retry.')
  return()=>{w.terminate();worker.current=null}
 },[])
 useEffect(()=>{
  const w=worker.current;if(!w)return
  const points=stations.map(s=>({type:'Feature',geometry:{type:'Point',coordinates:[s.lng,s.lat]},properties:{stationId:s.id}}))
  version.current++;request.current++
  w.postMessage({type:'load',points,version:version.current,request:request.current,bounds:currentView.current.bounds,zoom:currentView.current.zoom})
 },[stations])
 useEffect(()=>{request.current++;worker.current?.postMessage({type:'query',request:request.current,bounds:view.bounds,zoom:view.zoom})},[view])
 useEffect(()=>{
  const group=layers.current,m=map.current;if(!group||!m)return
  group.clearLayers()
  const cluster=(lat:number,lng:number,count:number,click:()=>void)=>{const marker=L.marker([lat,nearestWorldLongitude(lng,m.getCenter().lng)],{icon:L.divIcon({className:'cluster-wrapper',html:'<div class="station-cluster"><strong>'+count.toLocaleString()+'</strong><span>stations</span></div>',iconSize:[66,66],iconAnchor:[33,33]}),title:count+' stations. Click to zoom.'}).on('click',click);group!.addLayer(marker)}
  for(const item of overviewClusters)cluster(item.lat,item.lng,item.count,()=>fit(m,item.bounds))
  for(const feature of features){const [lng,lat]=feature.geometry.coordinates;const props=feature.properties
   if(props.cluster){cluster(lat,lng,props.point_count||0,()=>{const z=Math.min(19,props.expansionZoom??m.getZoom()+2);if(z<=m.getZoom())message.current('These stations share a location. Choose a station from the list.');else m.flyTo([lat,nearestWorldLongitude(lng,m.getCenter().lng)],z,{duration:.6})});continue}
   const station=stationIndex.get(props.stationId||'');if(!station)continue
   const p=station.prices[fuel],t=p&&isFresh(p.reportedAt)?priceTier(p.price,thresholds):'unknown'
   const icon=L.divIcon({className:'price-marker-wrapper',html:'<div class="price-marker '+t+(selected===station.id?' active':'')+'">'+(p?'$'+p.price.toFixed(2):'<span class="unreported-pin">Gas</span>')+'</div>',iconSize:[70,37],iconAnchor:[35,44]})
   const marker=L.marker([lat,nearestWorldLongitude(lng,m.getCenter().lng)],{icon,keyboard:true,title:station.name+(p?' $'+p.price.toFixed(2):' - price not reported'),zIndexOffset:selected===station.id?1000:0}).on('click',()=>select.current(station))
   marker.bindTooltip(escapeHtml(station.name)+' &middot; '+escapeHtml(station.address),{direction:'top',offset:[0,-43]});group.addLayer(marker)
  }
 },[features,overviewClusters,stationIndex,fuel,thresholds,selected])
 return <div className={'map-shell '+(dark?'dark-map ':'')+(colorMap?'full-color':'')}>
  <div ref={node} className="map-canvas" aria-label="Interactive nationwide gas station map"/>
  <form className="map-search" onSubmit={e=>{e.preventDefault();if(query.trim())onSearch(query.trim())}}><Search size={17}/><input aria-label="Search the map" placeholder="City, ZIP code, or state" value={query} onChange={e=>setQuery(e.target.value)}/><button aria-label="Search map location" type="submit"><Navigation size={15}/></button></form>
  <div className="map-controls"><button onClick={onLocate} aria-label="Use my location"><LocateFixed size={19}/></button><div className="zoom-group"><button onClick={()=>map.current?.zoomIn()} aria-label="Zoom in"><Plus size={20}/></button><button onClick={()=>map.current?.zoomOut()} aria-label="Zoom out"><Minus size={20}/></button></div><button onClick={()=>setColorMap(v=>!v)} aria-label="Change map style" aria-pressed={colorMap}><Layers size={19}/></button></div>
  {loading&&<div className="map-updating" role="status"><LoaderCircle className="spin" size={14}/>Updating this view</div>}
  {(tileError||clusterError)&&<div className="map-error" role="status">{clusterError||'Map tiles are unavailable. The station list still works.'}</div>}
  <div className="map-location"><span className="location-dot"/><span>Prices from this map view only</span></div>
  <div className="map-legend"><span><i className="low"/>Lowest 20%</span><span><i className="mid"/>In between</span><span><i className="high"/>Highest 20%</span></div>
 </div>
}
