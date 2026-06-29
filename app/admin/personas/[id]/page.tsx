'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

type Person = {
  id: string
  firstName: string
  lastName: string
  phone: string | null
  whatsapp: string | null
  email: string | null
  birthDate: string | null
  gender: string | null
  maritalStatus: string | null
  occupation: string | null
  address: string | null
  neighborhood: string | null
  city: string | null
  type: 'MEMBER' | 'VISITOR'
  status: 'ACTIVE' | 'INACTIVE'
  joinedAt: string | null
  createdAt: string
  photoUrl: string | null
  attendances: { id: string; createdAt: string; service: { name: string; date: string; type: string } }[]
}

type Note = { id: string; content: string; createdAt: string; isPrivate: boolean }
type PrayerRequest = { id: string; content: string; isActive: boolean; createdAt: string; resolvedAt: string | null }
type PastoralVisit = { id: string; visitedAt: string; outcome: string | null; notes: string | null; createdAt: string }
type SpecialEvent = { id: string; type: string; date: string; notes: string | null; createdAt: string }

const INPUT = 'w-full px-3.5 py-2.5 rounded-lg border border-[#D1D5DB] text-[#111] bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors'
const LABEL = 'block text-xs font-semibold text-gray-600 mb-1'
const TEXTAREA = 'w-full px-3.5 py-2.5 rounded-lg border border-[#D1D5DB] text-[#111] bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none transition-colors'

const SPECIAL_EVENT_LABELS: Record<string, string> = {
  BAPTISM: 'Bautismo',
  WEDDING: 'Boda',
  BABY_DEDICATION: 'Presentación de niño',
  SALVATION: 'Decisión de fe',
  OTHER: 'Otro',
}
const SPECIAL_EVENT_TYPES = Object.keys(SPECIAL_EVENT_LABELS)

const VISIT_OUTCOMES = ['Llamó exitoso', 'No contestó', 'Visita en persona', 'Otro']

const EMPTY_VISIT = { visitedAt: new Date().toISOString().split('T')[0], outcome: VISIT_OUTCOMES[0], notes: '' }
const EMPTY_EVENT = { type: 'BAPTISM', date: new Date().toISOString().split('T')[0], notes: '' }

