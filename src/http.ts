/** Empty successful responses (201/204) are valid for Supabase writes and logout. */
export async function jsonResponse(response:Response,fallback:string) {
 const raw=await response.text()
 let data:ReturnType<typeof JSON.parse>=null
 if(raw){try{data=JSON.parse(raw)}catch{throw new Error(response.ok?'The server returned an unreadable response.':fallback)}}
 if(!response.ok)throw new Error(data?.msg||data?.error_description||data?.message||(typeof data?.error==='string'?data.error:fallback))
 return data
}

