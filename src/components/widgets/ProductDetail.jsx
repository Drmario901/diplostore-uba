"use client"
import { useState, useEffect } from "react"
import axios from "axios"
import { ArrowLeft, Tag, ShoppingCart } from "lucide-react"

const ProductDetail = () => {
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [slug, setSlug] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [cartItems, setCartItems] = useState([])
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const extractedSlug = params.get("slug")
    if (extractedSlug) {
      setSlug(extractedSlug)
    } else {
      setError("No se encontró el parámetro 'slug' en la URL.")
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const authToken = localStorage.getItem("auth_token")
      setIsAuthenticated(!!authToken)

      const savedCart = localStorage.getItem("shopping-cart")
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart)
          setCartItems(parsedCart)
        } catch (error) {
          console.error(error)
        }
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("shopping-cart", JSON.stringify(cartItems))
    }
  }, [cartItems])

  useEffect(() => {
    const fetchProductDetail = async () => {
      if (!slug) return

      try {
        setLoading(true)
        console.log(`Buscando producto con slug: ${slug}`)

        const response = await axios.get(`https://api.storyblok.com/v2/cdn/stories/products/${slug}`, {
          params: {
            token: "xF8XKQlZVoFL8lCd7gjolwtt",
          },
        })

        const story = response.data.story
        const content = story.content

        setProduct({
          id: story.id,
          name: content.name || "Producto sin nombre",
          price: content.price || "0",
          regular_price: content.regular_price || content.price || "0",
          sale_price: content.sale_price || null,
          stock_status: content.stock_status || "instock",
          image: content.image?.filename || "/placeholder.svg?height=400&width=400",
          on_sale: content.sale_price ? true : false,
          category: content.category || "sin-categoria",
          description: content.description || "",
          slug: story.slug,
          created_at: story.created_at,
          updated_at: story.updated_at,
        })
        setLoading(false)
      } catch (err) {
        console.error("Error al cargar el detalle del producto:", err)
        setError("No se pudo cargar el detalle del producto. Por favor, intenta nuevamente más tarde.")
        setLoading(false)
      }
    }

    fetchProductDetail()
  }, [slug])

  const showNotification = (message) => {
    if (typeof window !== "undefined") {
      const notification = document.createElement("div")
      notification.textContent = message
      notification.className =
        "fixed top-4 right-4 bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-3 rounded-lg shadow-lg z-[9999] opacity-0 transform translate-x-4 transition-all duration-500 max-w-sm"
      document.body.appendChild(notification)

      setTimeout(() => {
        notification.style.transform = "translateX(0)"
        notification.style.opacity = "1"
      }, 100)

      setTimeout(() => {
        notification.style.transform = "translateX(2rem)"
        notification.style.opacity = "0"
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification)
          }
        }, 500)
      }, 3000)
    }
  }

  const addToCart = (product) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id)
      if (existingItem) {
        const updatedItems = prevItems.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        )
        showNotification(`${product.name} agregado al carrito (${existingItem.quantity + 1})`)
        return updatedItems
      } else {
        const newItem = {
          id: product.id,
          name: product.name,
          price: product.sale_price || product.price,
          image: product.image,
          quantity: 1,
          category: product.category,
        }
        const updatedItems = [...prevItems, newItem]
        showNotification(`${product.name} agregado al carrito`)
        return updatedItems
      }
    })
  }

  const handleAddToCart = async () => {
    if (!product) return

    setIsAdding(true)
    setTimeout(() => {
      addToCart(product)
      setIsAdding(false)
    }, 200)
  }

  const getProductQuantityInCart = () => {
    if (!product) return 0
    const cartItem = cartItems.find((item) => item.id === product.id)
    return cartItem ? cartItem.quantity : 0
  }

  const goBack = () => {
    window.history.back()
  }

  const renderDescription = (description) => {
    if (!description || !description.content) {
      return <p className="text-gray-500">No hay descripción disponible para este producto.</p>
    }

    return description.content.map((block, blockIndex) => {
      if (block.type === "paragraph") {
        return (
          <p key={blockIndex} className="mb-4 text-gray-700 leading-relaxed">
            {block.content.map((content, contentIndex) => (
              <span key={contentIndex}>{content.text}</span>
            ))}
          </p>
        )
      }
      return null
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-sm p-8">
          <div className="animate-pulse">
            <div className="h-6 w-32 bg-gray-200 rounded mb-8"></div>
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-1/2">
                <div className="bg-gray-200 rounded-lg h-96 w-full"></div>
              </div>
              <div className="w-full md:w-1/2">
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-6"></div>
                <div className="h-10 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-sm p-8">
          <button
            onClick={goBack}
            className="flex items-center text-teal-600 hover:text-teal-700 mb-8 transition-colors cursor-pointer"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Volver a productos
          </button>
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-8">
              <p>{error}</p>
            </div>
            <button
              onClick={goBack}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-md transition-colors cursor-pointer"
            >
              Volver a la lista de productos
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return null
  }

  const quantityInCart = getProductQuantityInCart()

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <button
          onClick={goBack}
          className="flex items-center text-teal-600 hover:text-teal-700 mb-8 transition-colors cursor-pointer"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Volver a productos
        </button>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/2">
            <div className="bg-white rounded-lg overflow-hidden border border-gray-100 relative">
              <img
                src={product.image || "/placeholder.svg"}
                alt={product.name}
                className="w-full h-auto object-contain aspect-square"
                onError={(e) => {
                  e.target.src = "/placeholder.svg?height=400&width=400"
                  e.target.onerror = null
                }}
              />
              {product.on_sale && (
                <div className="absolute top-4 right-4 bg-red-500 text-white text-sm font-bold rounded-full px-3 py-1">
                  Oferta
                </div>
              )}
              {product.stock_status === "outofstock" && (
                <div className="absolute top-4 left-4 bg-gray-700 text-white text-sm font-bold rounded-full px-3 py-1">
                  Agotado
                </div>
              )}
            </div>
          </div>

          <div className="w-full md:w-1/2">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>

            {product.category && (
              <div className="flex items-center mb-4">
                <Tag className="h-4 w-4 text-teal-600 mr-2" />
                <span className="text-sm text-teal-600 font-medium capitalize">{product.category}</span>
              </div>
            )}

            <div className="mb-6">
              {product.on_sale ? (
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-gray-900">${product.sale_price || product.price}</span>
                  <span className="text-xl text-gray-500 line-through">${product.regular_price}</span>
                  <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1">
                    {Math.round(
                      ((product.regular_price - (product.sale_price || product.price)) / product.regular_price) * 100,
                    )}
                    % OFF
                  </span>
                </div>
              ) : (
                <span className="text-3xl font-bold text-gray-900">${product.price}</span>
              )}
            </div>

            <div className="prose prose-sm max-w-none mb-8">{renderDescription(product.description)}</div>

            <div className="mb-6">
              {product.stock_status === "outofstock" ? (
                <div className="inline-flex items-center bg-gray-200 text-gray-700 px-6 py-3 rounded-md font-medium">
                  <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                  Agotado
                </div>
              ) : (
                <div className="inline-flex items-center bg-green-100 text-green-700 px-6 py-3 rounded-md font-medium">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Disponible
                </div>
              )}
            </div>

            {isAuthenticated && product.stock_status !== "outofstock" && (
              <div className="border-t border-gray-100 pt-6">
                <div className="flex items-center gap-4 mb-4">
                  <button
                    onClick={handleAddToCart}
                    disabled={isAdding}
                    className="flex-1 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center transform hover:scale-105 hover:shadow-lg active:scale-95 disabled:opacity-70 cursor-pointer"
                  >
                    <ShoppingCart
                      className={`h-5 w-5 mr-2 transition-transform duration-300 ${isAdding ? "animate-spin" : ""}`}
                    />
                    {isAdding ? "Agregando..." : "Agregar al Carrito"}
                  </button>
                </div>

                {quantityInCart > 0 && (
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-teal-700 font-medium">
                        Ya tienes {quantityInCart} {quantityInCart === 1 ? "unidad" : "unidades"} en tu carrito
                      </span>
                      <div className="flex items-center">
                        <ShoppingCart className="h-4 w-4 text-teal-600 mr-1" />
                        <span className="text-teal-600 font-bold">{quantityInCart}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!isAuthenticated && (
              <div className="border-t border-gray-100 pt-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 font-medium mb-2">Inicia sesión para comprar</p>
                  <p className="text-yellow-700 text-sm">
                    Necesitas estar autenticado para agregar productos al carrito y realizar compras.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 border-t border-gray-100 pt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Detalles del producto</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">ID del producto</p>
              <p className="font-medium">{product.id}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Categoría</p>
              <p className="font-medium capitalize">{product.category || "Sin categoría"}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Estado</p>
              <p className="font-medium">{product.stock_status === "outofstock" ? "Agotado" : "Disponible"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail
