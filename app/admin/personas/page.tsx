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

export default function PersonasPage() {
  const [persons, setPersons] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'' | 'MEMBER' | 'VISITOR'>('')
  const [statusFilter, setStatusFilter] = useState<'' | 'ACTIVE' | 'INACTIVE'>('')
  const [page, setPage] = useState(1)

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

  function handleFilterChange() {
    setPage(1)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Personas</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} registros</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Buscar por nombre..."
          value={search}
          onChange={e => { setSearch(e.target.value); handleFilterChange() }}
          className="px-3.5 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
        />
        <select
          value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value as '' | 'MEMBER' | 'VISITOR'); handleFilterChange() }}
          className="px-3.5 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Todos los tipos</option>
          <option value="MEMBER">Miembro</option>
          <option value="VISITOR">Visitante</option>
        </select>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value as '' | 'ACTIVE' | 'INACTIVE'); handleFilterChange() }}
          className="px-3.5 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Todos los estados</option>
          <option value="ACTIVE">Activo</option>
          <option value="INACTIVE">Inactivo</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
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
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0">
                          {p.firstName[0]}{p.lastName[0]}
                        </div>
                        <span className="font-medium text-gray-800">
                          {p.firstName} {p.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.type === 'MEMBER'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-purple-50 text-purple-700'
                      }`}>
                        {p.type === 'MEMBER' ? 'Miembro' : 'Visitante'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{p.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{p.neighborhood ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.status === 'ACTIVE'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {p.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {p.joinedAt
                        ? new Date(p.joinedAt).toLocaleDateString('es')
                        : new Date(p.createdAt).toLocaleDateString('es')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/personas/${p.id}`}
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
          <p className="text-gray-500">
            Página {page} de {totalPages}
          </p>
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
    </div>
  )
}
