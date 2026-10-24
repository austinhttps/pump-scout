import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Plus, Minus, LocateFixed, Layers, Search, Navigation } from 'lucide-react'
import { distance, tier, escapeHtml, isFresh } from './domain'
import type { Station, Fuel, Coord } from './domain'
type Props={stations:Station[];fuel:Fuel;center:Coord;selected:string|null;dark:boolean;onSelect:(s:Station)=>void;onLocate:()=>void;onArea:(c:Coord)=>void;onSearch:(q:string)=>void;prices:number[]}
export default function MapView({stations,fuel,center,selected,dark,onSelect,onLocate,onArea,onSearch,prices}:Props){
 const node=useRef<HTMLDivElement>(null);const map=useRef<L.Map|null>(null);const markers=useRef<L.LayerGroup|null>(null);const [moved,setMoved]=useState(false);const [satellite,setSatellite]=useState(false);const [tileError,setTileError]=useState(false);const [query,setQuery]=useState('')
 useEffect(()=>{if(!node.current)return;const m=L.map(node.current,{zoomControl:false,attributionControl:true,center,zoom:12,scrollWheelZoom:true});map.current=m;markers.current=L.layerGroup().addTo(m);const resize=new ResizeObserver(()=>m.invalidateSize());resize.observe(node.current);return()=>{resize.disconnect();m.remove();map.current=null}},[])
 useEffect(()=>{
 const m=map.current;if(!m)return;let successes=0;let failures=0;let fallback=false;
 const key=import.meta.env.VITE_CARTO_API_KEY as string|undefined;
 setTileError(false);
 const osm='https://tile.openstreetmap.org/{z}/{x}/{y}.png';
 const url=key?'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key='+encodeURIComponent(key):osm;
 const osmCredit='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>';
 const cartoCredit='&copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>';
 const layer=L.tileLayer(url,{attribution:osmCredit+(key?' '+cartoCredit:''),maxZoom:19}).addTo(m);
 layer.on('tileload',()=>{successes++;setTileError(false)});
 layer.on('tileerror',()=>{if(!successes&&++failures>=3){if(key&&!fallback){fallback=true;failures=0;layer.setUrl(osm);m.attributionControl.removeAttribution(cartoCredit)}else{setTileError(true)}}});
 return()=>{layer.remove()}
 },[])
 useEffect(()=>{const m=map.current;if(!m)return;m.flyTo(center,m.getZoom()<11?12:m.getZoom(),{duration:1});setMoved(false);const handle=()=>setMoved(distance(center,[m.getCenter().lat,m.getCenter().lng])>.3);m.on('moveend',handle);return()=>{m.off('moveend',handle)}},[center])
 useEffect(()=>{const group=markers.current;if(!group)return;group.clearLayers();stations.forEach(s=>{const p=s.prices[fuel];const t=p&&isFresh(p.reportedAt)?tier(p.price,prices):'unknown';const active=s.id===selected;const icon=L.divIcon({className:'price-marker-wrapper',html:'<div class="price-marker '+t+(active?' active':'')+'">'+(p?'$'+p.price.toFixed(2):'—')+(s.membership?'<span class="marker-club">•</span>':'')+'</div>',iconSize:[70,37],iconAnchor:[35,44]});const marker=L.marker([s.lat,s.lng],{icon,keyboard:true,title:s.name+' '+(p?'$'+p.price.toFixed(2):'No price'),zIndexOffset:active?1000:0}).on('click',()=>onSelect(s));marker.bindTooltip(escapeHtml(s.name)+' · '+escapeHtml(s.address),{direction:'top',offset:[0,-43]});group.addLayer(marker)})},[stations,fuel,selected,onSelect,prices])
 return <div className={'map-shell '+(dark?'dark-map ':'')+(satellite?'full-color':'')}><div ref={node} className="map-canvas" aria-label="Interactive map of nearby gas stations"/><form className="map-search" onSubmit={e=>{e.preventDefault();if(query.trim())onSearch(query.trim())}}><Search size={17}/><input aria-label="Search the map" placeholder="Search city, ZIP, or address" value={query} onChange={e=>setQuery(e.target.value)}/><button aria-label="Search map location" type="submit"><Navigation size={15}/></button></form><div className="map-controls"><button onClick={onLocate} aria-label="Use my location" title="Use my location"><LocateFixed size={19}/></button><div className="zoom-group"><button onClick={()=>map.current?.zoomIn()} aria-label="Zoom in"><Plus size={20}/></button><button onClick={()=>map.current?.zoomOut()} aria-label="Zoom out"><Minus size={20}/></button></div><button onClick={()=>setSatellite(s=>!s)} aria-label="Change map style" title="Change map style" aria-pressed={satellite}><Layers size={19}/></button></div>{moved&&<button className="search-area" onClick={()=>{const c=map.current?.getCenter();if(c){onArea([c.lat,c.lng]);setMoved(false)}}}><Search size={15}/>Search this area</button>}{tileError&&<div className="map-error" role="status">Map tiles are unavailable. Station search and the list still work.</div>}<div className="map-location"><span className="location-dot"/><span>Exploring your neighborhood</span></div><div className="map-legend"><span><i className="low"/>Lowest 20%</span><span><i className="mid"/>In between</span><span><i className="high"/>Highest 20%</span></div></div>
}

