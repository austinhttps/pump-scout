// Synthetic performance fixture only. These points are never shipped as station data.
import {Worker} from 'node:worker_threads'
import assert from 'node:assert/strict'
import {performance} from 'node:perf_hooks'
const points=Array.from({length:100000},(_,i)=>{
 let lng=-124+((i*0.61803398875)%1)*57,lat=25+((i*0.41421356237)%1)*24
 if(i%20===0){lat=52+(i%19);lng=i%100===0?179:-165+(i%32)}
 if(i%20===1){lat=19+(i%3);lng=-159+(i%4)}
 return {type:'Feature',geometry:{type:'Point',coordinates:[lng,lat]},properties:{stationId:'fixture-'+i}}
})
const moduleUrl=new URL('../src/cluster.worker.ts',import.meta.url).href
const source="import {parentPort} from 'node:worker_threads';globalThis.self={postMessage:m=>parentPort.postMessage(m)};await import("+JSON.stringify(moduleUrl)+");parentPort.on('message',data=>self.onmessage({data}));parentPort.postMessage({type:'ready'});"
const worker=new Worker(new URL('data:text/javascript,'+encodeURIComponent(source)),{execArgv:['--experimental-strip-types']})
const receive=()=>new Promise((resolve,reject)=>{worker.once('message',resolve);worker.once('error',reject)})
try{
 await receive()
 let wait=receive();const started=performance.now()
 worker.postMessage({type:'load',version:1,request:1,points,bounds:[-180,18,180,72],zoom:4})
 const loaded=await wait
 assert.equal(loaded.type,'clusters');assert.equal(loaded.version,1)
 const represented=loaded.features.reduce((sum,f)=>sum+(f.properties.point_count||1),0)
 assert.equal(represented,points.length);assert.ok(loaded.features.length<2500)
 const loadMs=performance.now()-started
 wait=receive();const queryStarted=performance.now();worker.postMessage({type:'query',request:2,bounds:[170,50,-130,72],zoom:7});const alaska=await wait
 assert.equal(alaska.type,'clusters');assert.equal(alaska.request,2);assert.ok(alaska.features.length>0)
 console.log(JSON.stringify({inputPoints:points.length,renderedOverviewFeatures:loaded.features.length,representedPoints:represented,workerLoadAndTransferMs:Math.round(loadMs),alaskaQueryMs:Math.round(performance.now()-queryStarted),alaskaFeatures:alaska.features.length},null,2))
}finally{await worker.terminate()}
