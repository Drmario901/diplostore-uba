"use client"

import { useState, useEffect } from "react"
import { User, Mail, Lock, UserPlus, Eye, EyeOff, UserCheck, Check, X } from "lucide-react"
import axios from "axios"
import Swal from "sweetalert2"
import "sweetalert2/dist/sweetalert2.css"

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    terms: false,
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: [],
  })

  //const endpointLocal = "http://localhost/diplo-store-api/register";
  const endpointProduction = "https://diplostore.fwh.is/diplo-store-api/register"

  const checkPasswordStrength = (password) => {
    const feedback = []
    let score = 0

    if (password.length >= 8) {
      score += 1
      feedback.push({ text: "Al menos 8 caracteres", valid: true })
    } else {
      feedback.push({ text: "Al menos 8 caracteres", valid: false })
    }

    if (/[a-z]/.test(password)) {
      score += 1
      feedback.push({ text: "Contiene minúsculas", valid: true })
    } else {
      feedback.push({ text: "Contiene minúsculas", valid: false })
    }

    if (/[A-Z]/.test(password)) {
      score += 1
      feedback.push({ text: "Contiene mayúsculas", valid: true })
    } else {
      feedback.push({ text: "Contiene mayúsculas", valid: false })
    }

    if (/\d/.test(password)) {
      score += 1
      feedback.push({ text: "Contiene números", valid: true })
    } else {
      feedback.push({ text: "Contiene números", valid: false })
    }

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1
      feedback.push({ text: "Contiene símbolos", valid: true })
    } else {
      feedback.push({ text: "Contiene símbolos", valid: false })
    }

    return { score, feedback }
  }

  useEffect(() => {
    if (formData.password) {
      const strength = checkPasswordStrength(formData.password)
      setPasswordStrength(strength)
    }
  }, [formData.password])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    const newValue = type === "checkbox" ? checked : value

    setFormData({
      ...formData,
      [name]: newValue,
    })

    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      })
    }

    if (name === "confirmPassword" || (name === "password" && formData.confirmPassword)) {
      const password = name === "password" ? newValue : formData.password
      const confirmPassword = name === "confirmPassword" ? newValue : formData.confirmPassword

      if (confirmPassword && password !== confirmPassword) {
        setErrors((prev) => ({
          ...prev,
          confirmPassword: "Las contraseñas no coinciden",
        }))
      } else if (password === confirmPassword && confirmPassword) {
        setErrors((prev) => ({
          ...prev,
          confirmPassword: "",
        }))
      }
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.first_name.trim()) {
      newErrors.first_name = "El nombre es obligatorio"
    } else if (formData.first_name.trim().length < 2) {
      newErrors.first_name = "El nombre debe tener al menos 2 caracteres"
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(formData.first_name.trim())) {
      newErrors.first_name = "El nombre solo puede contener letras"
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = "El apellido es obligatorio"
    } else if (formData.last_name.trim().length < 2) {
      newErrors.last_name = "El apellido debe tener al menos 2 caracteres"
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(formData.last_name.trim())) {
      newErrors.last_name = "El apellido solo puede contener letras"
    }

    if (!formData.email) {
      newErrors.email = "El correo electrónico es obligatorio"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Formato de correo electrónico inválido"
    } else if (formData.email.length > 254) {
      newErrors.email = "El correo electrónico es demasiado largo"
    }

    if (!formData.password) {
      newErrors.password = "La contraseña es obligatoria"
    } else {
      const strength = checkPasswordStrength(formData.password)
      if (strength.score < 3) {
        newErrors.password = "La contraseña debe ser más segura (mínimo 3 de 5 criterios)"
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Debes confirmar tu contraseña"
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden"
    }

    if (!formData.terms) {
      newErrors.terms = "Debes aceptar los términos y condiciones"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      Swal.fire({
        icon: "error",
        title: "Error de validación",
        text: "Por favor, completa correctamente todos los campos del formulario",
        confirmButtonColor: "#0d9488",
      })
      return
    }

    setIsLoading(true)

    try {
      const registerData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
      }

      const response = await axios.post(endpointProduction, registerData, {
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.status === 200 || response.status === 201) {
        if (response.data && response.data.token) {
          localStorage.setItem("auth_token", response.data.token)

          if (response.data.user) {
            localStorage.setItem("user_data", JSON.stringify(response.data.user))
            localStorage.setItem("cached_token", response.data.token)
          }

          Swal.fire({
            icon: "success",
            title: "¡Registro exitoso!",
            text: "Tu cuenta ha sido creada correctamente",
            confirmButtonColor: "#0d9488",
          }).then(() => {
            window.location.href = "/productos"
          })
        } else {
          Swal.fire({
            icon: "success",
            title: "¡Registro exitoso!",
            text: "Tu cuenta ha sido creada correctamente. Por favor, inicia sesión.",
            confirmButtonColor: "#0d9488",
          }).then(() => {
            window.location.href = "/login"
          })
        }
      } else {
        throw new Error("Respuesta inesperada del servidor")
      }
    } catch (error) {
      console.error("Registration error:", error)
      let errorMsg = "Ocurrió un error al intentar registrarte"

      if (error.response) {
        if (error.response.data && error.response.data.message) {
          errorMsg = error.response.data.message
        } else if (error.response.status === 422) {
          errorMsg = "El correo electrónico ya está registrado"
        } else if (error.response.status === 400) {
          errorMsg = "Datos inválidos. Verifica la información ingresada"
        }
      } else if (error.request) {
        errorMsg = "No se pudo conectar con el servidor. Verifica tu conexión a internet."
      } else {
        errorMsg = error.message
      }

      Swal.fire({
        icon: "error",
        title: "Error de registro",
        text: errorMsg,
        confirmButtonColor: "#0d9488",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength.score <= 2) return "bg-red-500"
    if (passwordStrength.score <= 3) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getPasswordStrengthText = () => {
    if (passwordStrength.score <= 2) return "Débil"
    if (passwordStrength.score <= 3) return "Media"
    return "Fuerte"
  }

  return (
    <div className="min-h-[calc(100vh-var(--header-height)-var(--footer-height))] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg mx-auto p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center mb-8">
          <div className="inline-flex justify-center items-center bg-gradient-to-r from-teal-500 to-emerald-500 p-3 rounded-full mb-4">
            <UserPlus className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Crear una cuenta</h2>
          <p className="text-gray-600 mt-2">Únete a la tienda DIPLOSTORE</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  value={formData.first_name}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-3 border ${
                    errors.first_name ? "border-red-500" : "border-gray-300"
                  } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500`}
                  placeholder="Tu nombre"
                />
              </div>
              {errors.first_name && <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>}
            </div>

            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                Apellido
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  value={formData.last_name}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-3 border ${
                    errors.last_name ? "border-red-500" : "border-gray-300"
                  } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500`}
                  placeholder="Tu apellido"
                />
              </div>
              {errors.last_name && <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                className={`block w-full pl-10 pr-3 py-3 border ${
                  errors.email ? "border-red-500" : "border-gray-300"
                } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500`}
                placeholder="tu@email.com"
              />
            </div>
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                className={`block w-full pl-10 pr-10 py-3 border ${
                  errors.password ? "border-red-500" : "border-gray-300"
                } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500`}
                placeholder="Crea una contraseña segura"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>

            {formData.password && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">Fortaleza de contraseña:</span>
                  <span
                    className={`text-xs font-medium ${
                      passwordStrength.score <= 2
                        ? "text-red-600"
                        : passwordStrength.score <= 3
                          ? "text-yellow-600"
                          : "text-green-600"
                    }`}
                  >
                    {getPasswordStrengthText()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  ></div>
                </div>
                <div className="mt-2 space-y-1">
                  {passwordStrength.feedback.map((item, index) => (
                    <div key={index} className="flex items-center text-xs">
                      {item.valid ? (
                        <Check className="h-3 w-3 text-green-500 mr-1" />
                      ) : (
                        <X className="h-3 w-3 text-red-500 mr-1" />
                      )}
                      <span className={item.valid ? "text-green-600" : "text-red-600"}>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`block w-full pl-10 pr-10 py-3 border ${
                  errors.confirmPassword
                    ? "border-red-500"
                    : formData.confirmPassword && formData.password === formData.confirmPassword
                      ? "border-green-500"
                      : "border-gray-300"
                } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500`}
                placeholder="Repite tu contraseña"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            {formData.confirmPassword && formData.password === formData.confirmPassword && (
              <p className="mt-1 text-sm text-green-600 flex items-center">
                <Check className="h-4 w-4 mr-1" />
                Las contraseñas coinciden
              </p>
            )}
            {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                checked={formData.terms}
                onChange={handleChange}
                className={`h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded ${
                  errors.terms ? "border-red-500" : ""
                }`}
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="terms" className="font-medium text-gray-700">
                Acepto los{" "}
                <a href="/terminos" className="text-teal-600 hover:text-teal-500">
                  términos y condiciones
                </a>
              </label>
              {errors.terms && <p className="mt-1 text-sm text-red-600">{errors.terms}</p>}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-75 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creando cuenta...
                </>
              ) : (
                <>
                  <UserCheck className="h-5 w-5 mr-2" />
                  Crear cuenta
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            ¿Ya tienes una cuenta?{" "}
            <a href="/login" className="font-medium text-teal-600 hover:text-teal-500">
              Inicia sesión
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default RegisterForm
