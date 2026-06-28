'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'

type Service = { id: string; name: string; type: string; date: string }
type Person = { id: string; firstName: string; lastName: string; type: string; phone: string | null }

export default function CheckinPage() {
  const { qrToken } = useParams<{ qrToken: string }>()

  const [service, setService] = useState<Service | null>(null)
  const [status, setStatus] = useState<'loading' | 'unavailable' | 'ready'>('loading')

  const [query, setQuery] = useState('')
  const [persons, setPersons] = useState<Person[]>([])
  const [searching, setSearching] = useState(false)
  const [registered, setRegistered] = useState<Record<string, boolean>>({})
  const [checkingIn, setCheckingIn] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch(`/api/checkin/${qrToken}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) { setStatus('unavailable'); return }
        setService(data)
        setStatus('ready')
      })
  }, [qrToken])

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    if (!query.trim()) { setPersons([]); return }
    timer.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/persons/search?q=${encodeURIComponent(query)}`)
        setPersons(await res.json())
      } finally { setSearching(false) }
    }, 300)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [query])

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  async function checkIn(person: Person) {
    if (!service) return
    setCheckingIn(person.id)
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personId: person.id, serviceId: service.id, method: 'QR' }),
      })
      const data = await res.json()
      setRegistered(r => ({ ...r, [person.id]: true }))
      if (data.alreadyRegistered) {
        showToast(`${person.firstName} ya estaba registrado`, false)
      } else {
        showToast(`${person.firstName} ${person.lastName} ✓`)
        setQuery('')
        setPersons([])
      }
    } finally { setCheckingIn(null) }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-400 text-lg">Cargando...</p>
      </div>
    )
  }

  if (status === 'unavailable') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center">
        <div className="text-6xl mb-5">🔒</div>
        <h1 className="text-2xl font-bold text-gray-900">Servicio no disponible</h1>
        <p className="text-gray-400 mt-2">Este servicio no existe o no está abierto actualmente.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="bg-blue-600 text-white px-5 py-5 shadow-md">
        <p className="text-xs font-semibold uppercase tracking-widest opacity-70">Auto Check-in</p>
        <h1 className="text-2xl font-bold mt-0.5">{service!.name}</h1>
        <p className="text-sm opacity-70 mt-1">
          {new Date(service!.date).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </header>

      {/* Search */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-100">
        <p className="text-sm text-gray-500 mb-3">Busca tu nombre para registrar tu asistencia</p>
        <input
          type="search"
          placeholder="Escribe tu nombre..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full text-[#111] text-xl px-5 py-4 rounded-2xl border border-[#D1D5DB] bg-white placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
          autoFocus
          autoComplete="off"
        />
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-8 space-y-3">
        {searching && (
          <p className="text-center text-gray-400 py-8">Buscando...</p>
        )}

        {!searching && persons.map(person => {
          const done = registered[person.id]
          const busy = checkingIn === person.id
          return (
            <button
              key={person.id}
              disabled={done || busy}
              onClick={() => checkIn(person)}
              className={`w-full flex items-center justify-between px-5 py-5 rounded-2xl border shadow-sm transition-all active:scale-[0.98] text-left ${
                done
                  ? 'bg-green-50 border-green-200 cursor-default'
                  : 'bg-white border-[#D1D5DB] hover:bg-blue-50 hover:border-blue-300'
              }`}
            >
              <div>
                <p className="text-xl font-semibold text-[#111]">{person.firstName} {person.lastName}</p>
                <p className="text-sm text-gray-400 mt-0.5">
                  {person.type === 'MEMBER' ? 'Miembro' : 'Visitante'}
                  {person.phone ? ` · ${person.phone}` : ''}
                </p>
              </div>
              <span>
                {done ? (
                  <span className="text-green-600 font-semibold text-sm">Registrado ✓</span>
                ) : busy ? (
                  <span className="text-blue-400 animate-pulse text-2xl">···</span>
                ) : (
                  <span className="text-blue-400 text-4xl leading-none">›</span>
                )}
              </span>
            </button>
          )
        })}

        {!searching && query.trim() && persons.length === 0 && (
          <div className="flex flex-col items-center py-10 text-center">
            <p className="text-gray-400 text-base">No encontramos a <strong>"{query}"</strong></p>
            <p className="text-gray-400 text-sm mt-1">Acércate al portero para registrarte</p>
          </div>
        )}

        {!query && (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="text-5xl mb-4">👆</div>
            <p className="text-gray-400">Escribe tu nombre arriba para buscarte</p>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3.5 rounded-full shadow-xl text-base font-semibold z-50 whitespace-nowrap flex items-center gap-2 ${
          toast.ok ? 'bg-green-600 text-white' : 'bg-gray-800 text-white'
        }`}>
          {toast.ok && <span>✓</span>}
          {toast.msg}
        </div>
      )}
    </div>
  )
}
