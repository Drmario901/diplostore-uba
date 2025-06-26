"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  X,
  ChevronDown,
  SlidersHorizontal,
  ArrowUpDown,
  User,
  Package,
  Calendar,
  CreditCard,
  Eye,
} from "lucide-react"

const ProductsGrid = () => {
  const [cartItems, setCartItems] = useState([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isCartAnimating, setIsCartAnimating] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isPurchaseHistoryOpen, setIsPurchaseHistoryOpen] = useState(false)
  const [isPurchaseHistoryAnimating, setIsPurchaseHistoryAnimating] = useState(false)
  const [purchaseHistory, setPurchaseHistory] = useState([])
  const [loadingPurchases, setLoadingPurchases] = useState(false)
  const [purchaseError, setPurchaseError] = useState(null)

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const observer = useRef(null)
  const [showSortOptions, setShowSortOptions] = useState(false)
  const [sortOption, setSortOption] = useState("relevance")
  const [fetchingLock, setFetchingLock] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [totalProducts, setTotalProducts] = useState(0)

  const responseCache = useRef({})

  useEffect(() => {
    if (typeof window !== "undefined") {
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
      const authToken = localStorage.getItem("auth_token")
      setIsAuthenticated(!!authToken)
    }
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("shopping-cart", JSON.stringify(cartItems))
    }
  }, [cartItems])

  const fetchPurchaseHistory = async () => {
    const authToken = localStorage.getItem("auth_token")
    if (!authToken) {
      setPurchaseError("No se encontró token de autenticación")
      return
    }

    setLoadingPurchases(true)
    setPurchaseError(null)

    try {
      const response = await fetch("https://diplostore.fwh.is/diplo-store-api/api/gateway/my-purchases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: authToken,
        }),
      })

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`)
      }

      const data = await response.json()

      const purchases = Array.isArray(data) ? data : [data]
      setPurchaseHistory(purchases)
    } catch (error) {
      console.error("Error fetching purchase history:", error)
      setPurchaseError("Error al cargar el historial de compras")
    } finally {
      setLoadingPurchases(false)
    }
  }

  const openPurchaseHistory = () => {
    setIsPurchaseHistoryOpen(true)
    setIsPurchaseHistoryAnimating(true)
    if (purchaseHistory.length === 0) {
      fetchPurchaseHistory()
    }
  }

  const closePurchaseHistory = () => {
    setIsPurchaseHistoryAnimating(false)
    setTimeout(() => setIsPurchaseHistoryOpen(false), 300)
  }

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      return dateString
    }
  }

  const formatCurrency = (amount, currency = "USD") => {
    try {
      const numAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
      }).format(numAmount)
    } catch (error) {
      return `$${amount}`
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
        animateCartButton()
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
        animateCartButton()
        return updatedItems
      }
    })
  }

  const removeFromCart = (productId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId))
  }

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setCartItems((prevItems) => prevItems.map((item) => (item.id === productId ? { ...item, quantity } : item)))
  }

  const clearCart = () => {
    setCartItems([])
    if (typeof window !== "undefined") {
      localStorage.removeItem("shopping-cart")
    }
  }

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      const price = Number.parseFloat(item.price.toString().replace(/[^0-9.-]+/g, ""))
      return total + price * item.quantity
    }, 0)
  }

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      alert("Tu carrito está vacío")
      return
    }

    const auth_token = localStorage.getItem("auth_token")

    setIsProcessingPayment(true)

    try {
      const checkoutData = {
        token: auth_token,
        items: cartItems.map((item) => ({
          id: item.id,
          name: item.name,
          price: Number.parseFloat(item.price.toString().replace(/[^0-9.-]+/g, "")),
          quantity: item.quantity,
          image: item.image,
          category: item.category,
        })),
        total: getTotalPrice(),
        currency: "USD",
        timestamp: new Date().toISOString(),
      }

      console.log("Enviando datos al checkout:", checkoutData)

      const response = await fetch("https://diplostore.fwh.is/diplo-store-api/api/gateway/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkoutData),
      })

      if (!response.ok) {
        throw new Error(`Error en la respuesta del servidor: ${response.status}`)
      }

      const result = await response.json()

      if (result.checkout_url || result.url) {
        const checkoutUrl = result.checkout_url || result.url

        if (typeof window !== "undefined") {
          localStorage.setItem(
            "checkout-in-progress",
            JSON.stringify({
              items: cartItems,
              timestamp: new Date().toISOString(),
            }),
          )
        }

        window.location.href = checkoutUrl
      } else {
        throw new Error("No se recibió la URL de checkout")
      }
    } catch (error) {
      console.error("Error al procesar el checkout:", error)

      alert(`Error al procesar el pago: ${error.message}. Por favor, intenta nuevamente.`)
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const openCart = () => {
    setIsCartOpen(true)
    setIsCartAnimating(true)
  }

  const closeCart = () => {
    setIsCartAnimating(false)
    setTimeout(() => setIsCartOpen(false), 300)
  }

  const handleSort = (option) => {
    setSortOption(option)
    setShowSortOptions(false)
    setPage(1)
    setProducts([])
    setInitialLoading(true)
    responseCache.current = {}
  }

  const extractCategories = useCallback((productList) => {
    const categoryMap = {}

    productList.forEach((product) => {
      if (product.category) {
        const category = product.category.toLowerCase()
        if (categoryMap[category]) {
          categoryMap[category]++
        } else {
          categoryMap[category] = 1
        }
      }
    })

    const categoryArray = Object.keys(categoryMap).map((name) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      count: categoryMap[name],
    }))

    return categoryArray.sort((a, b) => b.count - a.count)
  }, [])

  const handleCategoryClick = (categoryName) => {
    if (selectedCategory === categoryName) {
      setSelectedCategory(null)
    } else {
      setSelectedCategory(categoryName)
    }

    setPage(1)
    setProducts([])
    setInitialLoading(true)
    responseCache.current = {}
  }

  const fetchProducts = useCallback(
    async (pageNum) => {
      if (fetchingLock) return
      setFetchingLock(true)

      try {
        if (pageNum > 1 && !hasMore) {
          setFetchingLock(false)
          return
        }

        if (pageNum === 1) {
          setInitialLoading(true)
        } else {
          setLoading(true)
        }

        let sort_by = "published_at:desc"

        switch (sortOption) {
          case "price_asc":
            sort_by = "content.price:asc"
            break
          case "price_desc":
            sort_by = "content.price:desc"
            break
          case "date":
            sort_by = "published_at:desc"
            break
          default:
            sort_by = "published_at:desc"
        }

        const cacheKey = `${sortOption}-${selectedCategory || "all"}-${pageNum}`

        if (responseCache.current[cacheKey]) {
          const cachedData = responseCache.current[cacheKey]

          if (pageNum === 1) {
            setProducts(cachedData.products)
            setTotalProducts(cachedData.total)
            setCategories(extractCategories(cachedData.products))
          } else {
            setProducts((prev) => {
              const newProducts = [...prev]
              cachedData.products.forEach((product) => {
                if (!newProducts.some((p) => p.id === product.id)) {
                  newProducts.push(product)
                }
              })
              return newProducts
            })
          }

          setInitialLoading(false)
          setLoading(false)
          setFetchingLock(false)
          return
        }

        const params = {
          token: "xF8XKQlZVoFL8lCd7gjolwtt",
          starts_with: "products/",
          per_page: 100,
          page: pageNum,
          sort_by,
        }

        if (selectedCategory) {
          params.search_term = selectedCategory.toLowerCase()
        }

        console.log(`Fetching products: page ${pageNum}, category: ${selectedCategory || "all"}, sort: ${sortOption}`)

        const response = await fetch(`https://api.storyblok.com/v2/cdn/stories?${new URLSearchParams(params)}`)
        const data = await response.json()

        const formattedProducts = data.stories.map((story) => {
          const content = story.content
          return {
            id: story.id,
            name: content.name || "Producto sin nombre",
            price: content.price || "0",
            regular_price: content.regular_price || content.price || "0",
            sale_price: content.sale_price || null,
            stock_status: content.stock_status || "instock",
            image: content.image?.filename || "/placeholder.svg?height=200&width=200",
            on_sale: content.sale_price ? true : false,
            category: content.category || "sin-categoria",
            description: content.description || "",
            slug: story.slug,
          }
        })

        const filteredProducts = selectedCategory
          ? formattedProducts.filter((product) => product.category.toLowerCase() === selectedCategory.toLowerCase())
          : formattedProducts

        const total = response.headers.get("total") || data.total || filteredProducts.length
        setTotalProducts(Number.parseInt(total, 10))

        responseCache.current[cacheKey] = {
          products: filteredProducts,
          total: Number.parseInt(total, 10),
        }

        if (pageNum === 1) {
          setProducts(filteredProducts)
          if (!selectedCategory) {
            setCategories(extractCategories(filteredProducts))
          }
        } else {
          setProducts((prev) => {
            const newProducts = [...prev]
            filteredProducts.forEach((product) => {
              if (!newProducts.some((p) => p.id === product.id)) {
                newProducts.push(product)
              }
            })
            return newProducts
          })
        }

        const currentTotal = pageNum === 1 ? filteredProducts.length : products.length + filteredProducts.length
        setHasMore(currentTotal < total && filteredProducts.length > 0)

        console.log(
          `Loaded ${filteredProducts.length} products. Total: ${total}. Has more: ${currentTotal < total && filteredProducts.length > 0}`,
        )
      } catch (err) {
        console.error("Error fetching products:", err)
        setError("Failed to load products. Please try again later.")
      } finally {
        setInitialLoading(false)
        setLoading(false)
        setFetchingLock(false)
      }
    },
    [sortOption, hasMore, extractCategories, selectedCategory, products.length],
  )

  useEffect(() => {
    const loadInitialCategories = async () => {
      try {
        if (categories.length === 0) {
          const response = await fetch(
            `https://api.storyblok.com/v2/cdn/stories?${new URLSearchParams({
              token: "xF8XKQlZVoFL8lCd7gjolwtt",
              starts_with: "products/",
              per_page: 100,
            })}`,
          )
          const data = await response.json()

          const formattedProducts = data.stories.map((story) => {
            const content = story.content
            return {
              id: story.id,
              category: content.category || "sin-categoria",
            }
          })

          setCategories(extractCategories(formattedProducts))
        }
      } catch (err) {
        console.error("Error loading initial categories:", err)
      }
    }

    loadInitialCategories()
  }, [extractCategories])

  useEffect(() => {
    fetchProducts(1)
  }, [sortOption, selectedCategory])

  useEffect(() => {
    if (page > 1) {
      fetchProducts(page)
    }
  }, [page, fetchProducts])

  const lastProductRef = useCallback(
    (node) => {
      if (initialLoading || loading) return

      if (observer.current) observer.current.disconnect()

      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !fetchingLock) {
            setTimeout(() => {
              setPage((prevPage) => prevPage + 1)
            }, 200)
          }
        },
        {
          rootMargin: "300px",
          threshold: 0.1,
        },
      )

      if (node) observer.current.observe(node)
    },
    [initialLoading, loading, hasMore, fetchingLock],
  )

  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect()
      }
    }
  }, [])

  const toggleFilters = () => {
    setShowFilters(!showFilters)
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSortOptions && !event.target.closest(".sort-dropdown-container")) {
        setShowSortOptions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showSortOptions])

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

  const animateCartButton = () => {
    if (typeof window !== "undefined") {
      const cartButton = document.getElementById("cart-button")
      if (cartButton) {
        cartButton.classList.add("animate-bounce")
        setTimeout(() => {
          cartButton.classList.remove("animate-bounce")
        }, 600)
      }
    }
  }

  const AddToCartButton = ({ product, className = "" }) => {
    const [isAdding, setIsAdding] = useState(false)

    const handleAddToCart = async (e) => {
      e.preventDefault()
      e.stopPropagation()

      setIsAdding(true)

      setTimeout(() => {
        addToCart(product)
        setIsAdding(false)
      }, 200)
    }

    return (
      <button
        onClick={handleAddToCart}
        disabled={isAdding}
        className={`bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-medium py-2 px-4 rounded-md transition-all duration-300 flex items-center justify-center transform hover:scale-105 hover:shadow-lg active:scale-95 disabled:opacity-70 ${className}`}
      >
        <ShoppingCart className={`h-4 w-4 mr-2 transition-transform duration-300 ${isAdding ? "animate-spin" : ""}`} />
        {isAdding ? "Agregando..." : "Agregar al Carrito"}
      </button>
    )
  }

  const productGrid = useMemo(() => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product, index) => {
          const isLastProduct = products.length === index + 1
          return (
            <div
              key={`${product.id}-${index}`}
              ref={isLastProduct ? lastProductRef : null}
              className="bg-white rounded-lg shadow-sm overflow-hidden group cursor-pointer transition-transform hover:scale-[1.02] hover:shadow-md"
            >
              <a href={`/productos/preview?slug=${product.slug}`} className="block">
                <div className="relative">
                  <div className="block">
                    <img
                      src={product.image || "/placeholder.svg?height=200&width=200"}
                      alt={product.name}
                      loading="lazy"
                      className="w-full h-48 object-contain p-4"
                      onError={(e) => {
                        e.target.src = "/placeholder.svg?height=200&width=200"
                        e.target.onerror = null
                      }}
                    />
                  </div>
                  {product.on_sale && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1">
                      Oferta
                    </div>
                  )}
                  {product.stock_status === "outofstock" && (
                    <div className="absolute top-2 left-2 bg-gray-700 text-white text-xs font-bold rounded-full px-2 py-1">
                      Agotado
                    </div>
                  )}
                  {product.category && (
                    <div className="absolute bottom-2 left-2 bg-teal-500 text-white text-xs font-bold rounded-full px-2 py-1">
                      {product.category}
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="block">
                    <h3 className="font-medium text-gray-900 group-hover:text-teal-600 transition-colors mb-2 line-clamp-2 h-12">
                      {product.name}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div>
                      {product.on_sale ? (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">${product.sale_price || product.price}</span>
                          <span className="text-sm text-gray-500 line-through">${product.regular_price}</span>
                        </div>
                      ) : (
                        <span className="font-bold text-gray-900">${product.price}</span>
                      )}
                    </div>
                  </div>
                </div>
              </a>

              {isAuthenticated && (
                <div className="p-4 pt-0">
                  <AddToCartButton product={product} className="w-full" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }, [products, lastProductRef, isAuthenticated])

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Nuestros Productos</h2>

            {isAuthenticated && (
              <div className="flex items-center gap-3">
                <button
                  onClick={openPurchaseHistory}
                  className="relative inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-200 hover:scale-105 hover:shadow-md"
                >
                  <Package className="h-5 w-5 mr-2" />
                  <span>Mis Compras</span>
                </button>

                <button
                  id="cart-button"
                  onClick={openCart}
                  className="relative inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-200 hover:scale-105 hover:shadow-md"
                >
                  <ShoppingCart className="h-5 w-5 transition-transform duration-200" />
                  {getTotalItems() > 0 && (
                    <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center animate-pulse">
                      {getTotalItems()}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            <aside className={`w-full lg:w-64 ${showFilters ? "block" : "hidden"} lg:block`}>
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-3">Categorías</h3>
                  {categories.length > 0 ? (
                    <ul className="space-y-2">
                      {categories.map((category, index) => (
                        <li key={index}>
                          <button
                            onClick={() => handleCategoryClick(category.name)}
                            className={`flex items-center justify-between w-full text-left ${
                              selectedCategory === category.name
                                ? "text-teal-600 font-medium"
                                : "text-gray-600 hover:text-teal-600"
                            } transition-colors`}
                          >
                            <span>{category.name}</span>
                            <span className="text-xs bg-gray-100 rounded-full px-2 py-1">{category.count}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-sm">Cargando categorías...</p>
                  )}
                </div>
                {selectedCategory && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Filtro activo:</span>
                      <button
                        onClick={() => handleCategoryClick(selectedCategory)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Limpiar
                      </button>
                    </div>
                    <div className="mt-2 inline-flex items-center bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-sm">
                      {selectedCategory}
                    </div>
                  </div>
                )}
              </div>
            </aside>

            <div className="lg:hidden mb-4 flex justify-between items-center">
              <button
                className="flex items-center gap-2 bg-white rounded-lg px-4 py-2 shadow-sm text-gray-700"
                onClick={toggleFilters}
              >
                <SlidersHorizontal className="w-5 h-5" />
                <span>Filtros</span>
              </button>

              <div className="relative sort-dropdown-container">
                <button
                  className="flex items-center gap-2 bg-white rounded-lg px-4 py-2 shadow-sm text-gray-700"
                  onClick={() => setShowSortOptions(!showSortOptions)}
                >
                  <ArrowUpDown className="w-5 h-5" />
                  <span>Ordenar</span>
                </button>

                {showSortOptions && (
                  <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg z-10 py-2">
                    <button
                      className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${sortOption === "relevance" ? "text-teal-600 font-medium" : "text-gray-700"}`}
                      onClick={() => handleSort("relevance")}
                    >
                      Más relevantes
                    </button>
                    <button
                      className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${sortOption === "price_asc" ? "text-teal-600 font-medium" : "text-gray-700"}`}
                      onClick={() => handleSort("price_asc")}
                    >
                      Precio: menor a mayor
                    </button>
                    <button
                      className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${sortOption === "price_desc" ? "text-teal-600 font-medium" : "text-gray-700"}`}
                      onClick={() => handleSort("price_desc")}
                    >
                      Precio: mayor a menor
                    </button>
                    <button
                      className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${sortOption === "date" ? "text-teal-600 font-medium" : "text-gray-700"}`}
                      onClick={() => handleSort("date")}
                    >
                      Más recientes
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1">
              <div className="hidden lg:flex justify-between items-center mb-6 bg-white rounded-lg shadow-sm p-4">
                <div className="text-sm text-gray-500">
                  Mostrando <span className="font-medium text-gray-900">{products.length}</span>
                  {totalProducts > 0 && (
                    <span>
                      {" "}
                      de <span className="font-medium text-gray-900">{totalProducts}</span>
                    </span>
                  )}{" "}
                  productos
                  {selectedCategory && (
                    <span>
                      {" "}
                      en <span className="font-medium text-teal-600">{selectedCategory}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label htmlFor="sort" className="text-sm text-gray-500">
                      Ordenar por:
                    </label>
                    <div className="relative">
                      <select
                        id="sort"
                        className="appearance-none bg-gray-50 border border-gray-200 rounded-md pl-3 pr-8 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        value={sortOption}
                        onChange={(e) => handleSort(e.target.value)}
                      >
                        <option value="relevance">Más relevantes</option>
                        <option value="price_asc">Precio: menor a mayor</option>
                        <option value="price_desc">Precio: mayor a menor</option>
                        <option value="date">Más recientes</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-8">
                  <p>{error}</p>
                  <p className="text-sm mt-1">Por favor, intenta nuevamente más tarde.</p>
                </div>
              )}

              {initialLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, index) => (
                    <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden">
                      <div className="w-full h-48 bg-gray-200 animate-pulse"></div>
                      <div className="p-4">
                        <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                        <div className="flex items-center justify-between mt-4">
                          <div className="h-6 bg-gray-200 rounded animate-pulse w-1/4"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {productGrid}

                  {loading && (
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-600"></div>
                    </div>
                  )}

                  {!loading && !error && products.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-gray-500 mb-4">
                        No se encontraron productos{selectedCategory ? ` en la categoría "${selectedCategory}"` : ""}
                      </p>
                      {selectedCategory && (
                        <button
                          onClick={() => handleCategoryClick(selectedCategory)}
                          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md transition-colors"
                        >
                          Limpiar filtros
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {isPurchaseHistoryOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div
              className={`absolute inset-0 bg-black/30 transition-all duration-300
                ${isPurchaseHistoryAnimating ? "backdrop-blur-sm opacity-100" : "backdrop-blur-none opacity-0"}`}
              onClick={closePurchaseHistory}
            ></div>

            <div
              className={`absolute right-0 top-0 h-full w-full max-w-4xl bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
                isPurchaseHistoryAnimating ? "translate-x-0" : "translate-x-full"
              }`}
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-teal-50 to-blue-50">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Historial de Compras</h2>
                    <p className="text-sm text-gray-500">
                      {purchaseHistory.length > 0
                        ? `${purchaseHistory.length} compra${purchaseHistory.length > 1 ? "s" : ""} realizadas`
                        : "No hay compras registradas"}
                    </p>
                  </div>
                  <button
                    onClick={closePurchaseHistory}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 hover:rotate-90 transform"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {loadingPurchases ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="relative w-12 h-12 flex items-center justify-center mb-4">
                          <div className="absolute inline-block w-full h-full rounded-full border-4 border-teal-200"></div>
                          <div className="inline-block w-full h-full animate-spin rounded-full border-4 border-teal-600 border-t-transparent"></div>
                      </div>

                      <p className="text-gray-500">Cargando historial de compras...</p>
                    </div>
                  ) : purchaseError ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="text-red-500 mb-4">
                        <Package className="h-16 w-16 mx-auto mb-2" />
                      </div>
                      <p className="text-red-600 font-medium mb-2">Error al cargar las compras</p>
                      <p className="text-gray-500 mb-4">{purchaseError}</p>
                      <button
                        onClick={fetchPurchaseHistory}
                        className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md transition-colors"
                      >
                        Reintentar
                      </button>
                    </div>
                  ) : purchaseHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="animate-bounce mb-4">
                        <Package className="h-16 w-16 text-gray-300" />
                      </div>
                      <p className="text-gray-500 text-lg mb-2">No tienes compras registradas</p>
                      <p className="text-gray-400">Cuando realices tu primera compra, aparecerá aquí</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {purchaseHistory.map((purchase, index) => (
                        <div
                          key={purchase.order_id || index}
                          className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow"
                        >

                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 pb-4 border-b border-gray-200">
                            <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                              <div className="bg-teal-100 p-2 rounded-full">
                                <Package className="h-5 w-5 text-teal-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">Orden #{purchase.order_id}</h3>
                                <p className="text-sm text-gray-500 flex items-center">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  {formatDate(purchase.fecha)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-teal-600">
                                {formatCurrency(purchase.monto_db, purchase.stripe?.stripe_currency)}
                              </p>
                              {purchase.stripe?.stripe_status && (
                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    purchase.stripe.stripe_status === "paid"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  <CreditCard className="h-3 w-3 mr-1" />
                                      {purchase.stripe.stripe_status === "paid"
                                        ? "Pagado"
                                        : purchase.stripe.stripe_status === "unpaid"
                                        ? "Sin pagar"
                                        : "No procesado"}
                                    </span>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="bg-white p-3 rounded-lg">
                              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                                <User className="h-4 w-4 mr-2 text-gray-500" />
                                Información del Cliente
                              </h4>
                              <p className="text-sm text-gray-600">{purchase.usuario}</p>
                              <p className="text-sm text-gray-500">{purchase.correo}</p>
                            </div>

                            {purchase.stripe && (
                              <div className="bg-white p-3 rounded-lg">
                                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                                  <CreditCard className="h-4 w-4 mr-2 text-gray-500" />
                                  Información de Pago
                                </h4>
                                <p className="text-sm text-gray-600">
                                  Total:{" "}
                                  {formatCurrency(purchase.stripe.stripe_total, purchase.stripe.stripe_currency)}
                                </p>
                                {purchase.stripe.stripe_payment_intent && (
                                  <p className="text-xs text-gray-500 font-mono">
                                    ID: {purchase.stripe.stripe_payment_intent}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          {purchase.items && purchase.items.length > 0 && (
                            <div className="bg-white rounded-lg p-4">
                              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                                <Eye className="h-4 w-4 mr-2 text-gray-500" />
                                Productos Comprados ({purchase.items.length})
                              </h4>
                              <div className="space-y-3">
                                {purchase.items.map((item, itemIndex) => (
                                  <div
                                    key={itemIndex}
                                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                                  >
                                    <div className="flex-1">
                                      <p className="font-medium text-gray-900">{item.name}</p>
                                      <p className="text-sm text-gray-500">
                                        Cantidad: {item.quantity} × {formatCurrency(item.amount_each)}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-semibold text-gray-900">{formatCurrency(item.total)}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t p-4 bg-gray-50">
                  <div className="flex justify-between items-center">
                    <button
                      onClick={fetchPurchaseHistory}
                      disabled={loadingPurchases}
                      className="text-teal-600 hover:text-teal-700 font-medium disabled:opacity-50"
                    >
                      {loadingPurchases ? "Actualizando..." : "Actualizar"}
                    </button>
                    <button
                      onClick={closePurchaseHistory}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {isCartOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div
              className={`absolute inset-0 bg-black/30 transition-all duration-300
                ${isCartAnimating ? "backdrop-blur-sm opacity-100" : "backdrop-blur-none opacity-0"}`}
              onClick={closeCart}
            ></div>

            <div
              className={`absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
                isCartAnimating ? "translate-x-0" : "translate-x-full"
              }`}
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-teal-50 to-blue-50">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Carrito de Compras</h2>
                    <p className="text-sm text-gray-500">
                      {getTotalItems() > 0
                        ? `${getTotalItems()} producto${getTotalItems() > 1 ? "s" : ""} en tu carrito`
                        : "Tu carrito está vacío"}
                    </p>
                  </div>
                  <button
                    onClick={closeCart}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 hover:rotate-90 transform"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {cartItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="animate-bounce">
                        <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
                      </div>
                      <p className="text-gray-500">No hay productos en tu carrito</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cartItems.map((item, index) => (
                        <div
                          key={item.id}
                          className="flex items-start space-x-3 bg-gradient-to-r from-gray-50 to-gray-100 p-3 rounded-lg transform transition-all duration-300 hover:scale-102 hover:shadow-md"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div className="relative overflow-hidden rounded-lg">
                            <img
                              src={item.image || "/placeholder.svg?height=80&width=80"}
                              alt={item.name}
                              className="h-16 w-16 object-cover flex-shrink-0 transition-transform duration-300 hover:scale-110"
                              onError={(e) => {
                                e.target.src = "/placeholder.svg?height=80&width=80"
                                e.target.onerror = null
                              }}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight">
                              {item.name}
                            </h4>
                            {item.category && <p className="text-xs text-gray-500 mt-1 capitalize">{item.category}</p>}
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-sm font-semibold text-teal-600">${item.price}</p>

                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="h-7 w-7 flex items-center justify-center border border-gray-300 rounded-full hover:bg-red-50 hover:border-red-300 text-gray-600 hover:text-red-600 transition-all duration-200 transform hover:scale-110"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>

                                <span className="text-sm font-medium w-6 text-center bg-white rounded px-2 py-1 shadow-sm">
                                  {item.quantity}
                                </span>

                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="h-7 w-7 flex items-center justify-center border border-gray-300 rounded-full hover:bg-teal-50 hover:border-teal-300 text-gray-600 hover:text-teal-600 transition-all duration-200 transform hover:scale-110"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>

                                <button
                                  onClick={() => removeFromCart(item.id)}
                                  className="h-7 w-7 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full ml-2 transition-all duration-200 transform hover:scale-110 hover:rotate-12"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>

                            <div className="mt-1">
                              <p className="text-xs text-gray-500">
                                Subtotal: $
                                <span className="font-medium text-teal-600">
                                  {(
                                    Number.parseFloat(item.price.toString().replace(/[^0-9.-]+/g, "")) * item.quantity
                                  ).toFixed(2)}
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {cartItems.length > 0 && (
                  <div className="border-t p-4 space-y-4 bg-gradient-to-r from-gray-50 to-gray-100">
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                      <span className="text-lg font-semibold">Total:</span>
                      <span className="text-xl font-bold text-teal-600 animate-pulse">
                        ${getTotalPrice().toFixed(2)}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={handleCheckout}
                        disabled={isProcessingPayment}
                        className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        <span className="flex items-center justify-center">
                          {isProcessingPayment ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Procesando...
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Pagar con Stripe
                            </>
                          )}
                        </span>
                      </button>

                      <button
                        onClick={clearCart}
                        disabled={isProcessingPayment}
                        className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        Vaciar Carrito
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

export default ProductsGrid
