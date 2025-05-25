"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { ShoppingBag, Menu, LogOut, User } from "lucide-react"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [userData, setUserData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  //const endpointLocal = "http://localhost/diplo-store-api/user-data";
  const endpointProduction = "https://diplostore.fwh.is/diplo-store-api/user-data";

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        const response = await axios.post(endpointProduction, {
          token: token
        }, {
          headers: {
            "Content-Type": "application/json"
          },
        })

        console.log("User data response:", response.data)
        setUserData(response.data)
        setIsLoading(false)
      } catch (err) {
        console.error("Error fetching user data:", err)
        setError(err)
        setIsLoading(false)

        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          console.log("Token inválido o expirado, cerrando sesión")
          localStorage.removeItem("auth_token")
        }
      }
    }

    fetchUserData()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("auth_token")
    setUserData(null)
    setIsMenuOpen(false)
    window.location.href = "/"
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest("#mobile-menu") && !e.target.closest("#toggle-menu")) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener("click", handleClickOutside)
    }

    return () => {
      document.removeEventListener("click", handleClickOutside)
    }
  }, [isMenuOpen])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false)
      }
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  const isAuthenticated = !!userData

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <a href="/" className="flex items-center">
            <ShoppingBag className="h-8 w-8 text-teal-600" />
            <span className="ml-2 font-bold text-lg text-gray-900">DIPLOSTORE</span>
          </a>

          <nav className="hidden md:flex items-center space-x-8">
            <a href="/" className="text-gray-600 hover:text-teal-600 font-medium">
              Inicio
            </a>
            <a href="/productos" className="text-gray-600 hover:text-teal-600 font-medium">
              Productos
            </a>
            <a href="/contacto" className="text-gray-600 hover:text-teal-600 font-medium">
              Contacto
            </a>
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            {isLoading ? (
              <div className="h-9 w-24 bg-gray-200 animate-pulse rounded-md"></div>
            ) : isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="bg-teal-100 rounded-full p-1.5">
                    <User className="h-4 w-4 text-teal-600" />
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    {userData ? userData.first_name : "Usuario"}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center bg-gray-100 hover:bg-gray-200 text-red-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <>
                <a
                  href="/login"
                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Iniciar sesión
                </a>
                <a
                  href="/registro"
                  className="bg-gray-100 hover:bg-gray-200 text-teal-600 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Registrarse
                </a>
              </>
            )}
          </div>

          <div className="md:hidden">
            <button
              id="toggle-menu"
              onClick={toggleMenu}
              className="text-gray-600 hover:text-gray-900 focus:outline-none"
              aria-expanded={isMenuOpen}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      <div id="mobile-menu" className={`md:hidden ${isMenuOpen ? "block" : "hidden"} border-t border-gray-200`}>
        <div className="px-4 py-3 space-y-3">
          <a href="/" className="block text-gray-600 hover:text-teal-600 font-medium py-2">
            Inicio
          </a>
          <a href="/productos" className="block text-gray-600 hover:text-teal-600 font-medium py-2">
            Productos
          </a>
          <a href="/contacto" className="block text-gray-600 hover:text-teal-600 font-medium py-2">
            Contacto
          </a>

          <div className="pt-2 border-t border-gray-200">
            {isLoading ? (
              <div className="h-10 w-full bg-gray-200 animate-pulse rounded-md"></div>
            ) : isAuthenticated ? (
              <div className="space-y-3">
                <div className="flex items-center py-2">
                  <div className="bg-teal-100 rounded-full p-1.5">
                    <User className="h-4 w-4 text-teal-600" />
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    {userData ? `${userData.first_name} ${userData.last_name}` : "Usuario"}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-red-600 px-4 py-2 rounded-md text-sm font-medium"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <a
                  href="/login"
                  className="block w-full text-center bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Iniciar sesión
                </a>
                <a
                  href="/registro"
                  className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-teal-600 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Registrarse
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
