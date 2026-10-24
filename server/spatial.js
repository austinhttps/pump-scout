export function parseViewport(params){
 const names=['min_long','min_lat','max_long','max_lat']
 const values=names.map(name=>{const raw=params.get(name);if(raw===null||!raw.trim())throw new Error('All four map bounds are required.');const n=Number(raw);if(!Number.isFinite(n))throw new Error('Map bounds must be finite numbers.');return n})
 const [west,south,east,north]=values
 if(west< -180||west>180||east< -180||east>180||south< -85.051129||north>85.051129||south>=north||west===east)throw new Error('Invalid map bounding box.')
 const zoomRaw=params.get('zoom'),zoom=Number(zoomRaw)
 if(zoomRaw===null||!Number.isInteger(zoom)||zoom<0||zoom>20)throw new Error('Invalid map zoom.')
 const cursor=params.get('cursor')
 if(cursor&&(!/^[A-Za-z0-9:_./-]{1,140}$/.test(cursor)))throw new Error('Invalid station cursor.')
 return {bounds:values,zoom,cursor}
}
export function splitBounds([w,s,e,n]){return w<=e?[[w,s,e,n]]:[[w,s,180,n],[-180,s,e,n]]}
export function longitudeSpan([w,,e]){return w<=e?e-w:360-w+e}
export function validReport(body){
 if(!body||typeof body!=='object'||typeof body.stationId!=='string'||!/^[A-Za-z0-9:_./-]{1,140}$/.test(body.stationId))throw new Error('Choose a valid station.')
 if(!['regular','midgrade','premium','diesel','e85'].includes(body.fuel))throw new Error('Choose a valid fuel.')
 if(typeof body.price!=='number'||!Number.isFinite(body.price)||body.price<1||body.price>15||Math.abs(body.price*1000-Math.round(body.price*1000))>.000001)throw new Error('Enter a price between $1 and $15 with at most three decimals.')
 const handle=body.handle?.trim()||'Anonymous'
 if(!/^[A-Za-z0-9_]{3,24}$/.test(handle))throw new Error('A nickname must contain 3-24 letters, numbers, or underscores.')
 return {stationId:body.stationId,fuel:body.fuel,price:body.price,handle}
}
