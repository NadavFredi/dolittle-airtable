import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '@/hooks/useAuth'
import { AppFooter } from '@/components/AppFooter'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, Lock, Shield, CreditCard, CheckCircle2, User } from 'lucide-react'

interface PaymentPageData {
    id: string
    productName: string
    paymentType: string
    numPayments: number
    maxPayments: number | null
    amount: number
    language: string
}

export default function PaymentPage() {
    const location = useLocation()
    // Extract ID from pathname: /payment/{id}
    const id = location.pathname.replace('/payment/', '')
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [paymentData, setPaymentData] = useState<PaymentPageData | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [showIframe, setShowIframe] = useState(false)
    const [iframeUrl, setIframeUrl] = useState<string>('')

    // Form fields
    const [childName, setChildName] = useState('')
    const [parentName, setParentName] = useState('')
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [numPayments, setNumPayments] = useState<number>(1)

    useEffect(() => {
        if (id && id.trim() !== '') {
            fetchPaymentPageData(id)
        } else {
            setLoading(false)
            setError('מספר זיהוי לא תקין')
        }
    }, [id])

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
                setNumPayments(data.data.numPayments)
            } else {
                throw new Error(data?.error || 'Failed to load payment page data')
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred while loading the payment page')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!childName.trim() || !parentName.trim() || !phone.trim() || !email.trim()) {
            setError('אנא מלא את כל השדות הנדרשים')
            return
        }

        if (!paymentData) {
            setError('נתוני התשלום לא נטענו')
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

        // Build Tranzila iframe URL
        const buildIframeUrl = () => {
            const baseUrl = 'https://direct.tranzila.com/calbnoot/iframenew.php'
            const params = new URLSearchParams()

            // Required parameters based on Tranzila documentation
            params.append('lang', paymentData.language || 'il')
            params.append('sum', paymentData.amount.toString())

            // Payment type configuration
            // cred_type: 1 for credit card, 0 for other
            // For recurring payments (הוראת קבע), use recur_payments
            if (paymentData.paymentType === 'הוראת קבע' || paymentData.paymentType === 'recurring') {
                params.append('recur_payments', numPayments.toString())
                params.append('rrecur_transaction', '4_approved')
                params.append('cred_type', '1')
            } else {
                // Credit card payment
                params.append('cred_type', '1')
                if (paymentData.maxPayments && numPayments > 1) {
                    params.append('recur_payments', numPayments.toString())
                }
            }

            // Add custom fields (these might be used for tracking)
            params.append('child_name', childName)
            params.append('parent_name', parentName)
            params.append('phone', cleanPhone)
            params.append('email', email)
            params.append('record_id', paymentData.id)
            params.append('product_name', paymentData.productName)

            return `${baseUrl}?${params.toString()}`
        }

        const url = buildIframeUrl()
        setIframeUrl(url)
        setShowIframe(true)
        setSubmitting(false)
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
                                <p className="text-lg text-gray-700 mb-2">
                                    נראה שדף זה אינו זמין כרגע
                                </p>
                                <p className="text-base text-gray-600 mb-6">
                                    אנא צרו קשר עם הצוות שלנו לקבלת עזרה
                                </p>
                            </div>

                        </div>
                    </div>
                </div>
                <AppFooter />
            </div>
        )
    }

    if (showIframe && iframeUrl) {
        return (
            <div className="min-h-screen flex flex-col" dir="rtl">
                <div className="flex-1 p-4 md:p-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                            <div className="p-4 bg-blue-600 text-white">
                                <h1 className="text-xl font-bold">{paymentData?.productName || 'תשלום'}</h1>
                            </div>
                            <div className="w-full" style={{ minHeight: '600px' }}>
                                <iframe
                                    src={iframeUrl}
                                    className="w-full border-0"
                                    style={{ minHeight: '600px', width: '100%' }}
                                    title="Tranzila Payment"
                                    allow="payment"
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
                            {paymentData && (
                                <div className="mt-2 flex items-center justify-between">
                                    <span className="text-sm opacity-90">סכום לתשלום:</span>
                                    <span className="text-xl font-bold">₪{paymentData.amount.toLocaleString()}</span>
                                </div>
                            )}
                            {paymentData?.paymentType && (
                                <div className="mt-1 flex items-center gap-1.5 text-xs opacity-90">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>סוג תשלום: {paymentData.paymentType}</span>
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

                                {paymentData && paymentData.paymentType !== 'הוראת קבע' && paymentData.maxPayments && paymentData.maxPayments > 1 && (
                                    <div>
                                        <label htmlFor="numPayments" className="block text-xs font-medium text-gray-700 mb-1">
                                            כמות תשלומים (מקסימום {paymentData.maxPayments})
                                        </label>
                                        <Input
                                            id="numPayments"
                                            type="number"
                                            min="1"
                                            max={paymentData.maxPayments}
                                            value={numPayments}
                                            onChange={(e) => setNumPayments(parseInt(e.target.value) || 1)}
                                            className="w-full border-gray-300 focus:border-[#4f60a8] focus:ring-[#4f60a8] h-9 text-sm"
                                            dir="rtl"
                                        />
                                    </div>
                                )}

                                {paymentData && paymentData.paymentType === 'הוראת קבע' && (
                                    <div>
                                        <label htmlFor="numPayments" className="block text-xs font-medium text-gray-700 mb-1">
                                            כמות תשלומים
                                            {paymentData.maxPayments && ` (מקסימום ${paymentData.maxPayments})`}
                                        </label>
                                        <Input
                                            id="numPayments"
                                            type="number"
                                            min="1"
                                            max={paymentData.maxPayments || undefined}
                                            value={numPayments}
                                            onChange={(e) => setNumPayments(parseInt(e.target.value) || 1)}
                                            className="w-full border-gray-300 focus:border-[#4f60a8] focus:ring-[#4f60a8] h-9 text-sm"
                                            dir="rtl"
                                        />
                                    </div>
                                )}

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
                                    disabled={submitting}
                                    className="w-full text-white py-3 text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                                    style={{ backgroundColor: '#4f60a8' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4d7a'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4f60a8'}
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

