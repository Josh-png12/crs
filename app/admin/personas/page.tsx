'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Person = {
  id: string
  firstName: string
  lastName: string
  type: 'MEMBER' | 'VISITOR'
  phone: string | null
  neighborhood: string | null
  status: 'ACTIVE' | 'INACTIVE'
  joinedAt: string | null
  createdAt: string
}

const PAGE_SIZE = 20

const INPUT = 'w-full px-3.5 py-2.5 rounded-lg border border-[#D1D5DB] text-[#111] bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors'
const LABEL = 'block text-xs font-semibold text-gray-600 mb-1'

const EMPTY_FORM = {
  firstName: '', lastName: '', phone: '', whatsapp: '', email: '',
  birthDate: '', gender: '', maritalStatus: '', occupation: '',
  address: '', neighborhood: '', city: '',
  type: 'VISITOR' as 'MEMBER' | 'VISITOR',
  status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
}

export default function PersonasPage() {
  const [persons, setPersons] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'' | 'MEMBER' | 'VISITOR'>('')
  const [statusFilter, setStatusFilter] = useState<'' | 'ACTIVE' | 'INACTIVE'>('')
  const [page, setPage] = useState(1)

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/persons')
      .then(r => r.json())
      .then(setPersons)
      .finally(() => setLoading(false))
  }, [])

  const filtered = persons.filter(p => {
    const name = `${p.firstName} ${p.lastName}`.toLowerCase()
    if (search && !name.includes(search.toLowerCase())) return false
    if (typeFilter && p.type !== typeFilter) return false
    if (statusFilter && p.status !== statusFilter) return false
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function setField<K extends keyof typeof EMPTY_FORM>(k: K, v: (typeof EMPTY_FORM)[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function handleCreate() {
    if (!form.firstName.trim() || !form.lastName.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/persons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
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
          type: form.type,
          status: form.status,
        }),
      })
      const created: Person = await res.json()
      setPersons(ps => [created, ...ps])
      setShowModal(false)
      setForm(EMPTY_FORM)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-5 pt-14 md:pt-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Personas</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} registros</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
        >
          + Nueva persona
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Buscar por nombre..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="px-3.5 py-2 rounded-lg border border-[#D1D5DB] text-[#111] text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white w-56"
        />
        <select
          value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value as '' | 'MEMBER' | 'VISITOR'); setPage(1) }}
          className="px-3.5 py-2 rounded-lg border border-[#D1D5DB] text-[#111] text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
        >
          <option value="">Todos los tipos</option>
          <option value="MEMBER">Miembro</option>
          <option value="VISITOR">Visitante</option>
        </select>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value as '' | 'ACTIVE' | 'INACTIVE'); setPage(1) }}
          className="px-3.5 py-2 rounded-lg border border-[#D1D5DB] text-[#111] text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
        >
          <option value="">Todos los estados</option>
          <option value="ACTIVE">Activo</option>
          <option value="INACTIVE">Inactivo</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <p className="text-center text-gray-400 text-sm py-16">Cargando...</p>
        ) : paginated.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-16">Sin resultados</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Persona</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Tipo</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Teléfono</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Barrio</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Estado</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Ingreso</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map(p => (
                  <tr
                    key={p.id}
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                    onClick={() => window.location.href = `/admin/personas/${p.id}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0">
                          {p.firstName[0]}{p.lastName[0]}
                        </div>
                        <span className="font-medium text-gray-800">{p.firstName} {p.lastName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.type === 'MEMBER' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                      }`}>
                        {p.type === 'MEMBER' ? 'Miembro' : 'Visitante'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{p.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{p.neighborhood ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {p.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(p.joinedAt ?? p.createdAt).toLocaleDateString('es')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/personas/${p.id}`}
                        onClick={e => e.stopPropagation()}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Ver ficha →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-gray-500">Página {page} de {totalPages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Anterior
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* Nueva persona modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
              <h2 className="text-lg font-bold text-[#111]">Nueva persona</h2>
              <button
                onClick={() => { setShowModal(false); setForm(EMPTY_FORM) }}
                className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-5">
              {/* Datos básicos */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Datos básicos</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>Nombre <span className="text-red-500">*</span></label>
                    <input className={INPUT} placeholder="Nombre" value={form.firstName} onChange={e => setField('firstName', e.target.value)} autoFocus />
                  </div>
                  <div>
                    <label className={LABEL}>Apellido <span className="text-red-500">*</span></label>
                    <input className={INPUT} placeholder="Apellido" value={form.lastName} onChange={e => setField('lastName', e.target.value)} />
                  </div>
                  <div>
                    <label className={LABEL}>Teléfono</label>
                    <input className={INPUT} placeholder="Ej: 3001234567" value={form.phone} onChange={e => setField('phone', e.target.value)} />
                  </div>
                  <div>
                    <label className={LABEL}>WhatsApp</label>
                    <input className={INPUT} placeholder="Si es diferente al teléfono" value={form.whatsapp} onChange={e => setField('whatsapp', e.target.value)} />
                  </div>
                  <div>
                    <label className={LABEL}>Email</label>
                    <input type="email" className={INPUT} placeholder="correo@ejemplo.com" value={form.email} onChange={e => setField('email', e.target.value)} />
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
                    <input className={INPUT} placeholder="Profesión u ocupación" value={form.occupation} onChange={e => setField('occupation', e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Ubicación */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Ubicación</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>Barrio</label>
                    <input className={INPUT} placeholder="Barrio o sector" value={form.neighborhood} onChange={e => setField('neighborhood', e.target.value)} />
                  </div>
                  <div>
                    <label className={LABEL}>Ciudad</label>
                    <input className={INPUT} placeholder="Ciudad" value={form.city} onChange={e => setField('city', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <label className={LABEL}>Dirección</label>
                    <input className={INPUT} placeholder="Dirección completa" value={form.address} onChange={e => setField('address', e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Clasificación */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Clasificación</p>
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
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0">
              <button
                onClick={() => { setShowModal(false); setForm(EMPTY_FORM) }}
                className="flex-1 py-2.5 rounded-lg border border-[#D1D5DB] text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={saving || !form.firstName.trim() || !form.lastName.trim()}
                className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Guardando...' : 'Crear persona'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
