"use client"

import { useState, useEffect, useMemo } from "react"
import axios from "axios"
import {
  Loader2,
  RefreshCw,
  Search,
  ShoppingCart,
  Mail,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react"
import Swal from "sweetalert2"
import "sweetalert2/dist/sweetalert2.css"

const statusConfig = {
  paid: { name: "Pagado", icon: CheckCircle, color: "text-green-600", bg: "bg-green-100" },
  pending: { name: "Pendiente", icon: AlertCircle, color: "text-yellow-600", bg: "bg-yellow-100" },
  failed: { name: "Fallido", icon: XCircle, color: "text-red-600", bg: "bg-red-100" },
}

interface StripeOrder {
  order_id: string
  usuario: string
  correo: string
  monto_db: string
  fecha: string
  stripe:
    | {
        stripe_status: string
        stripe_total: number
        stripe_currency: string
        stripe_payment_intent: string
        stripe_email: string
        stripe_metadata: {
          nombre: string
          user_id: string
        }
      }
    | []
}

export default function StripeOrdersManagement() {
  const [orders, setOrders] = useState<StripeOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await axios.get("https://diplostore.fwh.is/diplo-store-api/api/gateway/orders")
      setOrders(res.data)
    } catch (error) {
      Swal.fire("Error", "No se pudieron cargar las órdenes", "error")
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getDateFilterOptions = () => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const lastWeek = new Date(today)
    lastWeek.setDate(lastWeek.getDate() - 7)
    const lastMonth = new Date(today)
    lastMonth.setMonth(lastMonth.getMonth() - 1)

    return { today, yesterday, lastWeek, lastMonth }
  }

  const getStripeData = (order) => {
    if (Array.isArray(order.stripe) || !order.stripe) {
      return {
        stripe_status: "pending",
        stripe_total: 0,
        stripe_currency: "USD",
        stripe_payment_intent: "N/A",
        stripe_email: order.correo,
        stripe_metadata: {
          nombre: order.usuario,
          user_id: "",
        },
      }
    }
    return order.stripe
  }

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const stripeData = getStripeData(order)

      const matchSearch = `${order.usuario} ${order.correo} ${order.order_id} ${stripeData.stripe_payment_intent}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())

      const matchStatus = statusFilter === "all" || stripeData.stripe_status === statusFilter

      let matchDate = true
      if (dateFilter !== "all") {
        const orderDate = new Date(order.fecha)
        const { today, yesterday, lastWeek, lastMonth } = getDateFilterOptions()

        switch (dateFilter) {
          case "today":
            matchDate = orderDate.toDateString() === today.toDateString()
            break
          case "yesterday":
            matchDate = orderDate.toDateString() === yesterday.toDateString()
            break
          case "week":
            matchDate = orderDate >= lastWeek
            break
          case "month":
            matchDate = orderDate >= lastMonth
            break
        }
      }

      return matchSearch && matchStatus && matchDate
    })
  }, [orders, searchTerm, statusFilter, dateFilter])

  const totalAmount = useMemo(() => {
    return filteredOrders.reduce((sum, order) => {
      const stripeData = getStripeData(order)
      const amount = stripeData.stripe_total || 0
      return sum + (typeof amount === "number" && !isNaN(amount) ? amount : 0)
    }, 0)
  }, [filteredOrders])

  useEffect(() => {
    fetchOrders()
  }, [])

  if (loading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-teal-600">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="text-lg font-semibold">Cargando órdenes...</p>
      </div>
    )

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-2 mb-2">
          <ShoppingCart className="w-6 h-6 text-teal-600" />
          Gestión de Ordenes Stripe
        </h1>
        <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <ShoppingCart className="w-4 h-4" />
            {filteredOrders.length} órdenes
          </span>
          <span className="flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            {totalAmount > 0 ? formatCurrency(totalAmount, "USD") : "$0.00"} total
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por usuario, email, ID..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-400 focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-400 focus:outline-none bg-white text-gray-700 font-semibold"
        >
          <option value="all">Todos los estados</option>
          <option value="paid">✅ Pagado</option>
          <option value="pending">⏳ Pendiente</option>
          <option value="failed">❌ Fallido</option>
        </select>

        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-400 focus:outline-none bg-white text-gray-700 font-semibold"
        >
          <option value="all">Todas las fechas</option>
          <option value="today">Hoy</option>
          <option value="yesterday">Ayer</option>
          <option value="week">Última semana</option>
          <option value="month">Último mes</option>
        </select>

        <button
          onClick={fetchOrders}
          className="flex items-center justify-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-xl hover:bg-teal-700 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">ID Orden</th>
              <th className="px-4 py-3 text-left">Usuario</th>
              <th className="px-4 py-3 text-left">Correo</th>
              <th className="px-4 py-3 text-right">Monto</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3 text-left">Fecha</th>
              <th className="px-4 py-3 text-left">Payment Intent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredOrders.map((order) => {
              const stripeData = getStripeData(order)
              const StatusIcon = statusConfig[stripeData.stripe_status]?.icon || AlertCircle
              const statusInfo = statusConfig[stripeData.stripe_status] || statusConfig.pending

              return (
                <tr key={order.order_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm font-semibold text-gray-800">#{order.order_id}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{order.usuario}</td>
                  <td className="px-4 py-3 text-gray-600">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {order.correo}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    <div className="flex flex-col items-end">
                      <span className="text-gray-800">
                        {stripeData.stripe_total && !isNaN(stripeData.stripe_total) && stripeData.stripe_total > 0
                          ? formatCurrency(stripeData.stripe_total, stripeData.stripe_currency)
                          : "Pendiente"}
                      </span>
                      <span className="text-xs text-gray-500">DB: ${order.monto_db}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${statusInfo.bg} ${statusInfo.color}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {statusInfo.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formatDate(order.fecha)}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(stripeData.stripe_payment_intent)
                        Swal.fire({
                          icon: "success",
                          title: "Copiado",
                          text: "Payment Intent copiado al portapapeles",
                          timer: 1500,
                          showConfirmButton: false,
                        })
                      }}
                      className="hover:text-teal-600 transition-colors cursor-pointer"
                      title="Click para copiar"
                    >
                      {stripeData.stripe_payment_intent}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {filteredOrders.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No se encontraron órdenes</p>
          </div>
        )}
      </div>

      {filteredOrders.length > 0 && (
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-100 rounded-full"></div>
              <span>Pagadas: {filteredOrders.filter((o) => getStripeData(o).stripe_status === "paid").length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-100 rounded-full"></div>
              <span>
                Pendientes: {filteredOrders.filter((o) => getStripeData(o).stripe_status === "pending").length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-100 rounded-full"></div>
              <span>Fallidas: {filteredOrders.filter((o) => getStripeData(o).stripe_status === "failed").length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
