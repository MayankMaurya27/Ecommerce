import React, { useContext, useEffect, useState, Fragment } from 'react'
import Layout from '../../components/layout/Layout'
import myContext from '../../context/data/myContext';
import { useParams } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { doc, getDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { addToCart } from '../../redux/cartSlice';
import { fireDB } from '../../fireabase/FirebaseConfig';
import { Dialog, Transition } from '@headlessui/react';

function ProductInfo() {
    const context = useContext(myContext);
    const { loading, setLoading } = context;

    const [products, setProducts] = useState('')
    const params = useParams()
    const [aiInfo, setAiInfo] = useState('')
    const [isAiModalOpen, setIsAiModalOpen] = useState(false)
    const [isLoadingAi, setIsLoadingAi] = useState(false)
    // console.log(products.title)

    const getProductData = async () => {
        setLoading(true)
        try {
            const productTemp = await getDoc(doc(fireDB, "products", params.id))
            // console.log(productTemp)
            setProducts(productTemp.data());
            // console.log(productTemp.data())
            setLoading(false)
        } catch (error) {
            console.log(error)
            setLoading(false)
        }
    }


    useEffect(() => {
        getProductData()

    }, [])



    const dispatch = useDispatch()
    const cartItems = useSelector((state) => state.cart)
    // console.log(cartItems)

    // add to cart
    const addCart = (products) => {
        dispatch(addToCart(products))
        toast.success('add to cart');
    }

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cartItems));
    }, [cartItems])

    // Get AI info function
    const getAiInfo = async () => {
        if (!products || !products.title) {
            toast.error('Product information not available');
            return;
        }

        setIsLoadingAi(true);
        setIsAiModalOpen(true);

        try {
            const API_KEY = "AIzaSyCJn4zvlw4YYw2VOT52fitmRhzdyjjAeQA";
            const prompt = `Provide detailed information about this product:
Title: ${products.title}
Description: ${products.description || 'No description available'}
Price: ₹${products.price}
Category: ${products.category || 'Not specified'}

Please provide:
1. Key features and benefits
2. Use cases and applications
3. Technical specifications (if applicable)
4. Comparison with similar products
5. Buying recommendations
6. Any additional relevant information

Format the response in a clear, structured way.`;

            // Use gemini-pro model (most widely available)
            const model = 'gemini-pro';
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
            
            const requestBody = {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            };

            console.log('Making request to Gemini API...');
            console.log('URL:', url);
            console.log('Request Body:', requestBody);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            console.log('Response status:', response.status, response.statusText);

            let data;
            try {
                data = await response.json();
            } catch (parseError) {
                const text = await response.text();
                console.error('Failed to parse JSON response:', text);
                throw new Error(`Invalid response from server: ${text.substring(0, 200)}`);
            }
            
            // Log the response for debugging
            console.log('Gemini API Response:', data);

            if (!response.ok) {
                // Try to get error details
                const errorMessage = data.error?.message || data.message || `HTTP ${response.status}: ${response.statusText}`;
                console.error('API Error Details:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: data.error,
                    fullResponse: data
                });
                throw new Error(errorMessage);
            }

            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                const aiText = data.candidates[0].content.parts[0].text;
                setAiInfo(aiText);
            } else if (data.promptFeedback && data.promptFeedback.blockReason) {
                throw new Error(`Content was blocked: ${data.promptFeedback.blockReason}`);
            } else {
                console.error('Unexpected response structure:', data);
                throw new Error('Invalid response from AI');
            }
        } catch (error) {
            console.error('Error fetching AI info:', error);
            const errorMessage = error.message || 'Unknown error occurred';
            toast.error(`Failed to get AI information: ${errorMessage}`);
            setAiInfo(`Sorry, we could not fetch AI information at this time.\n\nError: ${errorMessage}\n\nPlease check:\n1. Your internet connection\n2. API key validity\n3. Try again later`);
        } finally {
            setIsLoadingAi(false);
        }
    }

    const closeAiModal = () => {
        setIsAiModalOpen(false);
        setAiInfo('');
    }




    return (
        <Layout>
            <section className="text-gray-600 body-font overflow-hidden">
                <div className="container px-5 py-10 mx-auto">
                    {products && 
                    <div className="lg:w-4/5 mx-auto flex flex-wrap">
                        <img
                            alt="ecommerce"
                            className="lg:w-1/3 w-full lg:h-auto  object-cover object-center rounded"
                            src={products.imageUrl}
                        />
                        <div className="lg:w-1/2 w-full lg:pl-10 lg:py-6 mt-6 lg:mt-0">
                            <h2 className="text-sm title-font text-gray-500 tracking-widest">
                                BRAND NAME
                            </h2>
                            <h1 className="text-gray-900 text-3xl title-font font-medium mb-1">
                                {products.title}
                            </h1>
                            <div className="flex mb-4">
                                <span className="flex items-center">
                                    <svg
                                        fill="currentColor"
                                        stroke="currentColor"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        className="w-4 h-4 text-indigo-500"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                    </svg>
                                    <svg
                                        fill="currentColor"
                                        stroke="currentColor"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        className="w-4 h-4 text-indigo-500"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                    </svg>
                                    <svg
                                        fill="currentColor"
                                        stroke="currentColor"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        className="w-4 h-4 text-indigo-500"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                    </svg>
                                    <svg
                                        fill="currentColor"
                                        stroke="currentColor"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        className="w-4 h-4 text-indigo-500"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                    </svg>
                                    <svg
                                        fill="none"
                                        stroke="currentColor"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        className="w-4 h-4 text-indigo-500"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                    </svg>
                                    <span className="text-gray-600 ml-3">4 Reviews</span>
                                </span>
                                <span className="flex ml-3 pl-3 py-2 border-l-2 border-gray-200 space-x-2s">
                                    <a className="text-gray-500">
                                        <svg
                                            fill="currentColor"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            className="w-5 h-5"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                                        </svg>
                                    </a>
                                    <a className="text-gray-500">
                                        <svg
                                            fill="currentColor"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            className="w-5 h-5"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
                                        </svg>
                                    </a>
                                    <a className="text-gray-500">
                                        <svg
                                            fill="currentColor"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            className="w-5 h-5"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
                                        </svg>
                                    </a>
                                </span>
                            </div>
                            <p className="leading-relaxed border-b-2 mb-5 pb-5">
                                {products.description}
                            </p>

                            {/* Get AI Info Button */}
                            <div className="mb-5">
                                <button 
                                    onClick={getAiInfo}
                                    disabled={isLoadingAi}
                                    className="w-full text-white bg-gradient-to-r from-purple-500 to-indigo-600 border-0 py-3 px-6 focus:outline-none hover:from-purple-600 hover:to-indigo-700 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {isLoadingAi ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>Getting AI Info...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                            </svg>
                                            <span>Get AI Info</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="flex">
                                <span className="title-font font-medium text-2xl text-gray-900">
                                ₹{products.price}
                                </span>
                                <button  onClick={()=>addCart(products)} className="flex ml-auto text-white bg-indigo-500 border-0 py-2 px-6 focus:outline-none hover:bg-indigo-600 rounded">
                                    Add To Cart
                                </button>
                                <button className="rounded-full w-10 h-10 bg-gray-200 p-0 border-0 inline-flex items-center justify-center text-gray-500 ml-4">
                                    <svg
                                        fill="currentColor"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        className="w-5 h-5"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>}
                </div>
            </section>

            {/* AI Info Modal */}
            <Transition appear show={isAiModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={closeAiModal}>
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
                                <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-2xl font-bold leading-6 text-gray-900 mb-4 flex items-center justify-between"
                                    >
                                        <span className="flex items-center gap-2">
                                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                            </svg>
                                            AI-Generated Product Insights
                                        </span>
                                        <button
                                            onClick={closeAiModal}
                                            className="text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </Dialog.Title>
                                    
                                    <div className="mt-4">
                                        {isLoadingAi ? (
                                            <div className="flex flex-col items-center justify-center py-12">
                                                <svg className="animate-spin h-12 w-12 text-purple-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <p className="text-gray-600">Analyzing product details with AI...</p>
                                            </div>
                                        ) : (
                                            <div className="max-h-96 overflow-y-auto">
                                                <div className="prose prose-sm max-w-none">
                                                    <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                                        {aiInfo || 'No information available'}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-6 flex justify-end">
                                        <button
                                            type="button"
                                            className="inline-flex justify-center rounded-md border border-transparent bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 focus:outline-none focus-ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
                                            onClick={closeAiModal}
                                        >
                                            Close
                                        </button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

        </Layout>
    )
}

export default ProductInfo