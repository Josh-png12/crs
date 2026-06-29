'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

type User = { id: string; name: string; email: string; role: string; createdAt: string }

const ROLES = ['SUPER_ADMIN', 'PASTOR', 'DOORMAN'] as const
const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  PASTOR: 'Pastor',
  DOORMAN: 'Portero',
}

const INPUT = 'w-full px-3.5 py-2.5 rounded-lg border border-[#D1D5DB] text-[#111] bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors'
const LABEL = 'block text-xs font-semibold text-gray-600 mb-1'

const EMPTY = { name: '', email: '', password: '', role: 'DOORMAN' as string }

export default function UsuariosPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  const role = (session?.user as { role?: string })?.role
  const currentUserId = (session?.user as { id?: string })?.id

  useEffect(() => {
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(setUsers)
      .finally(() => setLoading(false))
  }, [])

  if (role && role !== 'SUPER_ADMIN') {
    return (
      <div className="p-8 pt-14 md:pt-8 flex flex-col items-center justify-center min-h-64">
        <p className="text-gray-500">No tienes permiso para acceder a esta sección.</p>
      </div>
    )
  }

  function setField<K extends keyof typeof EMPTY>(k: K, v: string) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function handleCreate() {
    if (!form.name || !form.email || !form.password) return
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Error al crear usuario')
        return
      }
      const user: User = await res.json()
      setUsers(u => [user, ...u])
      setShowModal(false)
      setForm(EMPTY)
    } finally { setSaving(false) }
  }

  function openEdit(u: User) {
    setEditingUser(u)
    setForm({ name: u.name, email: u.email, password: '', role: u.role })
    setError('')
  }

  function closeEdit() {
    setEditingUser(null)
    setForm(EMPTY)
    setError('')
  }

  async function handleEdit() {
    if (!editingUser || !form.name || !form.email) return
    setSaving(true); setError('')
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Error al actualizar usuario')
        return
      }
      const updated: User = await res.json()
      setUsers(u => u.map(x => x.id === updated.id ? updated : x))
      closeEdit()
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este usuario?')) return
    setDeleting(id)
    try {
      await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
      setUsers(u => u.filter(x => x.id !== id))
    } finally { setDeleting(null) }
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-5 pt-14 md:pt-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-sm text-gray-500 mt-0.5">{users.length} usuarios del sistema</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
        >
          + Crear usuario
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <p className="text-center text-gray-400 text-sm py-16">Cargando...</p>
        ) : users.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-16">Sin usuarios</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Usuario</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Rol</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Creado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
                        {u.name[0]}
                      </div>
                      <span className="font-medium text-gray-800">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      u.role === 'SUPER_ADMIN' ? 'bg-red-50 text-red-700'
                      : u.role === 'PASTOR' ? 'bg-purple-50 text-purple-700'
                      : 'bg-gray-100 text-gray-600'
                    }`}>
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(u.createdAt).toLocaleDateString('es')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => openEdit(u)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
                        disabled={deleting === u.id}
                        className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-40"
                      >
                        {deleting === u.id ? '...' : 'Eliminar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Editar usuario</h2>
              <button onClick={closeEdit} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={LABEL}>Nombre</label>
                <input className={INPUT} placeholder="Nombre completo" value={form.name} onChange={e => setField('name', e.target.value)} autoFocus />
              </div>
              <div>
                <label className={LABEL}>Email</label>
                <input type="email" className={INPUT} placeholder="correo@ejemplo.com" value={form.email} onChange={e => setField('email', e.target.value)} />
              </div>
              <div>
                <label className={LABEL}>Rol</label>
                <select
                  className={INPUT}
                  value={form.role}
                  onChange={e => setField('role', e.target.value)}
                  disabled={editingUser.id === currentUserId}
                >
                  {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
                {editingUser.id === currentUserId && (
                  <p className="text-xs text-gray-400 mt-1">No puedes cambiar tu propio rol.</p>
                )}
              </div>
              <div>
                <label className={LABEL}>Nueva contraseña <span className="font-normal text-gray-400">(dejar vacío para no cambiar)</span></label>
                <input type="password" className={INPUT} placeholder="Nueva contraseña" value={form.password} onChange={e => setField('password', e.target.value)} />
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={closeEdit} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50">Cancelar</button>
              <button onClick={handleEdit} disabled={saving || !form.name || !form.email} className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#111]">Crear usuario</h2>
              <button onClick={() => { setShowModal(false); setForm(EMPTY); setError('') }} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={LABEL}>Nombre</label>
                <input className={INPUT} placeholder="Nombre completo" value={form.name} onChange={e => setField('name', e.target.value)} autoFocus />
              </div>
              <div>
                <label className={LABEL}>Email</label>
                <input type="email" className={INPUT} placeholder="correo@ejemplo.com" value={form.email} onChange={e => setField('email', e.target.value)} />
              </div>
              <div>
                <label className={LABEL}>Contraseña</label>
                <input type="password" className={INPUT} placeholder="Mínimo 8 caracteres" value={form.password} onChange={e => setField('password', e.target.value)} />
              </div>
              <div>
                <label className={LABEL}>Rol</label>
                <select className={INPUT} value={form.role} onChange={e => setField('role', e.target.value)}>
                  {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={() => { setShowModal(false); setForm(EMPTY); setError('') }} className="flex-1 py-2.5 rounded-lg border border-[#D1D5DB] text-gray-600 text-sm font-medium hover:bg-gray-50">Cancelar</button>
              <button onClick={handleCreate} disabled={saving || !form.name || !form.email || !form.password} className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Creando...' : 'Crear usuario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
