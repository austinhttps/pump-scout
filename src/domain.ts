export const fuels = ['regular', 'midgrade', 'premium', 'diesel', 'e85'] as const
export type Fuel = typeof fuels[number]
export const fuelLabels: Record<Fuel,string> = {regular:'Regular',midgrade:'Mid-grade',premium:'Premium',diesel:'Diesel',e85:'E85'}
export type Coord = [number,number]
/** Longitude first. west > east denotes an antimeridian crossing. */
export type BBox = [number,number,number,number]
export type Viewport = {bounds:BBox;zoom:number;center:Coord}
export type MapTarget = {id:number;bounds?:BBox;center?:Coord;zoom?:number}
export type Price = {price:number;reportedAt:string;handle:string;local?:boolean}
export type Station = {id:string;name:string;brand:string;address:string;city:string;zip:string;state?:string;lat:number;lng:number;membership:boolean;fuels?:Fuel[];prices:Partial<Record<Fuel,Price>>;source?:string}
export type OverviewCluster = {id:string;lat:number;lng:number;count:number;bounds:BBox}
export type StationPage = {stations:Station[];clusters:OverviewCluster[];nextCursor:string|null;source:'database'|'openstreetmap';sharedReports:boolean;overview:boolean;notice?:string}
export const DEFAULT_CENTER:Coord=[39.5,-98.35]
export const DEFAULT_BOUNDS:BBox=[-125,24,-66,50]
export const DEFAULT_VIEW:Viewport={bounds:DEFAULT_BOUNDS,zoom:4,center:DEFAULT_CENTER}
export function distance(a:Coord,b:Coord) {const r=Math.PI/180;const dlat=(b[0]-a[0])*r;const dlng=(b[1]-a[1])*r;const h=Math.sin(dlat/2)**2+Math.cos(a[0]*r)*Math.cos(b[0]*r)*Math.sin(dlng/2)**2;return 3958.8*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h))}
export function priceThresholds(prices:number[]){const sorted=[...prices].sort((a,b)=>a-b);return {low:sorted[Math.max(0,Math.ceil(sorted.length*.2)-1)],high:sorted[Math.floor(sorted.length*.8)],count:sorted.length}}
export function priceTier(price:number,thresholds:ReturnType<typeof priceThresholds>):'low'|'mid'|'high'{const {low,high,count}=thresholds;if(count<2||low===high)return 'mid';return price<=low?'low':price>=high?'high':'mid'}
export function tier(price:number,prices:number[]){return priceTier(price,priceThresholds(prices))}
export function average(prices:number[]){return prices.length?prices.reduce((a,b)=>a+b,0)/prices.length:null}
export function ago(date:string){const m=Math.max(0,Math.floor((Date.now()-Date.parse(date))/60000));return m<1?'Just now':m<60?m+' min ago':m<1440?Math.floor(m/60)+' hr ago':Math.floor(m/1440)+' days ago'}
export function isFresh(date:string,now=Date.now()){const age=now-Date.parse(date);return age>=-60000&&age<86400000}
export function validPrice(value:string){return /^\d{1,2}(\.\d{1,3})?$/.test(value)&&Number(value)>=1&&Number(value)<=15}
export function readLocal<T>(key:string,fallback:T):T{try{const data=localStorage.getItem(key);return data?JSON.parse(data):fallback}catch{return fallback}}
export function writeLocal(key:string,value:unknown){try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}}
export function escapeHtml(s:string){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!))}
