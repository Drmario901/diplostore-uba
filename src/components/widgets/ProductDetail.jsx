"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { ArrowLeft, Tag } from "lucide-react"

const ProductDetail = () => {
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [slug, setSlug] = useState("")

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
    const fetchProductDetail = async () => {
      if (!slug) return

      try {
        setLoading(true)
        console.log(`Buscando producto con slug: ${slug}`)

        const response = await axios.get(`https://api.storyblok.com/v2/cdn/stories/products/${slug}`, {
          params: {
            token: "xF8XKQlZVoFL8lCd7gjolwtt"
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
            className="flex items-center text-teal-600 hover:text-teal-700 mb-8 transition-colors"
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
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-md transition-colors"
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

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <button onClick={goBack} className="flex items-center text-teal-600 hover:text-teal-700 mb-8 transition-colors">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Volver a productos
        </button>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/2">
            <div className="bg-white rounded-lg overflow-hidden border border-gray-100">
              <img
                src={product.image || "/placeholder.svg"}
                alt={product.name}
                className="w-full h-auto object-contain aspect-square"
                onError={(e) => {
                  e.target.src = "/placeholder.svg?height=400&width=400"
                  e.target.onerror = null
                }}
              />
            </div>
          </div>

          <div className="w-full md:w-1/2">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>

            {product.category && (
              <div className="flex items-center mb-4">
                <Tag className="h-4 w-4 text-teal-600 mr-2" />
                <span className="text-sm text-teal-600 font-medium">{product.category}</span>
              </div>
            )}

            <div className="mb-6">
              {product.on_sale ? (
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-gray-900">${product.sale_price || product.price}</span>
                  <span className="text-lg text-gray-500 line-through">${product.regular_price}</span>
                  <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1">Oferta</span>
                </div>
              ) : (
                <span className="text-2xl font-bold text-gray-900">${product.price}</span>
              )}
            </div>

            <div className="prose prose-sm max-w-none mb-8">{renderDescription(product.description)}</div>

            {product.stock_status === "outofstock" ? (
              <div className="inline-block bg-gray-200 text-gray-700 px-6 py-3 rounded-md font-medium">Agotado</div>
            ) : (
              <div className="inline-block bg-teal-600 text-white px-6 py-3 rounded-md font-medium">Disponible</div>
            )}
          </div>
        </div>

        <div className="mt-12 border-t border-gray-100 pt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Detalles del producto</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">ID del producto</p>
              <p className="font-medium">{product.id}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Categoría</p>
              <p className="font-medium">{product.category || "Sin categoría"}</p>
            </div>
            {/* <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Fecha de creación</p>
              <p className="font-medium">{new Date(product.created_at).toLocaleDateString()}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Última actualización</p>
              <p className="font-medium">{new Date(product.updated_at).toLocaleDateString()}</p>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail
