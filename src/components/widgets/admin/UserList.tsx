"use client"

import { useState, useEffect, useMemo } from "react"
import axios from "axios"
import {
  Loader2,
  Trash2,
  User,
  Crown,
  RefreshCw,
  Search,
  Users,
  Mail,
} from "lucide-react"
import Swal from "sweetalert2"

const roles = {
  "1": { name: "usuario", icon: "👤" },
  "2": { name: "admin", icon: "👑" },
}

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("auth_token")
      const res = await axios.post("https://diplostore.fwh.is/diplo-store-api/api/users", { token: token })
      setUsers(res.data)
    } catch {
      Swal.fire("Error", "No se pudieron cargar los usuarios", "error")
    } finally {
      setLoading(false)
    }
  }

  const changeUserRole = async (id: string, roleId: string) => {
    const user = users.find(u => u.id === id)
    if (!user || user.role_id === "2") return

    const confirm = await Swal.fire({
      title: "¿Cambiar rol?",
      text: `Cambiar rol de ${user.first_name} ${user.last_name}`,
      showCancelButton: true,
      confirmButtonText: "Confirmar",
    })
    if (!confirm.isConfirmed) return

    try {
      setActionLoading(`role-${id}`)
      const token = localStorage.getItem("auth_token")

      await axios.post("https://diplostore.fwh.is/diplo-store-api/api/role", {
        token: token,
        user_id: id,
        new_role_id: roleId,
      })

      setUsers(users.map(u => u.id === id ? { ...u, role_id: roleId, role_name: roles[roleId].name } : u))
    } catch {
      Swal.fire("Error", "No se pudo cambiar el rol", "error")
    } finally {
      setActionLoading("")
    }
  }

  const deleteUser = async (id: string) => {
    const user = users.find(u => u.id === id)
    if (!user || user.role_id === "2") return

    const confirm = await Swal.fire({
      icon: "warning",
      title: "¿Eliminar usuario?",
      text: `Eliminar a ${user.first_name} ${user.last_name}`,
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
    })
    if (!confirm.isConfirmed) return

    try {
      setActionLoading(`delete-${id}`)
      const token = localStorage.getItem("auth_token")

      await axios.post("https://diplostore.fwh.is/diplo-store-api/api/delete-user", {
        token: token,
        user_id: id,
      })

      setUsers(users.filter(u => u.id !== id))
    } catch {
      Swal.fire("Error", "No se pudo eliminar el usuario", "error")
    } finally {
      setActionLoading("")
    }
  }

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch = `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(searchTerm.toLowerCase())
      const matchRole = roleFilter === "all" || u.role_name === roleFilter
      return matchSearch && matchRole
    })
  }, [users, searchTerm, roleFilter])

  useEffect(() => { fetchUsers() }, [])

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-teal-600">
      <Loader2 className="w-10 h-10 animate-spin mb-4" />
      <p className="text-lg font-semibold">Cargando usuarios...</p>
    </div>
  )

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-center text-3xl font-bold text-gray-800 flex items-center justify-center gap-2">
        <Users className="w-6 h-6 text-teal-600" />
        Gestión de Usuarios
      </h1>

      <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
        <div className="relative w-full md:w-1/2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-400 focus:outline-none"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-400 focus:outline-none bg-white text-gray-700 font-semibold"
        >
          <option value="all">Todos los roles</option>
          <option value="admin">👑 Administradores</option>
          <option value="usuario">👤 Usuarios</option>
        </select>

        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-xl hover:bg-teal-700 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      <div className="overflow-x-auto table-responsive bg-white rounded-xl shadow">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Usuario</th>
              <th className="px-4 py-3 text-left">Correo</th>
              <th className="px-4 py-3 text-center">Rol</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredUsers.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{user.first_name} {user.last_name}</td>
                <td className="px-4 py-3 text-gray-600">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {user.email}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <select
                    value={user.role_id}
                    onChange={(e) => changeUserRole(user.id, e.target.value)}
                    disabled={actionLoading === `role-${user.id}` || user.role_id === "2"}
                    className="bg-white border border-gray-300 rounded-full px-3 py-1.5 text-sm font-semibold focus:ring-2 focus:ring-teal-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    {Object.entries(roles).map(([id, role]) => (
                      <option key={id} value={id}>
                        {role.icon} {role.name.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-center">
                  {user.role_id === "2" ? (
                    <span className="text-gray-400 text-sm italic">No permitido</span>
                  ) : (
                    <button
                      onClick={() => deleteUser(user.id)}
                      disabled={actionLoading === `delete-${user.id}`}
                      className="text-red-500 hover:text-red-700 font-semibold text-sm transition"
                    >
                      {actionLoading === `delete-${user.id}` ? (
                        <Loader2 className="w-4 h-4 animate-spin inline" />
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 inline mr-1" />
                          Eliminar
                        </>
                      )}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="text-center py-10 text-gray-400">No se encontraron usuarios</div>
        )}
      </div>
    </div>
  )
}
