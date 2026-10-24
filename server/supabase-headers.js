/** Publishable/secret keys use apikey; only legacy JWT keys belong in Authorization. */
export function supabaseHeaders(key){
 if(typeof key!=='string'||!key.trim())throw new Error('A Supabase API key is required.')
 return {apikey:key,...(key.startsWith('eyJ')?{Authorization:'Bearer '+key}:{}),'Content-Type':'application/json'}
}
