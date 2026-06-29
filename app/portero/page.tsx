'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState, useCallback } from 'react'
import { savePendingAttendance, getPendingAttendances, deletePendingAttendance } from '@/lib/offline-db'

type Service = { id: string; name: string; type: string; date: string }
type Person = { id: string; firstName: string; lastName: string; type: string; phone: string | null; photoUrl?: string | null }

const ARRIVAL_OPTIONS = [
  { value: '', label: 'Seleccionar...' },
  { value: 'Invitación personal', label: 'Invitación personal' },
  { value: 'Redes sociales', label: 'Redes sociales' },
  { value: 'Pasó por aquí', label: 'Pasó por aquí' },
  { value: 'Familiar', label: 'Familiar' },
  { value: 'Otro', label: 'Otro' },
]

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  birthDate: '',
  type: 'VISITOR' as 'MEMBER' | 'VISITOR',
  address: '',
  neighborhood: '',
  howTheyArrived: '',
  photoUrl: '',
}

const INPUT =
  'w-full text-[#111] text-base md:text-lg px-4 py-3.5 rounded-xl border border-[#D1D5DB] bg-white placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors'

const LABEL = 'block text-sm font-semibold text-gray-600 mb-1.5'

export default function PorteroPage() {
  // ── Services ──────────────────────────────────────────────────
  const [services, setServices] = useState<Service[]>([])
  const [activeService, setActiveService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)

  // ── Search ────────────────────────────────────────────────────
  const [query, setQuery] = useState('')
  const [persons, setPersons] = useState<Person[]>([])
  const [searching, setSearching] = useState(false)

  // ── Check-in ──────────────────────────────────────────────────
  const [registered, setRegistered] = useState<Record<string, boolean>>({})
  const [checkingIn, setCheckingIn] = useState<string | null>(null)

  // ── New person form ───────────────────────────────────────────
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [inviterQuery, setInviterQuery] = useState('')
  const [inviterResults, setInviterResults] = useState<Person[]>([])
  const [selectedInviter, setSelectedInviter] = useState<Person | null>(null)
  const [saving, setSaving] = useState(false)

  // ── Toast ─────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  // ── Offline ───────────────────────────────────────────────────
  const [isOnline, setIsOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inviterTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const syncPendingAttendances = useCallback(async () => {
    const pending = await getPendingAttendances()
    if (pending.length === 0) return 0

    setSyncing(true)
    let synced = 0
    for (const item of pending) {
      try {
        await fetch('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ personId: item.personId, serviceId: item.serviceId, method: item.method }),
        })
        await deletePendingAttendance(item.id)
        synced++
      } catch {
        // Still offline for this item — leave it
      }
    }
    setSyncing(false)
    const remaining = await getPendingAttendances()
    setPendingCount(remaining.length)
    return synced
  }, [])

  // Service worker + online/offline + pending count
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }

    setIsOnline(navigator.onLine)
    getPendingAttendances().then(p => setPendingCount(p.length))

    const handleOnline = async () => {
      setIsOnline(true)
      const pending = await getPendingAttendances()
      if (pending.length > 0) {
        showToast(`Conexión restaurada — sincronizando ${pending.length} registro${pending.length > 1 ? 's' : ''}...`)
        const synced = await syncPendingAttendances()
        if (synced > 0) showToast(`${synced} registro${synced > 1 ? 's' : ''} sincronizado${synced > 1 ? 's' : ''} ✓`)
      }
    }

    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [syncPendingAttendances])

  // Load active services
  useEffect(() => {
    fetch('/api/services/active')
      .then(r => r.json())
      .then((data: Service[]) => {
        setServices(data)
        if (data.length === 1) setActiveService(data[0])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Debounced search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (!query.trim()) { setPersons([]); return }
    searchTimer.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/persons/search?q=${encodeURIComponent(query)}`)
        setPersons(await res.json())
      } catch {
        setPersons([])
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [query])

  // Debounced inviter search
  useEffect(() => {
    if (inviterTimer.current) clearTimeout(inviterTimer.current)
    if (!inviterQuery.trim()) { setInviterResults([]); return }
    inviterTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/persons/search?q=${encodeURIComponent(inviterQuery)}`)
        setInviterResults(await res.json())
      } catch {
        setInviterResults([])
      }
    }, 300)
    return () => { if (inviterTimer.current) clearTimeout(inviterTimer.current) }
  }, [inviterQuery])

  async function checkIn(person: Person) {
    if (!activeService) return
    setCheckingIn(person.id)
    try {
      if (!isOnline) {
        // Save to IndexedDB
        await savePendingAttendance({
          id: crypto.randomUUID(),
          personId: person.id,
          serviceId: activeService.id,
          method: 'DOORMAN',
          createdAt: new Date().toISOString(),
          personName: `${person.firstName} ${person.lastName}`,
        })
        setRegistered(r => ({ ...r, [person.id]: true }))
        setPendingCount(c => c + 1)
        showToast(`${person.firstName} guardado offline ✓`)
        return
      }

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personId: person.id, serviceId: activeService.id, method: 'DOORMAN' }),
      })
      const data = await res.json()
      setRegistered(r => ({ ...r, [person.id]: true }))
      if (data.alreadyRegistered) {
        showToast(`${person.firstName} ya estaba registrado`, false)
      } else {
        showToast(`${person.firstName} ${person.lastName} registrado ✓`)
      }
    } finally {
      setCheckingIn(null)
    }
  }

  async function saveNewPerson() {
    if (!activeService || !form.firstName.trim() || !form.lastName.trim()) return
    if (!isOnline) {
      showToast('Sin conexión — el registro de personas nuevas requiere internet', false)
      return
    }
    setSaving(true)
    try {
      const personRes = await fetch('/api/persons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          birthDate: form.birthDate || null,
          type: form.type,
          address: form.address.trim() || null,
          neighborhood: form.neighborhood.trim() || null,
          howTheyArrived: form.howTheyArrived || null,
          photoUrl: form.photoUrl || null,
          invitedById: selectedInviter?.id ?? null,
        }),
      })
      const person: Person = await personRes.json()

      await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personId: person.id, serviceId: activeService.id, method: 'DOORMAN' }),
      })

      showToast(`${person.firstName} ${person.lastName} registrado ✓`)
      resetForm()
      setQuery('')
      setPersons([])
    } finally {
      setSaving(false)
    }
  }

  function openForm() {
    const parts = query.trim().split(/\s+/)
    setForm({
      ...EMPTY_FORM,
      firstName: parts[0] ?? '',
      lastName: parts.slice(1).join(' '),
    })
    setShowForm(true)
  }

  function resetForm() {
    setShowForm(false)
    setForm(EMPTY_FORM)
    setSelectedInviter(null)
    setInviterQuery('')
    setInviterResults([])
  }

  function setField<K extends keyof typeof EMPTY_FORM>(key: K, value: (typeof EMPTY_FORM)[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  // ── Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-xl text-gray-400">Cargando...</p>
      </div>
    )
  }

  // ── No active service ────────────────────────────────────────
  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white px-6 text-center">
        <div className="text-6xl mb-5">🚪</div>
        <h1 className="text-2xl font-bold text-[#111]">No hay servicio activo</h1>
        <p className="text-gray-400 mt-2 text-base">No hay ningún servicio abierto para hoy.</p>
      </div>
    )
  }

  // ── Service picker (more than one) ───────────────────────────
  if (services.length > 1 && !activeService) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white px-6">
        <h1 className="text-2xl font-bold text-[#111] mb-6 text-center">Selecciona el servicio</h1>
        <div className="w-full max-w-md space-y-3">
          {services.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveService(s)}
              className="w-full py-5 px-6 bg-white rounded-2xl border border-[#D1D5DB] shadow-sm text-left hover:border-blue-400 hover:bg-blue-50 active:scale-[0.98] transition-all"
            >
              <p className="text-lg font-semibold text-[#111]">{s.name}</p>
              <p className="text-gray-500 text-sm mt-1">
                {new Date(s.date).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ── Main view ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Blue header */}
      <header className="bg-blue-600 text-white px-5 py-4 shadow-md shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest opacity-70">Portero</p>
            <h1 className="text-xl md:text-2xl font-bold truncate">{activeService?.name}</h1>
          </div>
          {/* Connection indicator */}
          <div className="flex items-center gap-1.5 shrink-0 mt-1">
            <div className={`w-2 h-2 rounded-full shrink-0 ${isOnline ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`} />
            <span className="text-xs opacity-90 whitespace-nowrap">
              {isOnline
                ? syncing ? 'Sincronizando...' : 'En línea'
                : pendingCount > 0 ? `Sin conexión (${pendingCount} pendiente${pendingCount > 1 ? 's' : ''})` : 'Sin conexión'
              }
            </span>
          </div>
        </div>
      </header>

      {/* Connection banner */}
      {!isOnline && (
        <div className="bg-amber-50 border-b border-amber-200 px-5 py-2.5 shrink-0">
          <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
            <span>⚠️</span>
            Sin conexión — los registros de miembros conocidos se guardarán localmente
          </p>
        </div>
      )}

      {/* Search bar */}
      <div className="px-4 pt-4 pb-3 shrink-0 bg-white border-b border-gray-100">
        <input
          type="search"
          placeholder="Buscar persona por nombre..."
          value={query}
          onChange={e => { setQuery(e.target.value); if (showForm) setShowForm(false) }}
          className="w-full text-[#111] text-lg md:text-xl px-5 py-4 rounded-2xl border border-[#D1D5DB] bg-white placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
          autoComplete="off"
          autoFocus
        />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-8 space-y-3">

        {/* Searching indicator */}
        {searching && (
          <p className="text-center text-gray-400 py-6 text-base">Buscando...</p>
        )}

        {/* Person cards */}
        {!searching && persons.map(person => {
          const isRegistered = registered[person.id]
          const isChecking = checkingIn === person.id
          return (
            <button
              key={person.id}
              disabled={isRegistered || isChecking}
              onClick={() => checkIn(person)}
              className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border shadow-sm transition-all active:scale-[0.98] text-left ${
                isRegistered
                  ? 'bg-green-50 border-green-200 cursor-default'
                  : 'bg-white border-[#D1D5DB] hover:bg-blue-50 hover:border-blue-300 hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {person.photoUrl ? (
                  <img src={person.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0">
                    {person.firstName[0]}{person.lastName[0]}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-lg md:text-xl font-semibold text-[#111] truncate">
                    {person.firstName} {person.lastName}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {person.type === 'MEMBER' ? 'Miembro' : 'Visitante'}
                    {person.phone ? ` · ${person.phone}` : ''}
                  </p>
                </div>
              </div>
              <span className="ml-4 shrink-0">
                {isRegistered ? (
                  <span className="text-green-600 font-semibold text-sm whitespace-nowrap">
                    {!isOnline ? 'Guardado offline ✓' : 'Ya registrado ✓'}
                  </span>
                ) : isChecking ? (
                  <span className="text-blue-400 animate-pulse text-xl">···</span>
                ) : (
                  <span className="text-blue-400 text-3xl leading-none">›</span>
                )}
              </span>
            </button>
          )
        })}

        {/* No results */}
        {!searching && query.trim() && persons.length === 0 && !showForm && (
          <div className="flex flex-col items-center pt-4 space-y-4 pb-4">
            <p className="text-gray-500 text-base">
              Sin resultados para <strong>&ldquo;{query}&rdquo;</strong>
            </p>
            {isOnline ? (
              <button
                onClick={openForm}
                className="w-full max-w-sm bg-blue-600 text-white text-lg font-semibold py-4 rounded-2xl shadow hover:bg-blue-700 active:scale-[0.98] transition-all"
              >
                + Registrar nueva persona
              </button>
            ) : (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 px-4 py-3 rounded-xl text-center max-w-sm">
                Sin conexión — no es posible registrar personas nuevas offline
              </p>
            )}
          </div>
        )}

        {/* ── New person form ─────────────────────────────────── */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-[#D1D5DB] shadow-sm overflow-hidden">

            {/* Form header */}
            <div className="bg-gray-50 border-b border-[#D1D5DB] px-5 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#111]">Nueva persona</h2>
              <button
                type="button"
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600 text-xl font-light w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-5">

              {/* ── Section 1: Datos básicos ── */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Datos básicos</p>
                <div className="space-y-4">

                  {/* Photo capture */}
                  <div>
                    <label className={LABEL}>Foto (opcional)</label>
                    <div className="flex items-center gap-3">
                      {form.photoUrl ? (
                        <img src={form.photoUrl} alt="Foto" className="w-16 h-16 rounded-full object-cover border border-gray-200" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-2xl">📷</div>
                      )}
                      <label className="cursor-pointer px-4 py-2.5 rounded-xl border border-[#D1D5DB] text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                        {form.photoUrl ? 'Cambiar foto' : 'Tomar foto'}
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
                        <button type="button" onClick={() => setField('photoUrl', '')} className="text-gray-400 hover:text-red-500 text-lg">✕</button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={LABEL}>Nombre <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        placeholder="Nombre"
                        value={form.firstName}
                        onChange={e => setField('firstName', e.target.value)}
                        className={INPUT}
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className={LABEL}>Apellido <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        placeholder="Apellido"
                        value={form.lastName}
                        onChange={e => setField('lastName', e.target.value)}
                        className={INPUT}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={LABEL}>Teléfono</label>
                      <input
                        type="tel"
                        placeholder="Ej: 3001234567"
                        value={form.phone}
                        onChange={e => setField('phone', e.target.value)}
                        className={INPUT}
                      />
                    </div>
                    <div>
                      <label className={LABEL}>Email</label>
                      <input
                        type="email"
                        placeholder="correo@ejemplo.com"
                        value={form.email}
                        onChange={e => setField('email', e.target.value)}
                        className={INPUT}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={LABEL}>Fecha de nacimiento</label>
                    <input
                      type="date"
                      value={form.birthDate}
                      onChange={e => setField('birthDate', e.target.value)}
                      className={INPUT}
                    />
                  </div>

                  {/* Type toggle */}
                  <div>
                    <label className={LABEL}>Tipo</label>
                    <div className="flex rounded-xl border border-[#D1D5DB] overflow-hidden">
                      {(['VISITOR', 'MEMBER'] as const).map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setField('type', t)}
                          className={`flex-1 py-3.5 text-base md:text-lg font-semibold transition-colors ${
                            form.type === t
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {t === 'VISITOR' ? 'Visitante' : 'Miembro'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Section 2: Visitor extra fields ── */}
              {form.type === 'VISITOR' && (
                <div className="border-t border-[#D1D5DB] pt-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Información de visita</p>
                  <div className="space-y-4">

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={LABEL}>Barrio</label>
                        <input
                          type="text"
                          placeholder="Barrio o sector"
                          value={form.neighborhood}
                          onChange={e => setField('neighborhood', e.target.value)}
                          className={INPUT}
                        />
                      </div>
                      <div>
                        <label className={LABEL}>Dirección</label>
                        <input
                          type="text"
                          placeholder="Dirección (opcional)"
                          value={form.address}
                          onChange={e => setField('address', e.target.value)}
                          className={INPUT}
                        />
                      </div>
                    </div>

                    {/* How they arrived */}
                    <div>
                      <label className={LABEL}>¿Cómo llegó?</label>
                      <select
                        value={form.howTheyArrived}
                        onChange={e => setField('howTheyArrived', e.target.value)}
                        className={INPUT}
                      >
                        {ARRIVAL_OPTIONS.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Inviter search */}
                    <div>
                      <label className={LABEL}>¿Quién lo invitó? (opcional)</label>
                      {selectedInviter ? (
                        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-3.5">
                          <div>
                            <p className="font-semibold text-[#111] text-base">
                              {selectedInviter.firstName} {selectedInviter.lastName}
                            </p>
                            <p className="text-xs text-blue-600 mt-0.5">
                              {selectedInviter.type === 'MEMBER' ? 'Miembro' : 'Visitante'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => { setSelectedInviter(null); setInviterQuery('') }}
                            className="text-blue-400 hover:text-blue-600 text-lg font-bold ml-3 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Buscar por nombre..."
                            value={inviterQuery}
                            onChange={e => setInviterQuery(e.target.value)}
                            className={INPUT}
                          />
                          {inviterResults.length > 0 && (
                            <div className="rounded-xl border border-[#D1D5DB] overflow-hidden shadow-sm">
                              {inviterResults.map(m => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedInviter(m)
                                    setInviterQuery('')
                                    setInviterResults([])
                                  }}
                                  className="w-full text-left px-4 py-3.5 hover:bg-blue-50 border-b border-gray-100 last:border-0 transition-colors"
                                >
                                  <span className="font-semibold text-[#111]">
                                    {m.firstName} {m.lastName}
                                  </span>
                                  <span className="text-gray-400 text-sm ml-2">
                                    {m.type === 'MEMBER' ? 'Miembro' : 'Visitante'}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-4 rounded-xl border border-[#D1D5DB] text-gray-600 text-base font-semibold hover:bg-gray-50 active:scale-[0.98] transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={saveNewPerson}
                  disabled={saving || !form.firstName.trim() || !form.lastName.trim()}
                  className="flex-1 py-4 rounded-xl bg-blue-600 text-white text-base font-semibold hover:bg-blue-700 disabled:opacity-50 active:scale-[0.98] transition-all shadow-sm"
                >
                  {saving ? 'Guardando...' : 'Guardar y registrar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3.5 rounded-full shadow-xl text-base font-semibold z-50 whitespace-nowrap flex items-center gap-2 transition-all ${
          toast.ok
            ? 'bg-green-600 text-white'
            : 'bg-gray-800 text-white'
        }`}>
          {toast.ok && <span>✓</span>}
          {toast.msg}
        </div>
      )}
    </div>
  )
}
