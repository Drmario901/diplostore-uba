"use client"

import { useState, useEffect } from "react"
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  RefreshCw,
  Loader2,
  Eye,
  CreditCard
} from "lucide-react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from "chart.js"
import { Line } from "react-chartjs-2"
import axios from "axios"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement)

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

interface Usuario {
  id: string
  nombre: string
  correo: string
  fecha_registro: string
}

interface DashboardData {
  ordenes_recientes: StripeOrder[]
  usuarios_comunes: Usuario[]
  ventas_totales: number
  ordenes_completadas: number
}

const statusConfig = {
  paid: { name: "Pagado", color: "text-green-600", bg: "bg-green-100" },
  pending: { name: "Cancelado", color: "text-red-600", bg: "bg-red-100" },
  failed: { name: "Fallido", color: "text-red-600", bg: "bg-red-100" },
}

export default function EcommerceDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("7d")

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await axios.get("https://diplostore.fwh.is/diplo-store-api/api/dashboard")
      setData(response.data)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStripeData = (order: StripeOrder) => {
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

  const processOrdersData = () => {
    if (!data) return null

    const orders = data.ordenes_recientes
    const now = new Date()

    const filteredOrders = orders.filter((order) => {
      const orderDate = new Date(order.fecha)
      switch (timeRange) {
        case "7d":
          return orderDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        case "30d":
          return orderDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        case "90d":
          return orderDate >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        default:
          return true
      }
    })

    const totalSales = filteredOrders.reduce((sum, order) => {
      const stripeData = getStripeData(order)
      return sum + (stripeData.stripe_total || 0)
    }, 0)

    const paidOrders = filteredOrders.filter((order) => {
      const stripeData = getStripeData(order)
      return stripeData.stripe_status === "paid"
    }).length

    const pendingOrders = filteredOrders.filter((order) => {
      const stripeData = getStripeData(order)
      return stripeData.stripe_status === "pending" || Array.isArray(order.stripe)
    }).length

    const failedOrders = filteredOrders.filter((order) => {
      const stripeData = getStripeData(order)
      return stripeData.stripe_status === "failed"
    }).length

    const salesByMonth = []
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthOrders = orders.filter((order) => {
        const orderDate = new Date(order.fecha)
        return orderDate.getMonth() === monthDate.getMonth() && orderDate.getFullYear() === monthDate.getFullYear()
      })

      const monthSales = monthOrders.reduce((sum, order) => {
        const stripeData = getStripeData(order)
        return sum + (stripeData.stripe_total || 0)
      }, 0)

      salesByMonth.push({
        month: monthDate.toLocaleDateString("es-ES", { month: "short" }),
        sales: monthSales,
        orders: monthOrders.length,
      })
    }

    return {
      totalSales,
      totalOrders: filteredOrders.length,
      totalCustomers: data.usuarios_comunes.length,
      paidOrders,
      pendingOrders,
      failedOrders,
      salesByMonth,
      recentOrders: orders
        .filter((order) => {
          const stripeData = getStripeData(order)
          return stripeData.stripe_status === "paid"
        })
        .slice(0, 4),
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  useEffect(() => {
    if (data) {
    }
  }, [timeRange])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-teal-600">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="text-lg font-semibold">Cargando dashboard...</p>
      </div>
    )
  }

  const processedData = processOrdersData()
  if (!processedData) return null

  const salesChartData = {
    labels: processedData.salesByMonth.map((item) => item.month),
    datasets: [
      {
        label: "Ventas ($)",
        data: processedData.salesByMonth.map((item) => item.sales),
        borderColor: "#0D9488",
        backgroundColor: "rgba(13, 148, 136, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  }

  const salesChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => "$" + value.toLocaleString(),
        },
      },
    },
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2 mb-2">
            <TrendingUp className="w-6 h-6 text-teal-600" />
            Dashboard
          </h1>
          <p className="text-gray-600">Resumen de tienda online</p>
        </div>
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-xl hover:bg-teal-700 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ventas Totales</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.ventas_totales)}</p>
            </div>
            <div className="p-3 bg-teal-100 rounded-full">
              <DollarSign className="w-6 h-6 text-teal-600" />
            </div>
          </div>
          <div className="flex items-center mt-4">
            <ArrowUpRight className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-600 font-medium">Período actual</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Órdenes Completadas</p>
              <p className="text-2xl font-bold text-gray-900">{data.ordenes_completadas}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center mt-4">
            <ArrowUpRight className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-600 font-medium">Total pagadas</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Clientes</p>
              <p className="text-2xl font-bold text-gray-900">{data.usuarios_comunes.length}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="flex items-center mt-4">
            <ArrowUpRight className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-600 font-medium">Usuarios registrados</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1">
        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Ventas por Mes</h3>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64 flex items-center justify-center">
            <Line data={salesChartData} options={salesChartOptions} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Órdenes Recientes</h3>
            <Eye className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {processedData.recentOrders.map((order) => {
              const stripeData = getStripeData(order)
              const statusInfo = statusConfig[stripeData.stripe_status] || statusConfig.pending
              return (
                <div key={order.order_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-100 rounded-full">
                      <CreditCard className="w-4 h-4 text-teal-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">#{order.order_id}</p>
                      <p className="text-sm text-gray-600">{order.usuario}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">
                      {stripeData.stripe_total > 0 ? formatCurrency(stripeData.stripe_total) : `$${order.monto_db}`}
                    </p>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}
                    >
                      {statusInfo.name}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
          <center>
            <a href="https://diplostore.fwh.is/admin/ordenes/" className="w-full mt-4 text-teal-600 hover:text-teal-700 font-medium text-sm">
            Ver todas las órdenes →
          </a>
          </center>
        </div>
      </div>
    </div>
  )
}
