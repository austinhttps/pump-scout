import { StrictMode, Component } from 'react'
import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
class ErrorBoundary extends Component<{children:ReactNode},{error:boolean}>{state={error:false};static getDerivedStateFromError(){return{error:true}}render(){return this.state.error?<main className="fatal"><h1>Let's get you back on the road.</h1><p>The page ran into a problem. Your saved reports are still on this device.</p><button onClick={()=>location.reload()}>Reload PumpScout</button></main>:this.props.children}}
createRoot(document.getElementById('root')!).render(<StrictMode><ErrorBoundary><App/></ErrorBoundary></StrictMode>)

