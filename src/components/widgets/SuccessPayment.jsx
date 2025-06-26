"use client"

import { useEffect, useState } from "react"
import { CheckCircle, Home, ShoppingBag } from "lucide-react"

export default function PaymentSuccess() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("shopping-cart")
      localStorage.removeItem("checkout-in-progress")
      setIsLoading(false)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto px-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Pago Exitoso!</h1>
          <p className="text-gray-600 mb-8">Tu pedido ha sido procesado correctamente</p>

          <div className="space-y-3">
            <a
              href="/"
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors"
            >
              <Home className="h-4 w-4 mr-2" />
              Volver al Inicio
            </a>

            <a
              href="/productos"
              className="w-full inline-flex items-center justify-center px-6 py-3 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              Seguir Comprando
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
