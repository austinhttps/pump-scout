export const fuels = ['regular', 'midgrade', 'premium', 'diesel', 'e85'] as const
export type Fuel = typeof fuels[number]
export const fuelLabels: Record<Fuel,string> = {regular:'Regular',midgrade:'Mid-grade',premium:'Premium',diesel:'Diesel',e85:'E85'}
export type Coord = [number,number]
export type Price = {price:number;reportedAt:string;handle:string;sample?:boolean;photoPath?:string}
export type Station = {id:string;name:string;brand:string;address:string;city:string;zip:string;lat:number;lng:number;membership:boolean;prices:Partial<Record<Fuel,Price>>}
export type Review = {id:string;stationId:string;rating:number;body:string;handle:string;createdAt:string}
export const DEFAULT_CENTER: Coord = [35.7796,-78.6382]
export function distance(a:Coord,b:Coord) { const r=Math.PI/180; const dlat=(b[0]-a[0])*r;const dlng=(b[1]-a[1])*r;const h=Math.sin(dlat/2)**2+Math.cos(a[0]*r)*Math.cos(b[0]*r)*Math.sin(dlng/2)**2;return 3958.8*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h)) }
export function tier(price:number,prices:number[]): 'low'|'mid'|'high' { if(prices.length<2)return 'mid';const sorted=[...prices].sort((a,b)=>a-b);const low=sorted[Math.max(0,Math.ceil(sorted.length*.2)-1)];const high=sorted[Math.floor(sorted.length*.8)];if(low===high)return 'mid';return price<=low?'low':price>=high?'high':'mid' }
export function average(prices:number[]){return prices.length?prices.reduce((a,b)=>a+b,0)/prices.length:null}
export function ago(date:string){const minutes=Math.max(0,Math.floor((Date.now()-Date.parse(date))/60000));return minutes<1?'Just now':minutes<60?minutes+' min ago':minutes<1440?Math.floor(minutes/60)+' hr ago':Math.floor(minutes/1440)+' days ago'}
export function isFresh(date:string){return Date.now()-Date.parse(date)<86400000}
export function validPrice(value:string){return /^\d{1,2}(\.\d{1,3})?$/.test(value)&&Number(value)>=1&&Number(value)<=15}
export function readLocal<T>(key:string,fallback:T):T {try {const data=localStorage.getItem(key);return data?JSON.parse(data):fallback}catch{return fallback}}
export function writeLocal(key:string,value:unknown){try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}}
export function escapeHtml(s:string){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!))}

