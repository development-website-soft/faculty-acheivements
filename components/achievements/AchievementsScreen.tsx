
"use client"
import useSWR from 'swr'
import { useMemo, useState, useEffect } from 'react'
import { Trash2, Edit, CheckCircle, FolderOpen, FileText, LogOut, Menu, X, Printer, Upload, Plus } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const fetcher = (u:string)=>fetch(u).then(r=>r.json())

// Generic small UI atoms --------------------------------------------------
function SectionBar({ title, onAdd, onRefresh }:{ title:string; onAdd:()=>void; onRefresh:()=>void }){
  return (
    <div className="flex items-center justify-between mt-6">
      <div className="font-medium">{title}</div>
      <div className="flex gap-2">
        <button onClick={onAdd} className="px-3 py-1.5 rounded bg-gray-900 text-white text-sm">+ ADD</button>
        <button onClick={onRefresh} className="px-2 py-1.5 rounded border text-sm" title="Refresh">⟳</button>
      </div>
    </div>
  )
}

function Table({ columns, rows }:{ columns: Array<{ key:string; label:string; render?:(v:any,row:any)=>any }>; rows:any[] }){
  return (
    <div className="rounded-2xl border bg-white overflow-auto">
      <table className="w-full text-sm min-w-[860px]">
        <thead className="bg-gray-50">
          <tr>
            {columns.map(c => <th key={c.key} className="p-2 text-left">{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows?.length ? rows.map((r:any)=> (
            <tr key={r.id} className="border-t">
              {columns.map(c => (
                <td key={c.key} className="p-2">{c.render? c.render(r[c.key], r) : (r[c.key] ?? '—')}</td>
              ))}
            </tr>
          )) : (
            <tr><td className="p-3 text-gray-500" colSpan={columns.length}>No data</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function Modal({ open, title, onClose, children }:{ open:boolean; title:string; onClose:()=>void; children:any }){
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-xl bg-white rounded-2xl p-4" onClick={e=>e.stopPropagation()}>
        <div className="font-semibold mb-1">{title}</div>
        <div className="text-xs text-gray-500 mb-3">Add achievement</div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }:{ label:string; children:any }){
  return (
    <label className="block mb-2">
      <div className="text-sm mb-1">{label}</div>
      {children}
    </label>
  )
}

function Input(props:any){ return <input {...props} className={`border rounded px-3 py-2 w-full ${props.className||''}`} /> }

function FileInput({ label, value, onChange, entityType, entityId, achievementType }: { label: string; value?: string; onChange: (value: string) => void; entityType: string; entityId: string; achievementType?: string }) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleFileUpload = async (file: File) => {
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', entityType)
      formData.append('entityId', entityId)
      if (achievementType) {
        formData.append('achievementType', achievementType)
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        onChange(data.url)
      } else {
        const errorData = await response.json().catch(() => ({}))
        alert(`فشل في رفع الملف: ${errorData.error || 'خطأ غير معروف'}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('فشل في رفع الملف. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      await handleFileUpload(file)
    }
  }

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)

    const file = event.dataTransfer.files?.[0]
    if (file) {
      await handleFileUpload(file)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)
  }

  return (
    <div className="space-y-2">
      <div className="text-sm mb-1">{label}</div>
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
          isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="space-y-2">
          <div className="text-sm text-gray-600">
            {isDragOver ? 'Drop file here' : 'Drag & drop a file here, or click to select'}
          </div>
          <input
            type="file"
            onChange={handleInputChange}
            disabled={isUploading}
            className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            id={`file-input-${label}`}
          />
          <label
            htmlFor={`file-input-${label}`}
            className="inline-block px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded cursor-pointer text-sm"
          >
            Choose File
          </label>
          {isUploading && <div className="text-sm text-gray-500">Uploading...</div>}
        </div>
      </div>
      {value && (
        <div className="text-sm text-blue-600">
          <a href={value} target="_blank" rel="noopener noreferrer" className="underline">
            <FolderOpen size={14} className="inline mr-1" />
            View uploaded file
          </a>
        </div>
      )}
    </div>
  )
}

// Main screen -------------------------------------------------------------
export default function AchievementsScreen(){
  const { data, isLoading, mutate } = useSWR('/api/appraisals/current', fetcher)
  const [modal, setModal] = useState<null | { key: string; title: string; editData?: any; editId?: number }>(null)

  // Extract appraisal ID from API response
  const appraisalId = data?.appraisalId

  async function add(resource:string, payload:any){
    try {
      const res = await fetch(`/api/appraisals/current/${resource}`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        alert(`Failed to add: ${errorData.error || 'Unknown error'}`)
        return
      }
      await mutate()
      setModal(null)
    } catch (error) {
      console.error('Error adding achievement:', error)
      alert('Failed to add achievement. Please try again.')
    }
  }
  async function edit(resource:string, id:number, payload:any){
    try {
      const res = await fetch(`/api/appraisals/current/${resource}/${id}`, {
        method:'PATCH',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        alert(`Failed to update: ${errorData.error || 'Unknown error'}`)
        return
      }
      await mutate()
      setModal(null)
    } catch (error) {
      console.error('Error updating achievement:', error)
      alert('Failed to update achievement. Please try again.')
    }
  }
  async function del(resource:string, id:number){
    if (!confirm('هل أنت متأكد من حذف هذا العنصر؟')) return
    try {
      const res = await fetch(`/api/appraisals/current/${resource}/${id}`, { method:'DELETE' })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        alert(`فشل في الحذف: ${errorData.error || 'خطأ غير معروف'}`)
        return
      }
      await mutate()
    } catch (error) {
      console.error('Error deleting achievement:', error)
      alert('فشل في حذف الإنجاز. يرجى المحاولة مرة أخرى.')
    }
  }

  if (isLoading) return <p>Loading…</p>

  // Helpers to render action column
  const link = (url?:string)=> url? <a className="underline" href={url} target="_blank"><FolderOpen size={15} /></a> : '—'
  const editBtn = (res:string)=> (_:any, row:any)=> (
    <button onClick={()=>{
      setModal({ key:res, title:`Edit ${res.toUpperCase()}`, editData: row, editId: row.id })
    }} className="text-blue-600 underline mr-2">
      <Edit size={15} />
    </button>
  )
  const delBtn = (res:string)=> (_:any, row:any)=> <button onClick={()=>del(res, row.id)} className="text-red-600 underline"><Trash2 size={15} /></button>

  // ------------------ Awards ------------------
  const awardsCols = [
    { key:'name', label:'Name' },
    { key:'area', label:'Generated Area' },
    { key:'organization', label:'Generating Organization' },
    { key:'dateObtained', label:'Date Obtained', render:(v:any)=> v? new Date(v).toLocaleDateString():'—' },
    { key:'attachment', label:'Attachment', render:(v:any)=> link(v) },
    { key:'action', label:'Action', render: (v:any, row:any) => (
      <div className="flex gap-2">
        {editBtn('awards')(v, row)}
        {delBtn('awards')(v, row)}
      </div>
    ) },
  ]

  // ------------------ Courses -----------------
  const coursesCols = [
    { key:'academicYear', label:'Academic Year' },
    { key:'semester', label:'Semester' },
    { key:'courseCode', label:'Course Code' },
    { key:'section', label:'Section' },
    { key:'courseTitle', label:'Course Title' },
    { key:'credit', label:'Course Credit' },
    { key:'studentsCount', label:'Number Of Students' },
    { key:'studentsEvalAvg', label:'Student Evaluation' },
    { key:'action', label:'Action', render: (v:any, row:any) => (
      <div className="flex gap-2">
        {editBtn('courses')(v, row)}
        {delBtn('courses')(v, row)}
      </div>
    ) },
  ]

  // -------- Research (Published Paper) --------
  const published = (data?.research || []).filter((r:any)=> (r.kind||'').toUpperCase()==='PUBLISHED')
  const publishedCols = [
    { key:'title', label:'Title' },
    { key:'type', label:'Type' },
    { key:'journalOrPublisher', label:'Name Of The Journal' },
    { key:'participation', label:'Nature Of Participation' },
    { key:'publicationDate', label:'Date Of Publication', render:(v:any)=> v? new Date(v).toLocaleDateString():'—' },
    { key:'attachment', label:'Attachment', render:(v:any)=> link(v) },
    { key:'action', label:'Action', render: (v:any, row:any) => (
      <div className="flex gap-2">
        <button onClick={()=>{
          setModal({ key:'research_article', title:'Edit RESEARCH ACTIVITIES (ARTICLE)', editData: row, editId: row.id })
        }} className="text-blue-600 underline mr-2">
          <Edit size={15} />
        </button>
        {delBtn('research')(v, row)}
      </div>
    ) },
  ]

  // ------------- Research (Article) ------------
  const articles = (data?.research || []).filter((r:any)=> (r.kind||'').toUpperCase()==='REFEREED_PAPER')
  const articlesCols = [
    { key:'title', label:'Title' },
    { key:'refereedArticleRef', label:'Refereed Article Reference', render:(v:any, r:any)=> r.refereedArticleRef || '—' },
    { key:'journalOrPublisher', label:'Name Of The Journal' },
    { key:'publicationDate', label:'Date Of Submitting', render:(v:any)=> v? new Date(v).toLocaleDateString():'—' },
    { key:'attachment', label:'Attachment', render:(v:any)=> link(v) },
    { key:'action', label:'Action', render: (v:any, row:any) => (
      <div className="flex gap-2">
        <button onClick={()=>{
          setModal({ key:'research_published', title:'Edit RESEARCH ACTIVITIES (PUBLISHED PAPER)', editData: row, editId: row.id })
        }} className="text-blue-600 underline mr-2">
          <Edit size={15} />
        </button>
        {delBtn('research')(v, row)}
      </div>
    ) },
  ]

  // --------------- Scientific -----------------
  const scientificCols = [
    { key:'title', label:'Title' },
    { key:'type', label:'Type' },
    { key:'date', label:'Date', render:(v:any)=> v? new Date(v).toLocaleDateString():'—' },
    { key:'participation', label:'Type Of Participation' },
    { key:'organizingAuth', label:'Organizing Authority' },
    { key:'venue', label:'Venue' },
    { key:'attachment', label:'Attachment', render:(v:any)=> link(v) },
    { key:'action', label:'Action', render: (v:any, row:any) => (
      <div className="flex gap-2">
        {editBtn('scientific')(v, row)}
        {delBtn('scientific')(v, row)}
      </div>
    ) },
  ]

  // --------------- University Service ----------
  const univCols = [
    { key:'committeeOrTask', label:'Committee Or Task' },
    { key:'authority', label:'Authority' },
    { key:'participation', label:'Nature Of Participation' },
    { key:'dateTo', label:'Date To', render:(v:any)=> v? new Date(v).toLocaleDateString():'—' },
    { key:'dateFrom', label:'Date From', render:(v:any)=> v? new Date(v).toLocaleDateString():'—' },
    { key:'attachment', label:'Attachment', render:(v:any)=> link(v) },
    { key:'action', label:'Action', render: (v:any, row:any) => (
      <div className="flex gap-2">
        {editBtn('university')(v, row)}
        {delBtn('university')(v, row)}
      </div>
    ) },
  ]

  // --------------- Community Service ----------
  const commCols = [
    { key:'committeeOrTask', label:'Committee Or Task' },
    { key:'authority', label:'Authority' },
    { key:'participation', label:'Nature Of Participation' },
    { key:'dateTo', label:'Date To', render:(v:any)=> v? new Date(v).toLocaleDateString():'—' },
    { key:'dateFrom', label:'Date From', render:(v:any)=> v? new Date(v).toLocaleDateString():'—' },
    { key:'attachment', label:'Attachment', render:(v:any)=> link(v) },
    { key:'action', label:'Action', render: (v:any, row:any) => (
      <div className="flex gap-2">
        {editBtn('community')(v, row)}
        {delBtn('community')(v, row)}
      </div>
    ) },
  ]

  return (
    <div className="space-y-3">
      {/* Awards */}
      <SectionBar title="Awards And Acknowledging Certificates" onAdd={()=>setModal({ key:'awards', title:'AWARDS AND ACKNOWLEDGING CERTIFICATES' })} onRefresh={()=>mutate()} />
      <Table columns={awardsCols} rows={data?.awards||[]} />

      {/* Courses Taught */}
      <SectionBar title="Courses Taught" onAdd={()=>setModal({ key:'courses', title:'COURSES TAUGHT' })} onRefresh={()=>mutate()} />
      <Table columns={coursesCols} rows={data?.courses||[]} />

      {/* Research Published */}
      <SectionBar title="Research Activities (Published Paper)" onAdd={()=>setModal({ key:'research_published', title:'RESEARCH ACTIVITIES (PUBLISHED PAPER)' })} onRefresh={()=>mutate()} />
      <Table columns={publishedCols} rows={published} />

      {/* Research Articles */}
      <SectionBar title="Research Activities (Article)" onAdd={()=>setModal({ key:'research_article', title:'RESEARCH ACTIVITIES (ARTICLE)' })} onRefresh={()=>mutate()} />
      <Table columns={articlesCols} rows={articles} />

      {/* Scientific */}
      <SectionBar title="Scientific Activities" onAdd={()=>setModal({ key:'scientific', title:'SCIENTIFIC ACTIVITIES' })} onRefresh={()=>mutate()} />
      <Table columns={scientificCols} rows={data?.scientific||[]} />

      {/* University Service */}
      <SectionBar title="University Service Achievements" onAdd={()=>setModal({ key:'university', title:'UNIVERSITY SERVICE ACHIEVEMENTS' })} onRefresh={()=>mutate()} />
      <Table columns={univCols} rows={data?.university||[]} />

      {/* Community Service */}
      <SectionBar title="Community Service Achievements" onAdd={()=>setModal({ key:'community', title:'COMMUNITY SERVICE ACHIEVEMENTS' })} onRefresh={()=>mutate()} />
      <Table columns={commCols} rows={data?.community||[]} />

      {/* Modals */}
      <AwardModal
        open={modal?.key==='awards'}
        title={modal?.title||''}
        onClose={()=>setModal(null)}
        onSubmit={(p)=>{
          if (modal?.editId) {
            edit('awards', modal.editId, p)
          } else {
            add('awards', p)
          }
        }}
        editData={modal?.editData}
        appraisalId={appraisalId}
      />
      <CourseModal
        open={modal?.key==='courses'}
        title={modal?.title||''}
        onClose={()=>setModal(null)}
        onSubmit={(p)=>{
          if (modal?.editId) {
            edit('courses', modal.editId, p)
          } else {
            add('courses', p)
          }
        }}
        editData={modal?.editData}
      />
      <ResearchModalPublished
        open={modal?.key==='research_published'}
        title={modal?.title||''}
        onClose={()=>setModal(null)}
        onSubmit={(p)=>{
          if (modal?.editId) {
            edit('research', modal.editId, { ...p, kind:'PUBLISHED' })
          } else {
            add('research', { ...p, kind:'PUBLISHED' })
          }
        }}
        editData={modal?.editData}
        appraisalId={appraisalId}
      />
      <ResearchModalArticle
        open={modal?.key==='research_article'}
        title={modal?.title||''}
        onClose={()=>setModal(null)}
        onSubmit={(p)=>{
          if (modal?.editId) {
            edit('research', modal.editId, { ...p, kind:'REFEREED_PAPER' })
          } else {
            add('research', { ...p, kind:'REFEREED_PAPER' })
          }
        }}
        editData={modal?.editData}
        appraisalId={appraisalId}
      />
      <ScientificModal
        open={modal?.key==='scientific'}
        title={modal?.title||''}
        onClose={()=>setModal(null)}
        onSubmit={(p)=>{
          if (modal?.editId) {
            edit('scientific', modal.editId, p)
          } else {
            add('scientific', p)
          }
        }}
        editData={modal?.editData}
        appraisalId={appraisalId}
      />
      <ServiceModal
        open={modal?.key==='university'}
        title={modal?.title||''}
        onClose={()=>setModal(null)}
        onSubmit={(p)=>{
          if (modal?.editId) {
            edit('university', modal.editId, p)
          } else {
            add('university', p)
          }
        }}
        editData={modal?.editData}
        appraisalId={appraisalId}
      />
      <ServiceModal
        open={modal?.key==='community'}
        title={modal?.title||''}
        onClose={()=>setModal(null)}
        onSubmit={(p)=>{
          if (modal?.editId) {
            edit('community', modal.editId, p)
          } else {
            add('community', p)
          }
        }}
        editData={modal?.editData}
        appraisalId={appraisalId}
      />
    </div>
  )
}

// -------------------- MODALS ------------------------------

function Actions({ onCancel }:{ onCancel:()=>void }){
  return (
    <div className="flex justify-end gap-2 mt-3">
      <button onClick={onCancel} className="px-3 py-1.5 rounded border">Cancel</button>
      <button type="submit" className="px-3 py-1.5 rounded bg-gray-900 text-white">Save</button>
    </div>
  )
}

// AWARDS
function AwardModal({ open, title, onClose, onSubmit, editData, appraisalId }:{ open:boolean; title:string; onClose:()=>void; onSubmit:(p:any)=>void; editData?:any; appraisalId?:number }){
  const [p, setP] = useState<any>(editData || {})

  // Update state when editData changes
  useEffect(() => {
    if (editData) {
      setP(editData)
    } else {
      setP({})
    }
  }, [editData])
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <form onSubmit={(e)=>{e.preventDefault(); onSubmit(p)}}>
        <Field label="Name"><Input value={p.name||''} onChange={(e: any)=>setP({...p,name:e.target.value})} /></Field>
        <Field label="Generated Area"><Input value={p.area||''} onChange={(e: any)=>setP({...p,area:e.target.value})} /></Field>
        <Field label="Generating Organization"><Input value={p.organization||''} onChange={(e: any)=>setP({...p,organization:e.target.value})} /></Field>
        <Field label="Date Obtained"><Input type="date" value={p.dateObtained ? new Date(p.dateObtained).toISOString().split('T')[0] : ''} onChange={(e: any)=>setP({...p,dateObtained:e.target.value})} /></Field>
        <FileInput label="Attachment" value={p.attachment||''} onChange={(value)=>setP({...p,attachment:value,fileUrl:value,fileKey:value})} entityType="achievement" entityId={appraisalId?.toString() || ''} achievementType="awards" />
        <Actions onCancel={onClose} />
      </form>
    </Modal>
  )
}

// COURSES
function CourseModal({ open, title, onClose, onSubmit, editData }:{ open:boolean; title:string; onClose:()=>void; onSubmit:(p:any)=>void; editData?:any }){
   const [p, setP] = useState<any>(editData || {})

   // Update state when editData changes
   useEffect(() => {
     if (editData) {
       setP(editData)
     } else {
       setP({})
     }
   }, [editData])
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <form onSubmit={(e)=>{e.preventDefault(); onSubmit(p)}}>
        <Field label="Academic Year"><Input placeholder="2024/2025" value={p.academicYear||''} onChange={e=>setP({...p,academicYear:e.target.value})} /></Field>
        <Field label="Semester">
          <Select value={p.semester||''} onValueChange={(value)=>setP({...p,semester:value})}>
            <SelectTrigger>
              <SelectValue placeholder="Select semester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="First">First</SelectItem>
              <SelectItem value="Second">Second</SelectItem>
              <SelectItem value="Summer">Summer</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Course Code"><Input placeholder="CS101" value={p.courseCode||''} onChange={e=>setP({...p,courseCode:e.target.value})} /></Field>
        <Field label="Section"><Input placeholder="A" value={p.section||''} onChange={e=>setP({...p,section:e.target.value})} /></Field>
        <Field label="Course Title"><Input value={p.courseTitle||''} onChange={e=>setP({...p,courseTitle:e.target.value})} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Course Credit"><Input type="number" step="0.5" value={p.credit||''} onChange={e=>setP({...p,credit:Number(e.target.value)})} /></Field>
          <Field label="Number Of Students"><Input type="number" value={p.studentsCount||''} onChange={e=>setP({...p,studentsCount:Number(e.target.value)})} /></Field>
        </div>
        <Field label="Student Evaluation Average"><Input type="number" step="0.01" min="0" max="5" placeholder="4.5" value={p.studentsEvalAvg||''} onChange={e=>setP({...p,studentsEvalAvg:Number(e.target.value)})} /></Field>
        <Actions onCancel={onClose} />
      </form>
    </Modal>
  )
}

// RESEARCH (PUBLISHED)
function ResearchModalPublished({ open, title, onClose, onSubmit, editData, appraisalId }:{ open:boolean; title:string; onClose:()=>void; onSubmit:(p:any)=>void; editData?:any; appraisalId?:number }){
  const [p, setP] = useState<any>(editData || {})

  // Update state when editData changes
  useEffect(() => {
    if (editData) {
      setP(editData)
    } else {
      setP({})
    }
  }, [editData])
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <form onSubmit={(e)=>{e.preventDefault(); onSubmit({...p, kind:'PUBLISHED'})}}>
        <Field label="Title"><Input value={p.title||''} onChange={(e: any)=>setP({...p,title:e.target.value})} /></Field>
        <Field label="Type">
          <Select value={p.type||''} onValueChange={(value)=>setP({...p,type:value})}>
            <SelectTrigger>
              <SelectValue placeholder="Select research activity type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="JOURNAL">Journal</SelectItem>
              <SelectItem value="CONFERENCE">Conference</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Name Of The Journal"><Input value={p.journalOrPublisher||''} onChange={(e: any)=>setP({...p,journalOrPublisher:e.target.value})} /></Field>
        <Field label="Nature Of Participation"><Input value={p.participation||''} onChange={(e: any)=>setP({...p,participation:e.target.value})} /></Field>
        <Field label="Date Of Publication"><Input type="date" value={p.publicationDate ? new Date(p.publicationDate).toISOString().split('T')[0] : ''} onChange={(e: any)=>setP({...p,publicationDate:e.target.value})} /></Field>
        <FileInput label="Attachment" value={p.attachment||''} onChange={(value)=>setP({...p,attachment:value,fileUrl:value,fileKey:value})} entityType="achievement" entityId={appraisalId?.toString() || ''} achievementType="research" />
        <Actions onCancel={onClose} />
      </form>
    </Modal>
  )
}

// RESEARCH (ARTICLE)
function ResearchModalArticle({ open, title, onClose, onSubmit, editData, appraisalId }:{ open:boolean; title:string; onClose:()=>void; onSubmit:(p:any)=>void; editData?:any; appraisalId?:number }){
  const [p, setP] = useState<any>(editData || {})

  // Update state when editData changes
  useEffect(() => {
    if (editData) {
      setP(editData)
    } else {
      setP({})
    }
  }, [editData])
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <form onSubmit={(e)=>{e.preventDefault(); onSubmit(p)}}>
        <Field label="Title"><Input value={p.title||''} onChange={e=>setP({...p,title:e.target.value})} /></Field>
        <Field label="Type">
          <Select value={p.type||''} onValueChange={(value)=>setP({...p,type:value})}>
            <SelectTrigger>
              <SelectValue placeholder="Select research activity type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="JOURNAL">Journal</SelectItem>
              <SelectItem value="CONFERENCE">Conference</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Refereed Article Reference"><Input value={p.refereedArticleRef||''} onChange={e=>setP({...p,refereedArticleRef:e.target.value})} /></Field>
        <Field label="Name Of The Journal"><Input value={p.journalOrPublisher||''} onChange={e=>setP({...p,journalOrPublisher:e.target.value})} /></Field>
        <Field label="Date Of Submitting"><Input type="date" value={p.publicationDate ? new Date(p.publicationDate).toISOString().split('T')[0] : ''} onChange={e=>setP({...p,publicationDate:e.target.value})} /></Field>
        <FileInput label="Attachment" value={p.attachment||''} onChange={(value)=>setP({...p,attachment:value,fileUrl:value,fileKey:value})} entityType="achievement" entityId={appraisalId?.toString() || ''} achievementType="research" />
        <Actions onCancel={onClose} />
      </form>
    </Modal>
  )
}

// SCIENTIFIC
function ScientificModal({ open, title, onClose, onSubmit, editData, appraisalId }:{ open:boolean; title:string; onClose:()=>void; onSubmit:(p:any)=>void; editData?:any; appraisalId?:number }){
  const [p, setP] = useState<any>(editData || {})

  // Update state when editData changes
  useEffect(() => {
    if (editData) {
      setP(editData)
    } else {
      setP({})
    }
  }, [editData])
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <form onSubmit={(e)=>{e.preventDefault(); onSubmit(p)}}>
        <Field label="Title"><Input value={p.title||''} onChange={e=>setP({...p,title:e.target.value})} /></Field>
        <Field label="Type">
          <Select value={p.type||''} onValueChange={(value)=>setP({...p,type:value})}>
            <SelectTrigger>
              <SelectValue placeholder="Select scientific activity type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CONFERENCE">Conference</SelectItem>
              <SelectItem value="SEMINAR">Seminar</SelectItem>
              <SelectItem value="WORKSHOP">Workshop</SelectItem>
              <SelectItem value="TRAINING">Training</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Date"><Input type="date" value={p.date ? new Date(p.date).toISOString().split('T')[0] : ''} onChange={e=>setP({...p,date:e.target.value})} /></Field>
        <Field label="Type Of Participation">
          <Select value={p.participation||''} onValueChange={(value)=>setP({...p,participation:value})}>
            <SelectTrigger>
              <SelectValue placeholder="Select participation type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MODERATOR">Moderator</SelectItem>
              <SelectItem value="COORDINATOR">Coordinator</SelectItem>
              <SelectItem value="PRESENTER">Presenter</SelectItem>
              <SelectItem value="PARTICIPANT">Participant</SelectItem>
              <SelectItem value="PAPER">Paper</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Organizing Authority"><Input value={p.organizingAuth||''} onChange={e=>setP({...p,organizingAuth:e.target.value})} /></Field>
        <Field label="Venue"><Input value={p.venue||''} onChange={e=>setP({...p,venue:e.target.value})} /></Field>
        <FileInput label="Attachment" value={p.attachment||''} onChange={(value)=>setP({...p,attachment:value,fileUrl:value,fileKey:value})} entityType="achievement" entityId={appraisalId?.toString() || ''} achievementType="scientific" />
        <Actions onCancel={onClose} />
      </form>
    </Modal>
  )
}

// SERVICE (University/Community)
function ServiceModal({ open, title, onClose, onSubmit, editData, appraisalId }:{ open:boolean; title:string; onClose:()=>void; onSubmit:(p:any)=>void; editData?:any; appraisalId?:number }){
  const [p, setP] = useState<any>(editData || {})

  // Update state when editData changes
  useEffect(() => {
    if (editData) {
      setP(editData)
    } else {
      setP({})
    }
  }, [editData])
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <form onSubmit={(e)=>{e.preventDefault(); onSubmit(p)}}>
        <Field label="Committee Or Task"><Input value={p.committeeOrTask||''} onChange={e=>setP({...p,committeeOrTask:e.target.value})} /></Field>
        <Field label="Authority"><Input value={p.authority||''} onChange={e=>setP({...p,authority:e.target.value})} /></Field>
        <Field label="Nature Of Participation"><Input value={p.participation||''} onChange={e=>setP({...p,participation:e.target.value})} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date From"><Input type="date" value={p.dateFrom ? new Date(p.dateFrom).toISOString().split('T')[0] : ''} onChange={e=>setP({...p,dateFrom:e.target.value})} /></Field>
          <Field label="Date To"><Input type="date" value={p.dateTo ? new Date(p.dateTo).toISOString().split('T')[0] : ''} onChange={e=>setP({...p,dateTo:e.target.value})} /></Field>
        </div>
        <FileInput label="Attachment" value={p.attachment||''} onChange={(value)=>setP({...p,attachment:value,fileUrl:value,fileKey:value})} entityType="achievement" entityId={appraisalId?.toString() || ''} achievementType="university" />
        <Actions onCancel={onClose} />
      </form>
    </Modal>
  )
}
