'use client'
import { useEffect, useMemo, useState } from 'react'


const TYPES = [
{ key:'awards', label:'Awards' },
{ key:'courses', label:'Courses Taught' },
{ key:'research_published', label:'Research (Published)' },
{ key:'research_article', label:'Research (Article)' },
{ key:'scientific', label:'Scientific Activities' },
{ key:'university', label:'University Service' },
{ key:'community', label:'Community Service' },
]


export default function AllAchievementsScreen({ cycles }:{ cycles: Array<{ id:number; label:string; status:string }> }){
const [selected, setSelected] = useState<number | null>(cycles[0]?.id ?? null)
const [type, setType] = useState<string>(TYPES[0].key)
const [q, setQ] = useState('')
const [data, setData] = useState<any>(null)
const [loading, setLoading] = useState(false)


useEffect(()=>{ if (selected) fetchOne(selected) }, [selected])


async function fetchOne(appraisalId:number){
setLoading(true)
const res = await fetch(`/api/appraisals/${appraisalId}/achievements-summary`)
const j = await res.json().catch(()=>null)
setData(j)
setLoading(false)
}


const filtered = useMemo(()=>{
if (!data) return []
let rows:any[] = []
if (type==='awards') rows = data.awards ?? []
else if (type==='courses') rows = data.courses ?? []
else if (type==='research_published') rows = (data.research??[]).filter((r:any)=> (r.kind||'').toUpperCase()==='PUBLISHED')
else if (type==='research_article') rows = (data.research??[]).filter((r:any)=> (r.kind||'').toUpperCase()==='REFEREED_PAPER')
else if (type==='scientific') rows = data.scientific ?? []
else if (type==='university') rows = data.university ?? []
else if (type==='community') rows = data.community ?? []


if (!q) return rows
const qq = q.toLowerCase()
return rows.filter((r:any)=> JSON.stringify(r).toLowerCase().includes(qq))
}, [data, type, q])


function duplicateToCurrent(row:any){
const resource = type.startsWith('research_') ? 'research' : type
const payload = { ...row }
// sanitize id & foreign keys for creation
delete payload.id; delete payload.appraisalId; delete payload.createdAt; delete payload.updatedAt
if (type==='research_published') payload.kind = 'PUBLISHED'
if (type==='research_article') payload.kind = 'REFEREED_PAPER'
fetch(`/api/appraisals/current/${resource}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
.then(async(res)=>{ if (!res.ok) throw new Error('fail'); alert('Duplicated to current cycle'); })
.catch(()=> alert('Failed to duplicate'))
}


const current = cycles.find(c=>c.id===selected)
}