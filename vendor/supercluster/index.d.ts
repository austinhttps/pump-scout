export type Feature={type:'Feature';geometry:{type:'Point';coordinates:[number,number]};properties:Record<string,unknown>}
 export default class Supercluster{
  constructor(options?:{radius?:number;maxZoom?:number;minZoom?:number;nodeSize?:number})
  load(features:Feature[]):this
  getClusters(bbox:[number,number,number,number],zoom:number):Feature[]
  getClusterExpansionZoom(id:number):number
 }
