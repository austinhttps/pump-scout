import type {BBox,Station} from './domain'
export function wrapLongitude(lng:number){return ((lng+180)%360+360)%360-180}
export function normalizeBounds(west:number,south:number,east:number,north:number):BBox{
 const latMin=Math.max(-85.051129,Math.min(85.051129,south)),latMax=Math.max(-85.051129,Math.min(85.051129,north))
 return east-west>=359.999?[-180,latMin,180,latMax]:[wrapLongitude(west),latMin,east===180?180:wrapLongitude(east),latMax]
}
export function contains(bounds:BBox,lat:number,lng:number){const [w,s,e,n]=bounds;const x=wrapLongitude(lng);return lat>=s&&lat<=n&&(w<=e?x>=w&&x<=e:x>=w||x<=e)}
export function insideViewport(stations:Station[],bounds:BBox){return stations.filter(s=>contains(bounds,s.lat,s.lng))}
export function viewportKey(bounds:BBox,zoom:number){return bounds.map(v=>v.toFixed(5)).join(',')+':'+Math.floor(zoom)}

export function nearestWorldLongitude(lng:number,centerLng:number){return lng+360*Math.round((centerLng-lng)/360)}
