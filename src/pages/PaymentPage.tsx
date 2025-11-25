import React, { useState, useEffect } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { supabase } from '@/hooks/useAuth'
import { AppFooter } from '@/components/AppFooter'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Lock, Shield, CreditCard, CheckCircle2, User } from 'lucide-react'

// Extend Window interface for jQuery
declare global {
    interface Window {
        jQuery?: any
        $?: any
        $n?: any
    }
}

interface PaymentPageData {
    id: string
    productName: string
    productDescription?: string
    paymentType: string
    numPayments: number
    maxPayments: number | null
    amount: number
    language: string
    notifyUrlAddress: string
    termsApprovalText?: string
    termsLink?: string
    firstPayment?: number | null
}

export default function PaymentPage() {
    const location = useLocation()
    const [searchParams] = useSearchParams()
    // Extract ID from pathname: /payment/{id}
    const id = location.pathname.replace('/payment/', '')
    // Extract user_id from query parameters
    const userId = searchParams.get('user_id')
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [paymentData, setPaymentData] = useState<PaymentPageData | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [showIframe, setShowIframe] = useState(false)
    const [termsAccepted, setTermsAccepted] = useState(false)

    // Form fields
    const [childName, setChildName] = useState('')
    const [parentName, setParentName] = useState('')
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [numPayments, setNumPayments] = useState<number>(1)

    useEffect(() => {
        // Check if userId is provided
        if (!userId || userId.trim() === '') {
            setLoading(false)
            setError('invalid_page')
            return
        }

        if (id && id.trim() !== '') {
            fetchPaymentPageData(id)
        } else {
            setLoading(false)
            setError('מספר זיהוי לא תקין')
        }
    }, [id, userId])

    // Load jQuery and Tranzila scripts when component mounts
    useEffect(() => {
        // Load jQuery if not already loaded
        if (!window.jQuery) {
            const jqueryScript = document.createElement('script')
            jqueryScript.src = 'https://code.jquery.com/jquery-3.6.0.js'
            jqueryScript.async = true
            document.head.appendChild(jqueryScript)

            // Load Tranzila script after jQuery loads
            jqueryScript.onload = () => {
                const tranzilaScript = document.createElement('script')
                tranzilaScript.src = `https://direct.tranzila.com/js/tranzilanapple_v3.js?v=${Date.now()}`
                tranzilaScript.async = true
                document.head.appendChild(tranzilaScript)

                // Set up jQuery noConflict
                tranzilaScript.onload = () => {
                    if (window.jQuery) {
                        window.$n = window.jQuery.noConflict(true)
                    }
                }
            }
        } else {
            // jQuery already loaded, just load Tranzila script
            const tranzilaScript = document.createElement('script')
            tranzilaScript.src = `https://direct.tranzila.com/js/tranzilanapple_v3.js?v=${Date.now()}`
            tranzilaScript.async = true
            document.head.appendChild(tranzilaScript)

            tranzilaScript.onload = () => {
                if (window.jQuery) {
                    window.$n = window.jQuery.noConflict(true)
                }
            }
        }
    }, [])


    const fetchPaymentPageData = async (recordId: string) => {
        try {
            setLoading(true)
            setError(null)

            const { data, error: fetchError } = await supabase.functions.invoke('get-payment-page', {
                body: { recordId },
            })

            if (fetchError) {
                throw new Error(fetchError.message || 'Failed to fetch payment page data')
            }

            if (data?.success && data?.data) {
                setPaymentData(data.data)
                // If firstPayment has a value, force single payment (ignore כמות תשלומים)
                if (data.data.firstPayment !== null && data.data.firstPayment !== undefined && data.data.firstPayment > 0) {
                    setNumPayments(1)
                } else if (data.data.paymentType === 'אשראי') {
                    // For credit payments, default to 1. For recurring payments, use the numPayments from data
                    setNumPayments(1)
                } else {
                    // Ensure numPayments doesn't exceed maxPayments if it exists
                    const initialNumPayments = data.data.numPayments || 1
                    if (data.data.maxPayments && data.data.maxPayments > 0) {
                        setNumPayments(Math.min(initialNumPayments, data.data.maxPayments))
                    } else {
                        setNumPayments(initialNumPayments)
                    }
                }
            } else {
                throw new Error(data?.error || 'Failed to load payment page data')
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred while loading the payment page')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!childName.trim() || !parentName.trim() || !phone.trim() || !email.trim()) {
            setError('אנא מלא את כל השדות הנדרשים')
            return
        }

        if (!paymentData) {
            setError('נתוני התשלום לא נטענו')
            return
        }

        // Check terms acceptance if terms link exists
        if (paymentData.termsLink && paymentData.termsLink.trim() !== '' && !termsAccepted) {
            setError('אנא אשר את התקנון כדי להמשיך')
            return
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            setError('כתובת אימייל לא תקינה')
            return
        }

        // Validate phone (basic validation - at least 9 digits)
        const phoneRegex = /^[0-9]{9,}$/
        const cleanPhone = phone.replace(/[\s-]/g, '')
        if (!phoneRegex.test(cleanPhone)) {
            setError('מספר טלפון לא תקין')
            return
        }

        setSubmitting(true)
        setError(null)

        try {
            // First, get the Tranzila handshake token
            // If firstPayment exists, use it for the handshake (first payment amount), otherwise use regular amount
            const handshakeSum = (paymentData.firstPayment !== null && paymentData.firstPayment !== undefined && paymentData.firstPayment > 0)
                ? paymentData.firstPayment
                : paymentData.amount
            const { data: handshakeData, error: handshakeError } = await supabase.functions.invoke('tranzila-handshake', {
                body: { sum: handshakeSum },
            })

            if (handshakeError || !handshakeData?.success || !handshakeData?.thtk) {
                throw new Error(handshakeError?.message || 'Failed to create Tranzila handshake')
            }

            const thtk = handshakeData.thtk

            // Build POST data for Tranzila iframe
            const buildPostData = () => {
                const postData: Record<string, string | number> = {}

                // Helper function to add parameter
                const addParam = (key: string, value: string | number) => {
                    if (value !== null && value !== undefined && value !== '') {
                        postData[key] = value
                    }
                }

                // Add supplier (required for Tranzila)
                addParam('supplier', 'calbnoot')

                // Add thtk token from handshake
                addParam('thtk', thtk)

                // Required parameters based on Tranzila documentation
                addParam('new_process', 1)
                addParam('lang', paymentData.language || 'il')
                // If firstPayment exists, use it as the sum (first payment amount), otherwise use regular amount
                const sumAmount = (paymentData.firstPayment !== null && paymentData.firstPayment !== undefined && paymentData.firstPayment > 0)
                    ? paymentData.firstPayment
                    : paymentData.amount
                addParam('sum', sumAmount)
                addParam('currency', 1)
                addParam('tranmode', 'AK')

                // Payment type configuration
                if (paymentData.paymentType === 'הוראת קבע' || paymentData.paymentType === 'recurring') {
                    // For recurring payments (הוראת קבע), use recur_payments
                    addParam('cred_type', 1)
                    addParam('recur_payments', numPayments)
                    addParam('recur_transaction', '4_approved')
                    // Set start date to today in yyyy-mm-dd format
                    const today = new Date()
                    const year = today.getFullYear()
                    const month = String(today.getMonth() + 1).padStart(2, '0')
                    const day = String(today.getDate()).padStart(2, '0')
                    addParam('recur_start_date', `${year}-${month}-${day}`)
                } else {
                    // Credit card payment (אשראי)
                    addParam('cred_type', 8)

                    // Maximum number of installments
                    if (paymentData.maxPayments && paymentData.maxPayments > 0) {
                        addParam('maxpay', paymentData.maxPayments)
                    }
                }

                // Add custom fields (these might be used for tracking)
                addParam('child_name', childName)
                addParam('parent_name', parentName)
                addParam('phone', cleanPhone)
                addParam('email', email)
                // Pass user_id to iframe as record_id (not the payment page record id)
                if (userId) {
                    addParam('record_id', userId)
                }
                addParam('custom_product_name', paymentData.productName)
                addParam('contact', parentName)

                // Add product list as JSON array (always 1 product with quantity 1)
                // Passed as json_purchase_data parameter (JSON string, not URL-encoded)
                const productList = [
                    {
                        product_name: paymentData.productName,
                        product_quantity: 1,
                        product_price: sumAmount
                    }
                ]
                const productListJson = JSON.stringify(productList)
                addParam('json_purchase_data', productListJson)
                addParam('u71', 1)

                // Add notify_url_address
                if (paymentData.notifyUrlAddress) {
                    addParam('notify_url_address', paymentData.notifyUrlAddress)
                }

                // Add required parameters: amount_of_next_payments, single_payment_sum, first_payment
                // When firstPayment exists, use original numPayments from data (not the state which is forced to 1)
                const recurringPaymentsCount = (paymentData.firstPayment !== null && paymentData.firstPayment !== undefined && paymentData.firstPayment > 0)
                    ? (paymentData.numPayments || 1)
                    : numPayments
                addParam('amount_of_next_payments', recurringPaymentsCount)
                addParam('single_payment_sum', paymentData.amount)
                if (paymentData.firstPayment !== null && paymentData.firstPayment !== undefined && paymentData.firstPayment > 0) {
                    addParam('first_payment', paymentData.firstPayment)
                }

                return postData
            }

            const postData = buildPostData()

            // Create a form and submit it to the iframe (similar to Tranzila's example)
            // This approach posts directly to Tranzila and loads the response in the iframe
            setShowIframe(true)

            // Use setTimeout to ensure iframe is rendered before form submission
            setTimeout(() => {
                const form = document.createElement('form')
                form.method = 'POST'
                form.action = 'https://direct.tranzila.com/calbnoot/iframenew.php'
                form.target = 'tranzila-iframe'
                form.style.display = 'none'

                // Add all form fields
                for (const [key, value] of Object.entries(postData)) {
                    if (value !== null && value !== undefined && value !== '') {
                        const input = document.createElement('input')
                        input.type = 'hidden'
                        input.name = key
                        // For json_purchase_data, URL-encode it
                        if (key === 'json_purchase_data') {
                            input.value = encodeURIComponent(String(value))
                        } else {
                            input.value = String(value)
                        }
                        form.appendChild(input)
                    }
                }

                // Add directcgi parameter
                const directcgiInput = document.createElement('input')
                directcgiInput.type = 'hidden'
                directcgiInput.name = 'directcgi'
                directcgiInput.value = 'on'
                form.appendChild(directcgiInput)

                document.body.appendChild(form)
                form.submit()
                document.body.removeChild(form)
            }, 100)
        } catch (err: any) {
            setError(err.message || 'שגיאה ביצירת תשלום')
        } finally {
            setSubmitting(false)
        }
    }



    if (loading) {
        return (
            <div className="min-h-screen flex flex-col" dir="rtl">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                        <p className="mt-4 text-gray-600">טוען נתונים...</p>
                    </div>
                </div>
                <AppFooter />
            </div>
        )
    }

    if (error && !paymentData) {
        const isInvalidPage = error === 'invalid_page'
        return (
            <div className="min-h-screen flex flex-col bg-gray-50" dir="rtl">
                <div className="flex-1 flex items-center justify-center px-4 py-12">
                    <div className="max-w-lg w-full text-center">
                        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
                            <div className="mb-6">
                                <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                                    <svg
                                        className="w-10 h-10 text-red-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                        />
                                    </svg>
                                </div>
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                                    מצטערים
                                </h1>
                                {isInvalidPage ? (
                                    <>
                                        <p className="text-lg text-gray-700 mb-2">
                                            דף זה אינו תקין
                                        </p>
                                        <p className="text-base text-gray-600 mb-6">
                                            אנא צרו קשר עם הצוות שלנו לקבלת עזרה
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-lg text-gray-700 mb-2">
                                            נראה שדף זה אינו זמין כרגע
                                        </p>
                                        <p className="text-base text-gray-600 mb-6">
                                            אנא צרו קשר עם הצוות שלנו לקבלת עזרה
                                        </p>
                                    </>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
                <AppFooter />
            </div>
        )
    }

    if (showIframe) {
        return (
            <div className="min-h-screen flex flex-col" dir="rtl">
                <div className="flex-1 p-4 md:p-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                            <div className="p-4 text-white" style={{ backgroundColor: '#4f60a8' }}>
                                <h1 className="text-xl font-bold">{paymentData?.productName || 'תשלום'}</h1>
                                {paymentData?.productDescription && paymentData.productDescription.trim() && (
                                    <p className="text-sm opacity-95 mt-2 leading-relaxed" style={{ lineHeight: '1.6' }}>
                                        {paymentData.productDescription}
                                    </p>
                                )}
                                {paymentData && paymentData.firstPayment !== null && paymentData.firstPayment !== undefined && paymentData.firstPayment > 0 && (
                                    <div className="mt-3 space-y-2">
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm opacity-90">תשלום ראשון:</span>
                                                <span className="text-lg font-bold">₪{paymentData.firstPayment.toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm opacity-90">יתר התשלומים:</span>
                                                <span className="text-base font-semibold">₪{paymentData.amount.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        {(() => {
                                            const recurringPayments = paymentData.numPayments || 1
                                            const totalPayments = 1 + recurringPayments
                                            return (
                                                <div className="pt-2 border-t border-white/20 space-y-1">
                                                    <div className="flex items-center justify-between text-xs opacity-85">
                                                        <span>סה"כ תשלומים:</span>
                                                        <span className="font-semibold">{totalPayments}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-xs opacity-85">
                                                        <span>תשלומים חוזרים:</span>
                                                        <span className="font-semibold">{recurringPayments}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-xs opacity-85">
                                                        <span>תשלום ראשון:</span>
                                                        <span className="font-semibold">1</span>
                                                    </div>
                                                </div>
                                            )
                                        })()}
                                    </div>
                                )}
                            </div>
                            <div className="w-full" style={{ minHeight: '600px' }}>
                                <iframe
                                    id="tranzila-iframe"
                                    name="tranzila-iframe"
                                    className="w-full border-0"
                                    style={{ minHeight: '600px', width: '100%' }}
                                    title="Tranzila Payment"
                                    allow="payment"
                                    {...({ allowPaymentRequest: 'true' } as any)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <AppFooter />
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50" dir="rtl">
            <div className="flex-1 flex items-center justify-center p-4 py-6">
                <div className="w-full max-w-2xl">
                    {/* Trust Badge Header - Compact */}
                    <div className="mb-2 flex items-center justify-center gap-3 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                            <Lock className="w-3 h-3 text-green-600" />
                            <span>תשלום מאובטח</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Shield className="w-3 h-3" style={{ color: '#4f60a8' }} />
                            <span>מוגן SSL</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <CreditCard className="w-3 h-3" style={{ color: '#4f60a8' }} />
                            <span>Tranzila</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden">
                        {/* Header with payment summary - Compact */}
                        <div className="text-white p-4" style={{ backgroundColor: '#4f60a8' }}>
                            <div className="flex items-center justify-between mb-1">
                                <h1 className="text-xl md:text-2xl font-bold">
                                    {paymentData?.productName || 'תשלום'}
                                </h1>
                                <div className="bg-white/20 rounded p-1.5">
                                    <CreditCard className="w-4 h-4" />
                                </div>
                            </div>
                            {paymentData?.productDescription && paymentData.productDescription.trim() && (
                                <div className="mt-2 mb-2">
                                    <p className="text-sm opacity-95 leading-relaxed" style={{ lineHeight: '1.6' }}>
                                        {paymentData.productDescription}
                                    </p>
                                </div>
                            )}
                            {paymentData && (
                                <>
                                    {paymentData.firstPayment !== null && paymentData.firstPayment !== undefined && paymentData.firstPayment > 0 ? (
                                        <>
                                            <div className="mt-2 flex items-center justify-between">
                                                <span className="text-sm opacity-90">תשלום ראשון:</span>
                                                <span className="text-xl font-bold">₪{paymentData.firstPayment.toLocaleString()}</span>
                                            </div>
                                            <div className="mt-1 flex items-center justify-between">
                                                <span className="text-sm opacity-90">יתר התשלומים:</span>
                                                <span className="text-lg font-semibold">₪{paymentData.amount.toLocaleString()}</span>
                                            </div>
                                            {(() => {
                                                const recurringPayments = paymentData.numPayments || 1
                                                const totalPayments = 1 + recurringPayments
                                                return (
                                                    <div className="mt-2 pt-2 border-t border-white/20 space-y-1">
                                                        <div className="flex items-center justify-between text-xs opacity-85">
                                                            <span>סה"כ תשלומים:</span>
                                                            <span className="font-semibold">{totalPayments}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between text-xs opacity-85">
                                                            <span>תשלומים חוזרים:</span>
                                                            <span className="font-semibold">{recurringPayments}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between text-xs opacity-85">
                                                            <span>תשלום ראשון:</span>
                                                            <span className="font-semibold">1</span>
                                                        </div>
                                                    </div>
                                                )
                                            })()}
                                        </>
                                    ) : (
                                        <div className="mt-2 flex items-center justify-between">
                                            <span className="text-sm opacity-90">סכום לתשלום:</span>
                                            <span className="text-xl font-bold">₪{paymentData.amount.toLocaleString()}</span>
                                        </div>
                                    )}
                                </>
                            )}
                            {paymentData?.paymentType && (
                                <div className="mt-1 flex items-center gap-1.5 text-xs opacity-90">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>
                                        סוג תשלום: {paymentData.paymentType}
                                        {paymentData.paymentType === 'הוראת קבע' && paymentData?.numPayments && (
                                            <span className="mr-1"> ({paymentData.numPayments} תשלומים)</span>
                                        )}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Form Section - Compact */}
                        <div className="p-4 md:p-5">
                            <div className="mb-3 pb-3 border-b border-gray-200">
                                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                    <User className="w-4 h-4" style={{ color: '#4f60a8' }} />
                                    פרטי ההזמנה
                                </h2>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-3">
                                <div>
                                    <label htmlFor="childName" className="block text-xs font-medium text-gray-700 mb-1">
                                        שם הילד <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        id="childName"
                                        type="text"
                                        value={childName}
                                        onChange={(e) => setChildName(e.target.value)}
                                        placeholder="הכנס שם הילד"
                                        required
                                        className="w-full border-gray-300 focus:border-[#4f60a8] focus:ring-[#4f60a8] h-9 text-sm"
                                        dir="rtl"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="parentName" className="block text-xs font-medium text-gray-700 mb-1">
                                        שם הורה <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        id="parentName"
                                        type="text"
                                        value={parentName}
                                        onChange={(e) => setParentName(e.target.value)}
                                        placeholder="הכנס שם מלא"
                                        required
                                        className="w-full border-gray-300 focus:border-[#4f60a8] focus:ring-[#4f60a8] h-9 text-sm"
                                        dir="rtl"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="phone" className="block text-xs font-medium text-gray-700 mb-1">
                                        טלפון <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="הכנס מספר טלפון"
                                        required
                                        className="w-full border-gray-300 focus:border-[#4f60a8] focus:ring-[#4f60a8] h-9 text-sm"
                                        dir="rtl"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1">
                                        מייל <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="הכנס כתובת אימייל"
                                        required
                                        className="w-full border-gray-300 focus:border-[#4f60a8] focus:ring-[#4f60a8] h-9 text-sm"
                                        dir="rtl"
                                    />
                                </div>


                                {error && (
                                    <div className="bg-red-50 border border-red-200 rounded p-2 flex items-start gap-2">
                                        <div className="flex-shrink-0 mt-0.5">
                                            <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <p className="text-red-600 text-xs">{error}</p>
                                    </div>
                                )}

                                {paymentData?.termsLink && paymentData.termsLink.trim() !== '' && (
                                    <label htmlFor="termsCheckbox" className="flex items-start gap-3 cursor-pointer">
                                        <Checkbox
                                            id="termsCheckbox"
                                            checked={termsAccepted}
                                            onChange={(e) => setTermsAccepted(e.target.checked)}
                                            className="mt-0.5 flex-shrink-0"
                                        />
                                        <span className="text-sm text-gray-700 leading-relaxed">
                                            {paymentData.termsApprovalText && paymentData.termsApprovalText.trim() !== ''
                                                ? paymentData.termsApprovalText
                                                : 'אני מאשר שקראתי והסכמתי לתקנון'}{' '}
                                            <a
                                                href={paymentData.termsLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[#4f60a8] underline hover:text-[#3d4d7a] transition-colors"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                קישור לתקנון
                                            </a>
                                        </span>
                                    </label>
                                )}

                                {/* Security Notice - Compact */}
                                <div className="bg-purple-50 border border-purple-200 rounded p-2 flex items-start gap-2" style={{ backgroundColor: '#f3f4f6', borderColor: '#e5e7eb' }}>
                                    <Lock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#4f60a8' }} />
                                    <div className="text-xs" style={{ color: '#4f60a8' }}>
                                        <p className="font-medium">תשלום מאובטח</p>
                                        <p className="text-[10px] mt-0.5">התשלום מתבצע דרך Tranzila - מערכת תשלומים מאובטחת ומאושרת</p>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={submitting || (!!paymentData?.termsLink && paymentData.termsLink.trim() !== '' && !termsAccepted)}
                                    className="w-full text-white py-3 text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{ backgroundColor: '#4f60a8' }}
                                    onMouseEnter={(e) => {
                                        if (!e.currentTarget.disabled) {
                                            e.currentTarget.style.backgroundColor = '#3d4d7a'
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!e.currentTarget.disabled) {
                                            e.currentTarget.style.backgroundColor = '#4f60a8'
                                        }
                                    }}
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            מעבד...
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="w-4 h-4" />
                                            המשך לתשלום מאובטח
                                        </>
                                    )}
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            <AppFooter />
        </div>
    )
}

