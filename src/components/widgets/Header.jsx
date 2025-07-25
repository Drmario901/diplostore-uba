"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { ShoppingBag, Menu, LogOut, User } from "lucide-react"
import Swal from "sweetalert2"
import "sweetalert2/dist/sweetalert2.css"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [userData, setUserData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPath, setCurrentPath] = useState("")

  //const endpointLocal = "http://localhost/diplo-store-api/user-data";
  const endpointProduction = "https://diplostore.fwh.is/diplo-store-api/user-data"

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentPath(window.location.pathname)
    }
  }, [])

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        setIsLoading(false)
        return
      }

      const cachedUserData = localStorage.getItem("user_data")
      const cachedToken = localStorage.getItem("cached_token")

      if (cachedUserData && cachedToken === token) {
        try {
          const parsedUserData = JSON.parse(cachedUserData)
          console.log("Using cached user data:", parsedUserData)
          setUserData(parsedUserData)
          setIsLoading(false)
          return
        } catch (err) {
          console.error(err)
        }
      }

      try {
        const response = await axios.post(
          endpointProduction,
          {
            token: token,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        )

        setUserData(response.data)
        localStorage.setItem("user_data", JSON.stringify(response.data))
        localStorage.setItem("cached_token", token)

        setIsLoading(false)
      } catch (err) {
        console.error("Error fetching user data:", err)
        setError(err)
        setIsLoading(false)

        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          console.log("Token inválido o expirado, cerrando sesión")
          // Limpiar todos los datos almacenados
          localStorage.removeItem("auth_token")
          localStorage.removeItem("user_data")
          localStorage.removeItem("cached_token")
          setUserData(null)
        }
      }
    }

    fetchUserData()
  }, [])

  const handleLogout = async () => {
    try {
      const result = await Swal.fire({
        title: "¿Cerrar sesion?",
        text: "¿Estas seguro de que quieres cerrar sesion?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#0d9488",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Si, cerrar sesion",
        cancelButtonText: "Cancelar",
      })

      if (result.isConfirmed) {
        await Swal.fire({
          title: "Vuelve pronto",
          text: "Has cerrado sesion exitosamente",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
          timerProgressBar: true,
        })

        localStorage.removeItem("auth_token")
        localStorage.removeItem("user_data")
        localStorage.removeItem("cached_token")
        setUserData(null)
        setIsMenuOpen(false)
        window.location.href = "/"
      }
    } catch (error) {
      console.error(error)
    }
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleNavigation = (href, e) => {
    const normalizedCurrent = currentPath.toLowerCase().replace(/\/$/, "")
    const normalizedTarget = href.toLowerCase().replace(/\/$/, "")

    if (
      normalizedCurrent === normalizedTarget ||
      (normalizedCurrent === "" && normalizedTarget === "/") ||
      (normalizedCurrent === "/" && normalizedTarget === "")
    ) {
      e.preventDefault()
      return false
    }
    return true
  }

  const isActiveRoute = (href) => {
    const normalizedCurrent = currentPath.toLowerCase().replace(/\/$/, "")
    const normalizedTarget = href.toLowerCase().replace(/\/$/, "")

    return (
      normalizedCurrent === normalizedTarget ||
      (normalizedCurrent === "" && normalizedTarget === "/") ||
      (normalizedCurrent === "/" && normalizedTarget === "")
    )
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
          <a href="/" className="flex items-center" onClick={(e) => handleNavigation("/", e)}>
            <ShoppingBag className="h-8 w-8 text-teal-600" />
            <span className="ml-2 font-bold text-lg text-gray-900">DIPLOSTORE</span>
          </a>

          <nav className="hidden md:flex items-center space-x-8">
            <a
              href="/"
              className={`font-medium transition-colors ${
                isActiveRoute("/") ? "text-teal-600 cursor-default" : "text-gray-600 hover:text-teal-600 cursor-pointer"
              }`}
              onClick={(e) => handleNavigation("/", e)}
            >
              Inicio
            </a>
            <a
              href="/productos"
              className={`font-medium transition-colors ${
                isActiveRoute("/productos")
                  ? "text-teal-600 cursor-default"
                  : "text-gray-600 hover:text-teal-600 cursor-pointer"
              }`}
              onClick={(e) => handleNavigation("/productos", e)}
            >
              Productos
            </a>
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            {isLoading ? (
              <div className="h-9 w-32 bg-gray-200 animate-pulse rounded-md"></div>
            ) : isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="bg-teal-100 rounded-full p-1.5">
                    <User className="h-4 w-4 text-teal-600" />
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-700 whitespace-nowrap">
                    {userData ? `${userData.first_name} ${userData.last_name}` : "Usuario"}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center bg-gray-100 hover:bg-gray-200 text-red-600 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <>
                <a
                  href="/login"
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    isActiveRoute("/login")
                      ? "bg-teal-700 text-white cursor-default"
                      : "bg-teal-600 hover:bg-teal-700 text-white"
                  }`}
                  onClick={(e) => handleNavigation("/login", e)}
                >
                  Iniciar sesión
                </a>
                <a
                  href="/registro"
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    isActiveRoute("/registro")
                      ? "bg-gray-200 text-teal-700 cursor-default"
                      : "bg-gray-100 hover:bg-gray-200 text-teal-600"
                  }`}
                  onClick={(e) => handleNavigation("/registro", e)}
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
              className="text-gray-600 hover:text-gray-900 focus:outline-none transition-colors"
              aria-expanded={isMenuOpen}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      <div id="mobile-menu" className={`md:hidden ${isMenuOpen ? "block" : "hidden"} border-t border-gray-200`}>
        <div className="px-4 py-3 space-y-3">
          <a
            href="/"
            className={`block font-medium py-2 transition-colors ${
              isActiveRoute("/") ? "text-teal-600 cursor-default" : "text-gray-600 hover:text-teal-600"
            }`}
            onClick={(e) => {
              if (handleNavigation("/", e)) {
                setIsMenuOpen(false)
              }
            }}
          >
            Inicio
          </a>
          <a
            href="/productos"
            className={`block font-medium py-2 transition-colors ${
              isActiveRoute("/productos") ? "text-teal-600 cursor-default" : "text-gray-600 hover:text-teal-600"
            }`}
            onClick={(e) => {
              if (handleNavigation("/productos", e)) {
                setIsMenuOpen(false)
              }
            }}
          >
            Productos
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
                  className="w-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-red-600 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <a
                  href="/login"
                  className={`block w-full text-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActiveRoute("/login")
                      ? "bg-teal-700 text-white cursor-default"
                      : "bg-teal-600 hover:bg-teal-700 text-white"
                  }`}
                  onClick={(e) => {
                    if (handleNavigation("/login", e)) {
                      setIsMenuOpen(false)
                    }
                  }}
                >
                  Iniciar sesión
                </a>
                <a
                  href="/registro"
                  className={`block w-full text-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActiveRoute("/registro")
                      ? "bg-gray-200 text-teal-700 cursor-default"
                      : "bg-gray-100 hover:bg-gray-200 text-teal-600"
                  }`}
                  onClick={(e) => {
                    if (handleNavigation("/registro", e)) {
                      setIsMenuOpen(false)
                    }
                  }}
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