export default function PersonDetailPage() {
  const { id } = useParams<{ id: string }>()

  const [person, setPerson] = useState<Person | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([])
  const [pastoralVisits, setPastoralVisits] = useState<PastoralVisit[]>([])
  const [specialEvents, setSpecialEvents] = useState<SpecialEvent[]>([])
  const [loading, setLoading] = useState(true)

  const [saving, setSaving] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [toast, setToast] = useState('')

  const [newPrayer, setNewPrayer] = useState('')
  const [savingPrayer, setSavingPrayer] = useState(false)

  const [showVisitModal, setShowVisitModal] = useState(false)
  const [visitForm, setVisitForm] = useState(EMPTY_VISIT)
  const [savingVisit, setSavingVisit] = useState(false)

  const [showEventModal, setShowEventModal] = useState(false)
  const [eventForm, setEventForm] = useState(EMPTY_EVENT)
  const [savingEvent, setSavingEvent] = useState(false)

  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', whatsapp: '', email: '',
    birthDate: '', gender: '', maritalStatus: '', occupation: '',
    address: '', neighborhood: '', city: '',
    type: 'VISITOR' as 'MEMBER' | 'VISITOR',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    joinedAt: '',
    photoUrl: '',
  })

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/persons/${id}`).then(r => r.json()),
      fetch(`/api/admin/pastoral-notes/${id}`).then(r => r.json()),
      fetch(`/api/admin/prayer-requests?personId=${id}`).then(r => r.json()),
      fetch(`/api/admin/pastoral-visits/${id}`).then(r => r.json()),
      fetch(`/api/admin/special-events/${id}`).then(r => r.json()),
    ]).then(([personData, notesData, prayersData, visitsData, eventsData]) => {
      setPerson(personData)
      setNotes(notesData)
      setPrayerRequests(Array.isArray(prayersData) ? prayersData : [])
      setPastoralVisits(Array.isArray(visitsData) ? visitsData : [])
      setSpecialEvents(Array.isArray(eventsData) ? eventsData : [])
      setForm({
        firstName: personData.firstName ?? '',
        lastName: personData.lastName ?? '',
        phone: personData.phone ?? '',
        whatsapp: personData.whatsapp ?? '',
        email: personData.email ?? '',
        birthDate: personData.birthDate ? personData.birthDate.split('T')[0] : '',
        gender: personData.gender ?? '',
        maritalStatus: personData.maritalStatus ?? '',
        occupation: personData.occupation ?? '',
        address: personData.address ?? '',
        neighborhood: personData.neighborhood ?? '',
        city: personData.city ?? '',
        type: personData.type,
        status: personData.status,
        joinedAt: personData.joinedAt ? personData.joinedAt.split('T')[0] : '',
        photoUrl: personData.photoUrl ?? '',
      })
    }).finally(() => setLoading(false))
  }, [id])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  function setField<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await fetch(`/api/admin/persons/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          phone: form.phone || null,
          whatsapp: form.whatsapp || null,
          email: form.email || null,
          birthDate: form.birthDate || null,
          gender: form.gender || null,
          maritalStatus: form.maritalStatus || null,
          occupation: form.occupation || null,
          address: form.address || null,
          neighborhood: form.neighborhood || null,
          city: form.city || null,
          joinedAt: form.joinedAt || null,
          photoUrl: form.photoUrl || null,
        }),
      })
      showToast('Cambios guardados ✓')
    } finally {
      setSaving(false)
    }
  }

  async function handleConvertToMember() {
    setSaving(true)
    try {
      await fetch(`/api/admin/persons/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          type: 'MEMBER',
          joinedAt: form.joinedAt || new Date().toISOString().split('T')[0],
          phone: form.phone || null,
          whatsapp: form.whatsapp || null,
          email: form.email || null,
          birthDate: form.birthDate || null,
          gender: form.gender || null,
          maritalStatus: form.maritalStatus || null,
          occupation: form.occupation || null,
          address: form.address || null,
          neighborhood: form.neighborhood || null,
          city: form.city || null,
        }),
      })
      setField('type', 'MEMBER')
      showToast('Convertido a miembro ✓')
    } finally {
      setSaving(false)
    }
  }

  async function handleAddNote() {
    if (!newNote.trim()) return
    setSavingNote(true)
    try {
      const res = await fetch(`/api/admin/pastoral-notes/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote.trim() }),
      })
      const note: Note = await res.json()
      setNotes(n => [note, ...n])
      setNewNote('')
    } finally {
      setSavingNote(false)
    }
  }

  async function handleAddPrayer() {
    if (!newPrayer.trim()) return
    setSavingPrayer(true)
    try {
      const res = await fetch('/api/admin/prayer-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personId: id, content: newPrayer.trim() }),
      })
      const pr: PrayerRequest = await res.json()
      setPrayerRequests(p => [pr, ...p])
      setNewPrayer('')
    } finally {
      setSavingPrayer(false)
    }
  }

  async function handleResolvePrayer(prId: string) {
    const res = await fetch(`/api/admin/prayer-requests/${prId}`, { method: 'PUT' })
    const updated: PrayerRequest = await res.json()
    setPrayerRequests(p => p.map(x => x.id === prId ? updated : x))
  }

  async function handleAddVisit() {
    setSavingVisit(true)
    try {
      const res = await fetch('/api/admin/pastoral-visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personId: id, ...visitForm }),
      })
      const visit: PastoralVisit = await res.json()
      setPastoralVisits(v => [visit, ...v])
      setShowVisitModal(false)
      setVisitForm(EMPTY_VISIT)
    } finally {
      setSavingVisit(false)
    }
  }

  async function handleAddEvent() {
    setSavingEvent(true)
    try {
      const res = await fetch('/api/admin/special-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personId: id, ...eventForm }),
      })
      const event: SpecialEvent = await res.json()
      setSpecialEvents(e => [event, ...e])
      setShowEventModal(false)
      setEventForm(EMPTY_EVENT)
    } finally {
      setSavingEvent(false)
    }
  }

  if (loading) return <div className="p-6 text-gray-400 text-sm pt-14 md:pt-6">Cargando...</div>
  if (!person) return <div className="p-6 text-gray-500 pt-14 md:pt-6">Persona no encontrada</div>

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6 pt-14 md:pt-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <Link href="/admin/personas" className="text-gray-400 hover:text-gray-600 text-sm">
            ← Personas
          </Link>
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg shrink-0 overflow-hidden">
            {form.photoUrl
              ? <img src={form.photoUrl} alt="foto" className="w-full h-full object-cover" />
              : <>{person.firstName[0]}{person.lastName[0]}</>
            }
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{person.firstName} {person.lastName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                form.type === 'MEMBER' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
              }`}>
                {form.type === 'MEMBER' ? 'Miembro' : 'Visitante'}
              </span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                form.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {form.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => window.print()}
            className="px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Imprimir historial
          </button>
          {form.type === 'VISITOR' && (
            <button
              onClick={handleConvertToMember}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Convertir a miembro
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">

          {/* Información personal */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Información personal</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Nombre</label>
                <input className={INPUT} value={form.firstName} onChange={e => setField('firstName', e.target.value)} />
              </div>
              <div>
                <label className={LABEL}>Apellido</label>
                <input className={INPUT} value={form.lastName} onChange={e => setField('lastName', e.target.value)} />
              </div>
              <div>
                <label className={LABEL}>Teléfono</label>
                <input className={INPUT} placeholder="—" value={form.phone} onChange={e => setField('phone', e.target.value)} />
              </div>
              <div>
                <label className={LABEL}>WhatsApp</label>
                <input className={INPUT} placeholder="—" value={form.whatsapp} onChange={e => setField('whatsapp', e.target.value)} />
              </div>
              <div>
                <label className={LABEL}>Email</label>
                <input type="email" className={INPUT} placeholder="—" value={form.email} onChange={e => setField('email', e.target.value)} />
              </div>
              <div>
                <label className={LABEL}>Fecha de nacimiento</label>
                <input type="date" className={INPUT} value={form.birthDate} onChange={e => setField('birthDate', e.target.value)} />
              </div>
              <div>
                <label className={LABEL}>Género</label>
                <select className={INPUT} value={form.gender} onChange={e => setField('gender', e.target.value)}>
                  <option value="">Sin especificar</option>
                  <option value="MALE">Masculino</option>
                  <option value="FEMALE">Femenino</option>
                  <option value="OTHER">Otro</option>
                </select>
              </div>
              <div>
                <label className={LABEL}>Estado civil</label>
                <select className={INPUT} value={form.maritalStatus} onChange={e => setField('maritalStatus', e.target.value)}>
                  <option value="">Sin especificar</option>
                  <option value="Soltero">Soltero/a</option>
                  <option value="Casado">Casado/a</option>
                  <option value="Viudo">Viudo/a</option>
                  <option value="Divorciado">Divorciado/a</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className={LABEL}>Ocupación</label>
                <input className={INPUT} placeholder="—" value={form.occupation} onChange={e => setField('occupation', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className={LABEL}>Foto</label>
                <div className="flex items-center gap-3">
                  {form.photoUrl && (
                    <img src={form.photoUrl} alt="foto" className="w-14 h-14 rounded-full object-cover border border-gray-200" />
                  )}
                  <label className="cursor-pointer px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    {form.photoUrl ? 'Cambiar foto' : 'Tomar / subir foto'}
                    <input
                      type="file"
                      accept="image/*"
                      capture="user"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        const reader = new FileReader()
                        reader.onload = ev => setField('photoUrl', ev.target?.result as string)
                        reader.readAsDataURL(file)
                      }}
                    />
                  </label>
                  {form.photoUrl && (
                    <button type="button" onClick={() => setField('photoUrl', '')} className="text-xs text-red-500 hover:text-red-700">
                      Quitar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Ubicación */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Ubicación</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Barrio</label>
                <input className={INPUT} placeholder="—" value={form.neighborhood} onChange={e => setField('neighborhood', e.target.value)} />
              </div>
              <div>
                <label className={LABEL}>Ciudad</label>
                <input className={INPUT} placeholder="—" value={form.city} onChange={e => setField('city', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className={LABEL}>Dirección</label>
                <input className={INPUT} placeholder="—" value={form.address} onChange={e => setField('address', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Clasificación */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Clasificación</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Tipo</label>
                <select className={INPUT} value={form.type} onChange={e => setField('type', e.target.value as 'MEMBER' | 'VISITOR')}>
                  <option value="VISITOR">Visitante</option>
                  <option value="MEMBER">Miembro</option>
                </select>
              </div>
              <div>
                <label className={LABEL}>Estado</label>
                <select className={INPUT} value={form.status} onChange={e => setField('status', e.target.value as 'ACTIVE' | 'INACTIVE')}>
                  <option value="ACTIVE">Activo</option>
                  <option value="INACTIVE">Inactivo</option>
                </select>
              </div>
              <div>
                <label className={LABEL}>Fecha de ingreso</label>
                <input type="date" className={INPUT} value={form.joinedAt} onChange={e => setField('joinedAt', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Notas pastorales */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Notas pastorales</h2>
            <div className="flex gap-2 mb-4">
              <textarea
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="Agregar nota..."
                rows={2}
                className={TEXTAREA + ' flex-1'}
              />
              <button
                onClick={handleAddNote}
                disabled={savingNote || !newNote.trim()}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition-colors self-end"
              >
                {savingNote ? '...' : 'Agregar'}
              </button>
            </div>
            {notes.length === 0 ? (
              <p className="text-gray-400 text-sm">Sin notas aún</p>
            ) : (
              <div className="space-y-3">
                {notes.map(n => (
                  <div key={n.id} className="border border-gray-100 rounded-lg p-3">
                    <p className="text-sm text-gray-700">{n.content}</p>
                    <p className="text-xs text-gray-400 mt-1.5">
                      {new Date(n.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}
                      {n.isPrivate && <span className="ml-2">· Privada</span>}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Peticiones de oración */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              Peticiones de oración
              {prayerRequests.filter(p => p.isActive).length > 0 && (
                <span className="ml-2 text-xs font-normal bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                  {prayerRequests.filter(p => p.isActive).length} activas
                </span>
              )}
            </h2>
            <div className="flex gap-2 mb-4">
              <textarea
                value={newPrayer}
                onChange={e => setNewPrayer(e.target.value)}
                placeholder="Escribe la petición..."
                rows={2}
                className={TEXTAREA + ' flex-1'}
              />
              <button
                onClick={handleAddPrayer}
                disabled={savingPrayer || !newPrayer.trim()}
                className="px-4 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg disabled:opacity-50 transition-colors self-end"
              >
                {savingPrayer ? '...' : 'Agregar'}
              </button>
            </div>
            {prayerRequests.length === 0 ? (
              <p className="text-gray-400 text-sm">Sin peticiones registradas</p>
            ) : (
              <div className="space-y-2">
                {prayerRequests.map(p => (
                  <div key={p.id} className={`border rounded-lg p-3 flex items-start justify-between gap-3 ${p.isActive ? 'border-amber-100 bg-amber-50/40' : 'border-gray-100'}`}>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${p.isActive ? 'text-gray-800' : 'text-gray-400 line-through'}`}>{p.content}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(p.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {!p.isActive && p.resolvedAt && (
                          <span className="ml-2 text-green-600">· Resuelta {new Date(p.resolvedAt).toLocaleDateString('es', { day: 'numeric', month: 'short' })}</span>
                        )}
                      </p>
                    </div>
                    {p.isActive && (
                      <button
                        onClick={() => handleResolvePrayer(p.id)}
                        className="shrink-0 text-xs text-green-700 bg-green-50 hover:bg-green-100 px-2 py-1 rounded-lg font-medium transition-colors"
                      >
                        Resuelta
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Visitas pastorales */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">
                Visitas pastorales
                <span className="ml-2 text-xs font-normal text-gray-400">({pastoralVisits.length})</span>
              </h2>
              <button
                onClick={() => setShowVisitModal(true)}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                + Registrar visita
              </button>
            </div>
            {pastoralVisits.length === 0 ? (
              <p className="text-gray-400 text-sm">Sin visitas registradas</p>
            ) : (
              <div className="space-y-2">
                {pastoralVisits.map(v => (
                  <div key={v.id} className="border border-gray-100 rounded-lg p-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-500">
                        {new Date(v.visitedAt).toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      {v.outcome && (
                        <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{v.outcome}</span>
                      )}
                    </div>
                    {v.notes && <p className="text-sm text-gray-700">{v.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Eventos especiales */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">
                Eventos especiales
                <span className="ml-2 text-xs font-normal text-gray-400">({specialEvents.length})</span>
              </h2>
              <button
                onClick={() => setShowEventModal(true)}
                className="text-xs font-medium text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                + Registrar evento
              </button>
            </div>
            {specialEvents.length === 0 ? (
              <p className="text-gray-400 text-sm">Sin eventos registrados</p>
            ) : (
              <div className="space-y-2">
                {specialEvents.map(e => (
                  <div key={e.id} className="border border-gray-100 rounded-lg p-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-medium bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                        {SPECIAL_EVENT_LABELS[e.type] ?? e.type}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(e.date).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    {e.notes && <p className="text-sm text-gray-700 mt-1">{e.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Attendance history */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 h-fit">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Asistencias
            <span className="ml-2 text-xs font-normal text-gray-400">({person.attendances.length})</span>
          </h2>
          {person.attendances.length === 0 ? (
            <p className="text-gray-400 text-sm">Sin asistencias registradas</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {person.attendances.map(a => (
                <div key={a.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">{a.service.name}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(a.service.date).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Registrar visita pastoral */}
      {showVisitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Registrar visita pastoral</h2>
              <button onClick={() => setShowVisitModal(false)} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={LABEL}>Fecha</label>
                <input type="date" className={INPUT} value={visitForm.visitedAt} onChange={e => setVisitForm(f => ({ ...f, visitedAt: e.target.value }))} />
              </div>
              <div>
                <label className={LABEL}>Resultado</label>
                <select className={INPUT} value={visitForm.outcome} onChange={e => setVisitForm(f => ({ ...f, outcome: e.target.value }))}>
                  {VISIT_OUTCOMES.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>Notas</label>
                <textarea rows={3} className={TEXTAREA} placeholder="Observaciones..." value={visitForm.notes} onChange={e => setVisitForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowVisitModal(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50">Cancelar</button>
              <button onClick={handleAddVisit} disabled={savingVisit || !visitForm.visitedAt} className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                {savingVisit ? 'Guardando...' : 'Registrar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Registrar evento especial */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Registrar evento especial</h2>
              <button onClick={() => setShowEventModal(false)} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={LABEL}>Tipo de evento</label>
                <select className={INPUT} value={eventForm.type} onChange={e => setEventForm(f => ({ ...f, type: e.target.value }))}>
                  {SPECIAL_EVENT_TYPES.map(t => <option key={t} value={t}>{SPECIAL_EVENT_LABELS[t]}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>Fecha</label>
                <input type="date" className={INPUT} value={eventForm.date} onChange={e => setEventForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label className={LABEL}>Notas</label>
                <textarea rows={3} className={TEXTAREA} placeholder="Detalles del evento..." value={eventForm.notes} onChange={e => setEventForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowEventModal(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50">Cancelar</button>
              <button onClick={handleAddEvent} disabled={savingEvent || !eventForm.date} className="flex-1 py-2.5 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-50">
                {savingEvent ? 'Guardando...' : 'Registrar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-3 rounded-full shadow-xl text-sm font-medium z-50">
          {toast}
        </div>
      )}
    </div>
  )
}
