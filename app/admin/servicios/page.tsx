'use client'

import { useEffect, useState } from 'react'
import { QRCodeDisplay } from '../QRCodeDisplay'

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://crs-flax.vercel.app'

type Service = {
  id: string
  name: string
  type: string
  date: string
  isOpen: boolean
  qrToken: string
  _count: { attendances: number }
}

type Attendee = {
  id: string
  person: { id: string; firstName: string; lastName: string; type: string }
  method: string
  createdAt: string
}

const SERVICE_TYPES = ['SUNDAY', 'CELL', 'SPECIAL', 'YOUTH', 'PRAYER']
const TYPE_LABELS: Record<string, string> = {
  SUNDAY: 'Domingo', CELL: 'Célula', SPECIAL: 'Especial', YOUTH: 'Jóvenes', PRAYER: 'Oración',
}

export default function ServiciosPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newService, setNewService] = useState({ name: '', type: 'SUNDAY', date: '' })

  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [loadingAttendees, setLoadingAttendees] = useState(false)

  useEffect(() => {
    fetch('/api/admin/services')
      .then(r => r.json())
      .then(setServices)
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate() {
    if (!newService.name.trim() || !newService.date) return
    setCreating(true)
    try {
      const res = await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newService),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(err.error ?? `Error ${res.status} al crear servicio`)
        return
      }
      const created: Service = await res.json()
      setServices(s => [created, ...s])
      setShowCreate(false)
      setNewService({ name: '', type: 'SUNDAY', date: '' })
    } finally {
      setCreating(false)
    }
  }

  async function toggleOpen(service: Service) {
    const updated = { ...service, isOpen: !service.isOpen }
    setServices(s => s.map(x => x.id === service.id ? updated : x))
    await fetch(`/api/admin/services/${service.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isOpen: !service.isOpen }),
    })
  }

  async function viewAttendees(service: Service) {
    setSelectedService(service)
    setLoadingAttendees(true)
    const res = await fetch(`/api/admin/services/${service.id}`)
    const data = await res.json()
    setAttendees(data.attendances ?? [])
    setLoadingAttendees(false)
  }

  const fieldClass = 'w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Servicios</h1>
          <p className="text-sm text-gray-500 mt-0.5">{services.length} servicios registrados</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          + Crear servicio
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Nuevo servicio</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nombre</label>
                <input
                  className={fieldClass}
                  placeholder="ej. Culto dominical"
                  value={newService.name}
                  onChange={e => setNewService(s => ({ ...s, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
                <select
                  className={fieldClass}
                  value={newService.type}
                  onChange={e => setNewService(s => ({ ...s, type: e.target.value }))}
                >
                  {SERVICE_TYPES.map(t => (
                    <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Fecha y hora</label>
                <input
                  type="datetime-local"
                  className={fieldClass}
                  value={newService.date}
                  onChange={e => setNewService(s => ({ ...s, date: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !newService.name.trim() || !newService.date}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? 'Creando...' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Services table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <p className="text-center text-gray-400 text-sm py-16">Cargando...</p>
        ) : services.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-16">Sin servicios registrados</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Nombre</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Tipo</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Fecha</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Asistentes</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Estado</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {services.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {TYPE_LABELS[s.type] ?? s.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(s.date).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-800">{s._count.attendances}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleOpen(s)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                          s.isOpen ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                          s.isOpen ? 'translate-x-4' : 'translate-x-0.5'
                        }`} />
                      </button>
                      <span className={`ml-2 text-xs font-medium ${s.isOpen ? 'text-green-600' : 'text-gray-400'}`}>
                        {s.isOpen ? 'Abierto' : 'Cerrado'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => viewAttendees(s)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Ver asistentes →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Attendees modal */}
      {selectedService && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selectedService.name}</h2>
                <p className="text-sm text-gray-500">
                  {attendees.length} asistentes ·{' '}
                  {new Date(selectedService.date).toLocaleDateString('es', { day: 'numeric', month: 'long' })}
                </p>
              </div>
              <button
                onClick={() => setSelectedService(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-light"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              {/* QR Code */}
              {selectedService && (
                <div className="py-4 border-b border-gray-100">
                  <QRCodeDisplay url={`${BASE_URL}/checkin/${selectedService.qrToken}`} />
                </div>
              )}
              {loadingAttendees ? (
                <p className="text-center text-gray-400 text-sm py-8">Cargando...</p>
              ) : attendees.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">Sin asistentes registrados</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {attendees.map(a => (
                    <div key={a.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
                          {a.person.firstName[0]}{a.person.lastName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {a.person.firstName} {a.person.lastName}
                          </p>
                          <p className="text-xs text-gray-400">
                            {a.person.type === 'MEMBER' ? 'Miembro' : 'Visitante'} · {a.method}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400">
                        {new Date(a.createdAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
