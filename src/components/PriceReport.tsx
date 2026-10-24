import {useState} from 'react'
import type {FormEvent} from 'react'
import {LoaderCircle,Plus} from 'lucide-react'
import type {Station,Fuel} from '../domain'
import {fuels,fuelLabels,validPrice,readLocal,writeLocal} from '../domain'
import Modal from '../Modal'
type Props={stations:Station[];initialStation:Station|null;fuel:Fuel;shared:boolean;onSubmit:(s:Station,f:Fuel,p:number,handle:string)=>Promise<void>;onClose:()=>void}
export default function PriceReport({stations,initialStation,fuel,shared,onSubmit,onClose}:Props){
 const [stationId,setStationId]=useState(initialStation?.id||stations[0]?.id||'')
 const [chosenFuel,setFuel]=useState(fuel),[price,setPrice]=useState('')
 const [nickname,setNickname]=useState(()=>readLocal('pumpscout.nickname.v2',''))
 const [error,setError]=useState(''),[busy,setBusy]=useState(false)
 const options=initialStation?[initialStation,...stations.filter(s=>s.id!==initialStation.id)]:stations
 async function submit(e:FormEvent){e.preventDefault();setError('');const station=options.find(s=>s.id===stationId);if(!station){setError('Select a station from the current map view.');return}if(!validPrice(price)){setError('Enter a cash price between $1 and $15.');return}const handle=nickname.trim()||'Anonymous';if(!/^[a-zA-Z0-9_]{3,24}$/.test(handle)){setError('Use 3-24 letters, numbers, or underscores for a nickname, or leave it blank.');return}setBusy(true);try{await onSubmit(station,chosenFuel,Number(price),handle);writeLocal('pumpscout.nickname.v2',nickname.trim());onClose()}catch(e){setError(e instanceof Error?e.message:'Could not save the price.')}finally{setBusy(false)}}
 return <Modal title="Share a price. No account needed." subtitle={shared?'Report the price you see at the pump.':'This price will be saved only in this browser.'} onClose={()=>{if(!busy)onClose()}}><form className="modal-form" onSubmit={e=>void submit(e)}><label>Station<select required value={stationId} onChange={e=>setStationId(e.target.value)}><option value="" disabled>Select a station</option>{options.slice(0,1000).map(s=><option key={s.id} value={s.id}>{s.name} - {s.address}</option>)}</select></label><div className="form-grid"><label>Fuel type<select value={chosenFuel} onChange={e=>setFuel(e.target.value as Fuel)}>{fuels.map(f=><option key={f} value={f}>{fuelLabels[f]}</option>)}</select></label><label>Cash price / gallon<div className="price-input"><span>$</span><input type="number" inputMode="decimal" min={1} max={15} step=".001" required value={price} onChange={e=>setPrice(e.target.value)} placeholder="3.09"/></div></label></div><label>Nickname (optional)<input maxLength={24} value={nickname} onChange={e=>setNickname(e.target.value)} placeholder="Anonymous"/></label><p className="form-help">A nickname is just a label on this report. It does not create an account. Prices are cash USD per gallon, including tax.</p>{error&&<p className="form-error" role="alert">{error}</p>}<button className="button button-dark full-width" disabled={busy||!options.length}>{busy?<LoaderCircle className="spin" size={18}/>:<Plus size={18}/>} {busy?'Saving price...':shared?'Share price publicly':'Save price in this browser'}</button></form></Modal>
}
