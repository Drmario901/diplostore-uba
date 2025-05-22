"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import axios from "axios"
import { ChevronDown, SlidersHorizontal, ArrowUpDown } from "lucide-react"

const ProductGrid = () => {
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
        const response = await axios.get("https://api.storyblok.com/v2/cdn/stories", { params })

        const formattedProducts = response.data.stories.map((story) => {
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

        const total = response.headers["total"] || response.data.total || filteredProducts.length
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
          const response = await axios.get("https://api.storyblok.com/v2/cdn/stories", {
            params: {
              token: "xF8XKQlZVoFL8lCd7gjolwtt",
              starts_with: "products/",
              per_page: 100, 
            },
          })

          const formattedProducts = response.data.stories.map((story) => {
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
            </div>
          )
        })}
      </div>
    )
  }, [products, lastProductRef])

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Nuestros Productos</h2>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar / Filters (Hidden on mobile, toggleable) */}
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

          {/* Mobile filter button */}
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

          {/* Main content / Product grid */}
          <div className="flex-1">
            {/* Sort and filter options (desktop) */}
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

                <div className="flex items-center gap-2">
                  <label htmlFor="perPage" className="text-sm text-gray-500">
                    Mostrar:
                  </label>
                  <div className="relative">
                    <select
                      id="perPage"
                      className="appearance-none bg-gray-50 border border-gray-200 rounded-md pl-3 pr-8 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      disabled
                    >
                      <option>100</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Error state */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-8">
                <p>{error}</p>
                <p className="text-sm mt-1">Por favor, intenta nuevamente más tarde.</p>
              </div>
            )}

            {/* Initial loading state */}
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
                {/* Product grid */}
                {productGrid}

                {/* Loading indicator for infinite scroll */}
                {loading && (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-600"></div>
                  </div>
                )}

                {/* Empty state */}
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
    </section>
  )
}

export default ProductGrid
