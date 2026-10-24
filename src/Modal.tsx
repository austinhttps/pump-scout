import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
export default function Modal({title,subtitle,children,onClose,wide=false}:{title:string;subtitle?:string;children:ReactNode;onClose:()=>void;wide?:boolean}){
 const dialog=useRef<HTMLDialogElement>(null)
 useEffect(()=>{const d=dialog.current;const previous=document.activeElement as HTMLElement|null;d?.showModal();const old=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{d?.close();document.body.style.overflow=old;previous?.focus()}},[])
 return <dialog ref={dialog} className={'modal '+(wide?'wide':'')} aria-labelledby="modal-title" onCancel={e=>{e.preventDefault();onClose()}} onClick={e=>{if(e.target===dialog.current){const r=dialog.current.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)onClose()}}}><div className="modal-heading"><div><h2 id="modal-title">{title}</h2>{subtitle&&<p>{subtitle}</p>}</div><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={21}/></button></div>{children}</dialog>
}

