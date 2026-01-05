import React, { useContext, useState, useRef } from 'react'
import myContext from '../../context/data/myContext'
import { toast } from 'react-toastify'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'

function Filter() {
    const context = useContext(myContext)
    const { mode, searchkey, setSearchkey, filterType, setFilterType,
        filterPrice, setFilterPrice, product } = context
    
    const [isImageModalOpen, setIsImageModalOpen] = useState(false)
    const [selectedImage, setSelectedImage] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const fileInputRef = useRef(null)

    // Convert image to base64
    const convertImageToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => {
                const base64String = reader.result.split(',')[1] // Remove data:image/...;base64, prefix
                resolve(base64String)
            }
            reader.onerror = reject
            reader.readAsDataURL(file)
        })
    }

    // Handle image selection
    const handleImageSelect = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select a valid image file')
            return
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast.error('Image size should be less than 10MB')
            return
        }

        setSelectedImage(file)
        const preview = URL.createObjectURL(file)
        setImagePreview(preview)
        setIsImageModalOpen(true)
    }

    // Analyze image with Google Cloud Vision API
    const analyzeImage = async () => {
        if (!selectedImage) return

        setIsAnalyzing(true)
        try {
            // Convert image to base64
            const base64Image = await convertImageToBase64(selectedImage)

            // Google Cloud Vision API endpoint
            const API_KEY = "AIzaSyCJn4zvlw4YYw2VOT52fitmRhzdyjjAeQA"
            const url = `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`

            const requestBody = {
                requests: [{
                    image: {
                        content: base64Image
                    },
                    features: [
                        {
                            type: "LABEL_DETECTION",
                            maxResults: 10
                        },
                        {
                            type: "TEXT_DETECTION",
                            maxResults: 10
                        },
                        {
                            type: "OBJECT_LOCALIZATION",
                            maxResults: 10
                        }
                    ]
                }]
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            })

            const data = await response.json()

            console.log('Vision API Response:', data)

            if (!response.ok) {
                throw new Error(data.error?.message || 'Failed to analyze image')
            }

            if (data.responses && data.responses[0]) {
                const annotations = data.responses[0]
                let searchTerms = []

                // Extract labels
                if (annotations.labelAnnotations) {
                    annotations.labelAnnotations.forEach(label => {
                        if (label.score > 0.5) { // Only use high-confidence labels
                            searchTerms.push(label.description)
                        }
                    })
                }

                // Extract detected text
                if (annotations.textAnnotations && annotations.textAnnotations.length > 0) {
                    const fullText = annotations.textAnnotations[0].description
                    const words = fullText.split(/\s+/).filter(word => word.length > 2)
                    searchTerms.push(...words.slice(0, 5)) // Add first 5 words
                }

                // Extract object names
                if (annotations.localizedObjectAnnotations) {
                    annotations.localizedObjectAnnotations.forEach(obj => {
                        if (obj.score > 0.5) {
                            searchTerms.push(obj.name)
                        }
                    })
                }

                // Combine search terms and update search key
                if (searchTerms.length > 0) {
                    const combinedSearch = searchTerms.join(' ').toLowerCase()
                    setSearchkey(combinedSearch)
                    toast.success(`Found: ${searchTerms.slice(0, 3).join(', ')}`)
                    setIsImageModalOpen(false)
                    setSelectedImage(null)
                    setImagePreview(null)
                    if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                    }
                } else {
                    toast.warning('Could not identify objects in the image. Please try another image.')
                }
            } else {
                throw new Error('No annotations found in response')
            }
        } catch (error) {
            console.error('Error analyzing image:', error)
            toast.error(`Failed to analyze image: ${error.message}`)
        } finally {
            setIsAnalyzing(false)
        }
    }

    const closeImageModal = () => {
        setIsImageModalOpen(false)
        setSelectedImage(null)
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview)
            setImagePreview(null)
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    return (
        <div>
            <div className=' container mx-auto px-4 mt-5 '>
                <div className="p-5 rounded-lg bg-gray-100 drop-shadow-xl border border-gray-200"
                    style={{
                        backgroundColor: mode === 'dark' ? '#282c34' : '',
                        color: mode === 'dark' ? 'white' : '',
                    }}>
                    <div className="relative">
                        <div className="absolute flex items-center ml-2 h-full">
                            <svg className="w-4 h-4 fill-current text-primary-gray-dark" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M15.8898 15.0493L11.8588 11.0182C11.7869 10.9463 11.6932 10.9088 11.5932 10.9088H11.2713C12.3431 9.74952 12.9994 8.20272 12.9994 6.49968C12.9994 2.90923 10.0901 0 6.49968 0C2.90923 0 0 2.90923 0 6.49968C0 10.0901 2.90923 12.9994 6.49968 12.9994C8.20272 12.9994 9.74952 12.3431 10.9088 11.2744V11.5932C10.9088 11.6932 10.9495 11.7869 11.0182 11.8588L15.0493 15.8898C15.1961 16.0367 15.4336 16.0367 15.5805 15.8898L15.8898 15.5805C16.0367 15.4336 16.0367 15.1961 15.8898 15.0493ZM6.49968 11.9994C3.45921 11.9994 0.999951 9.54016 0.999951 6.49968C0.999951 3.45921 3.45921 0.999951 6.49968 0.999951C9.54016 0.999951 11.9994 3.45921 11.9994 6.49968C11.9994 9.54016 9.54016 11.9994 6.49968 11.9994Z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            name="searchkey"
                            value={searchkey}
                            onChange={(e) => setSearchkey(e.target.value)}
                            id="searchkey"
                            placeholder="Search here"
                            className="px-8 py-3 w-full rounded-md bg-violet-0 border-transparent outline-0 text-sm" style={{ backgroundColor: mode === 'dark' ? 'rgb(64 66 70)' : '', color: mode === 'dark' ? 'white' : '', }} />
                    </div>
                    
                    {/* Image Search Button */}
                    <div className="mt-3">
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleImageSelect}
                            className="hidden"
                            id="image-search-input"
                        />
                        <label
                            htmlFor="image-search-input"
                            className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-md cursor-pointer transition-all font-medium text-sm"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>Search by Image</span>
                        </label>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                        <p className="font-medium">
                            Filters
                        </p>
                        <button className="px-4 py-2 bg-gray-50hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-md" style={{ color: mode === 'dark' ? 'white' : '' }}>
                            Reset Filter
                        </button>
                    </div>
                    <div>
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
                            <select value={filterType} onChange={(e)=> setFilterType(e.target.value)} className="px-4 py-3 w-full rounded-md bg-gray-50 border-transparent outline-0 focus:border-gray-500 focus:bg-white focus:ring-0 text-sm" style={{ backgroundColor: mode === 'dark' ? 'rgb(64 66 70)' : '', color: mode === 'dark' ? 'white' : '', }}>

                                {product.map((item, index) => {
                                    return (
                                        <option value={item.category}>{item.category}</option>
                                    )
                                })}
                            </select>
                            <select value={filterPrice} onChange={(e)=>setFilterPrice(e.target.value)} className="px-4 py-3 w-full rounded-md bg-gray-50 border-transparent outline-0  focus:border-gray-500 focus:bg-white focus:ring-0 text-sm" style={{ backgroundColor: mode === 'dark' ? 'rgb(64 66 70)' : '', color: mode === 'dark' ? 'white' : '', }}>
                                {product.map((item, index) => {
                                    return (
                                        <option value={item.price}>{item.price}</option>
                                    )
                                })}
                            </select>

                        </div>
                    </div>
                </div>
            </div>

            {/* Image Analysis Modal */}
            <Transition appear show={isImageModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={closeImageModal}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black bg-opacity-25" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all" style={{ backgroundColor: mode === 'dark' ? '#282c34' : '', color: mode === 'dark' ? 'white' : '' }}>
                                    <Dialog.Title
                                        as="h3"
                                        className="text-xl font-bold leading-6 mb-4 flex items-center justify-between"
                                    >
                                        <span className="flex items-center gap-2">
                                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            Analyze Image
                                        </span>
                                        <button
                                            onClick={closeImageModal}
                                            className="text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </Dialog.Title>
                                    
                                    <div className="mt-4">
                                        {imagePreview && (
                                            <div className="mb-4">
                                                <img 
                                                    src={imagePreview} 
                                                    alt="Preview" 
                                                    className="w-full h-64 object-contain rounded-lg border border-gray-300"
                                                />
                                            </div>
                                        )}
                                        
                                        {isAnalyzing ? (
                                            <div className="flex flex-col items-center justify-center py-8">
                                                <svg className="animate-spin h-12 w-12 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <p className="text-gray-600">Analyzing image with AI...</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <p className="text-sm text-gray-600">
                                                    Click "Analyze Image" to identify objects and text in this image, then search for similar products.
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-6 flex justify-end gap-3">
                                        <button
                                            type="button"
                                            className="inline-flex justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none transition-colors"
                                            onClick={closeImageModal}
                                            disabled={isAnalyzing}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={analyzeImage}
                                            disabled={isAnalyzing || !selectedImage}
                                        >
                                            {isAnalyzing ? 'Analyzing...' : 'Analyze Image'}
                                        </button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    )
}

export default Filter