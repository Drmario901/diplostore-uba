"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Loader2, Package, ImageIcon, Plus, RefreshCw, Calendar, ShoppingBag, Search, Upload, X } from "lucide-react"
import axios from "axios"
import Swal from "sweetalert2"
import "sweetalert2/dist/sweetalert2.css"

interface ProductFormData {
  name: string
  price: string
  category: string
  description: string
  image: File | null
}

interface Product {
  id: number
  name: string
  price: number
  category: string
  description: string
  image_url: string
  slug: string
  created_at: string
}

interface ApiResponse {
  message: string
  story?: any
  image_uploaded?: boolean
  error?: string
  detail?: string
}

interface ProductsResponse {
  products: Product[]
}

export default function ProductUploadForm() {
  const [activeTab, setActiveTab] = useState<"create" | "view">("create")
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    price: "",
    category: "",
    description: "",
    image: null,
  })

  const [authToken, setAuthToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDragOver, setIsDragOver] = useState(false)

  const categories = ["Smartphones", "Laptops", "Audio", "Tablets"]

  useEffect(() => {
    const token = localStorage.getItem("auth_token")
    setAuthToken(token)
  }, [])

  useEffect(() => {
    if (activeTab === "view") {
      loadProducts()
    }
  }, [activeTab])

  const loadProducts = async () => {
    if (!authToken) return

    setLoadingProducts(true)
    try {
      const response = await axios.get<ProductsResponse>("https://diplostore.fwh.is/diplo-store-api/api/get-products", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })
      setProducts(response.data.products || [])
    } catch (error) {
      console.error("Error loading products:", error)
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los productos",
        confirmButtonColor: "#0d9488",
      })
    } finally {
      setLoadingProducts(false)
    }
  }

  const handleInputChange = (field: keyof ProductFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleImageChange = (file: File | null) => {
    setFormData((prev) => ({
      ...prev,
      image: file,
    }))

    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setImagePreview(null)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    handleImageChange(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.type.startsWith("image/")) {
        handleImageChange(file)
      }
    }
  }

  const removeImage = () => {
    handleImageChange(null)
    const fileInput = document.getElementById("image-upload") as HTMLInputElement
    if (fileInput) fileInput.value = ""
  }

  const validateForm = (): string | null => {
    if (!authToken) return "Token de autenticación no encontrado. Por favor inicia sesión nuevamente."
    if (!formData.name.trim()) return "El nombre del producto es requerido"
    if (!formData.price.trim()) return "El precio es requerido"
    if (isNaN(Number.parseFloat(formData.price)) || Number.parseFloat(formData.price) <= 0) {
      return "El precio debe ser un número válido mayor a 0"
    }
    if (!formData.category) return "La categoría es requerida"
    if (!formData.description.trim()) return "La descripción es requerida"
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationError = validateForm()
    if (validationError) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: validationError,
        confirmButtonColor: "#0d9488",
      })
      return
    }

    setIsLoading(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append("token", authToken!)
      formDataToSend.append("name", formData.name)
      formDataToSend.append("price", formData.price)
      formDataToSend.append("category", formData.category.toLowerCase())
      formDataToSend.append("description", formData.description)

      if (formData.image) {
        formDataToSend.append("image", formData.image, formData.image.name)
      }

      await axios.post<ApiResponse>("https://diplostore.fwh.is/diplo-store-api/api/upload-product", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      await Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "El producto se ha creado correctamente",
        confirmButtonColor: "#0d9488",
      })

      setFormData({
        name: "",
        price: "",
        category: "",
        description: "",
        image: null,
      })
      setImagePreview(null)

      const fileInput = document.getElementById("image-upload") as HTMLInputElement
      if (fileInput) fileInput.value = ""

      if (activeTab === "view") {
        loadProducts()
      }
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo crear el producto. Inténtalo de nuevo.",
        confirmButtonColor: "#0d9488",
      })

      console.error("Upload error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      price: "",
      category: "",
      description: "",
      image: null,
    })
    setImagePreview(null)
    const fileInput = document.getElementById("image-upload") as HTMLInputElement
    if (fileInput) fileInput.value = ""
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price)
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

  const getCategoryBadge = (category: string) => {
    const colors = {
      smartphones: "bg-blue-100 text-blue-800",
      laptops: "bg-purple-100 text-purple-800",
      audio: "bg-green-100 text-green-800",
      tablets: "bg-orange-100 text-orange-800",
    }
    return colors[category.toLowerCase() as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex justify-center">
            <nav className="flex space-x-8 bg-white rounded-lg shadow-sm p-1">
              <button
                onClick={() => setActiveTab("create")}
                className={`px-6 py-3 rounded-md font-medium text-sm transition-all ${
                  activeTab === "create" ? "bg-teal-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Crear Producto
              </button>
              <button
                onClick={() => setActiveTab("view")}
                className={`px-6 py-3 rounded-md font-medium text-sm transition-all ${
                  activeTab === "view" ? "bg-teal-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Gestión de Productos 
              </button>
            </nav>
          </div>
        </div>

        {activeTab === "create" && (
          <div className="flex justify-center">
            <div className="w-full max-w-2xl">
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200 text-center">
                  <h2 className="text-xl font-semibold text-gray-900">Nuevo Producto</h2>
                  <p className="mt-1 text-sm text-gray-500">Completa la información para crear un nuevo producto</p>
                </div>

                <div className="px-6 py-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre del Producto 
                        </label>
                        <input
                          id="name"
                          type="text"
                          placeholder="Ingresa el nombre del producto"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                        />
                      </div>

                      <div>
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                          Precio (USD) 
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <input
                            id="price"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={formData.price}
                            onChange={(e) => handleInputChange("price", e.target.value)}
                            required
                            className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                        Categoría 
                      </label>
                      <select
                        id="category"
                        value={formData.category}
                        onChange={(e) => handleInputChange("category", e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                      >
                        <option value="">Selecciona una categoría</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción 
                      </label>
                      <textarea
                        id="description"
                        placeholder="Describe el producto"
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        rows={4}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4">Imagen del Producto</label>

                      <div className="flex justify-center">
                        {!imagePreview ? (
                          <div
                            className={`relative w-48 h-48 border-2 border-dashed rounded-xl transition-all duration-300 cursor-pointer group ${
                              isDragOver
                                ? "border-teal-400 bg-gradient-to-br from-teal-50 to-cyan-50 shadow-lg scale-105"
                                : "border-gray-300 hover:border-teal-300 hover:bg-gradient-to-br hover:from-gray-50 hover:to-teal-50 hover:shadow-md hover:scale-102"
                            }`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                          >
                            <input
                              id="image-upload"
                              type="file"
                              name="image"
                              accept="image/*"
                              onChange={handleFileInputChange}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="flex flex-col items-center justify-center h-full text-center p-6">
                              <div
                                className={`relative mb-4 transition-all duration-300 ${
                                  isDragOver ? "scale-110" : "group-hover:scale-105"
                                }`}
                              >
                                <div
                                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                                    isDragOver
                                      ? "bg-gradient-to-br from-teal-500 to-cyan-500 shadow-lg"
                                      : "bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-teal-100 group-hover:to-cyan-100"
                                  }`}
                                >
                                  <Upload
                                    className={`h-8 w-8 transition-all duration-300 ${
                                      isDragOver ? "text-white" : "text-gray-400 group-hover:text-teal-500"
                                    }`}
                                  />
                                </div>
                                {isDragOver && (
                                  <div className="absolute -inset-2 bg-teal-400 rounded-full opacity-20 animate-pulse"></div>
                                )}
                              </div>

                              <div className="space-y-2">
                                <p
                                  className={`text-sm font-semibold transition-colors duration-300 ${
                                    isDragOver ? "text-teal-700" : "text-gray-700 group-hover:text-teal-600"
                                  }`}
                                >
                                  {isDragOver ? "¡Suelta la imagen aquí!" : "Subir imagen"}
                                </p>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                  Arrastra y suelta o haz clic
                                  <br />
                                  <span className="font-medium">PNG, JPG, GIF</span>
                                  <br />
                                  <span className="text-teal-600">hasta 10MB</span>
                                </p>
                              </div>
                            </div>

                            <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-teal-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-teal-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-teal-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-teal-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </div>
                        ) : (
                          <div className="relative group">
                            <div className="relative w-48 h-48 rounded-xl overflow-hidden border-2 border-gray-200 bg-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
                              <img
                                src={imagePreview || "/placeholder.svg"}
                                alt="Vista previa"
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                              />

                              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                              <button
                                type="button"
                                onClick={removeImage}
                                className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl opacity-80 hover:opacity-100"
                              >
                                <X className="h-4 w-4" />
                              </button>

                              <div className="absolute bottom-3 left-3 bg-green-500 text-white rounded-full p-1.5 shadow-lg opacity-90">
                                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            </div>

                            <div className="mt-3 text-center">
                              <p className="text-sm font-medium text-gray-700">Vista previa</p>
                              <p className="text-xs text-gray-500 mt-1">Haz clic en X para cambiar la imagen</p>
                            </div>

                            <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 -z-10"></div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-center space-x-4 pt-6 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={resetForm}
                        disabled={isLoading}
                        className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 flex items-center"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creando...
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" />
                            Crear Producto
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "view" && (
          <div>
            <div className="mb-6">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-900 flex items-center justify-center">
                  <Package className="h-6 w-6 mr-2 text-teal-600" />
                  Gestión de Productos
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  <ShoppingBag className="inline h-4 w-4 mr-1" />
                  {products.length} productos total
                </p>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-6 py-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar por nombre, categoría..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                      />
                    </div>
                  </div>
                  <button
                    onClick={loadProducts}
                    disabled={loadingProducts}
                    className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 flex items-center"
                  >
                    {loadingProducts ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Actualizar
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
              {loadingProducts ? (
                <div className="px-6 py-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto mb-4" />
                  <p className="text-gray-500">Cargando productos...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? "No se encontraron productos" : "No hay productos"}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm ? "Intenta con otros términos de búsqueda" : "Crea tu primer producto para comenzar"}
                  </p>
                  {!searchTerm && (
                    <button
                      onClick={() => setActiveTab("create")}
                      className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Producto
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Producto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Categoría
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Precio
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-12 w-12">
                                {product.image_url ? (
                                  <img
                                    className="h-12 w-12 rounded-lg object-cover"
                                    src={product.image_url || "/placeholder.svg"}
                                    alt={product.name}
                                  />
                                ) : (
                                  <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
                                    <ImageIcon className="h-6 w-6 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                <div className="text-sm text-gray-500 max-w-xs truncate">{product.description}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryBadge(
                                product.category,
                              )}`}
                            >
                              {product.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatPrice(product.price)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(product.created_at)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
