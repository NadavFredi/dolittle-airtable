import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '@/hooks/useAuth'
import { AppFooter } from '@/components/AppFooter'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

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

    if (!parentName.trim() || !phone.trim() || !email.trim()) {
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
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 text-center">
              {paymentData?.productName || 'תשלום'}
            </h1>
            {paymentData && (
              <div className="mb-6 text-center text-gray-600">
                <p className="text-lg">
                  סכום: ₪{paymentData.amount.toLocaleString()}
                </p>
                {paymentData.paymentType && (
                  <p className="text-sm mt-1">סוג תשלום: {paymentData.paymentType}</p>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="parentName" className="block text-sm font-medium text-gray-700 mb-2">
                  שם הורה <span className="text-red-500">*</span>
                </label>
                <Input
                  id="parentName"
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="הכנס שם מלא"
                  required
                  className="w-full"
                  dir="rtl"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  טלפון <span className="text-red-500">*</span>
                </label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="הכנס מספר טלפון"
                  required
                  className="w-full"
                  dir="rtl"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  מייל <span className="text-red-500">*</span>
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="הכנס כתובת אימייל"
                  required
                  className="w-full"
                  dir="rtl"
                />
              </div>

              {paymentData && paymentData.paymentType !== 'הוראת קבע' && paymentData.maxPayments && paymentData.maxPayments > 1 && (
                <div>
                  <label htmlFor="numPayments" className="block text-sm font-medium text-gray-700 mb-2">
                    כמות תשלומים (מקסימום {paymentData.maxPayments})
                  </label>
                  <Input
                    id="numPayments"
                    type="number"
                    min="1"
                    max={paymentData.maxPayments}
                    value={numPayments}
                    onChange={(e) => setNumPayments(parseInt(e.target.value) || 1)}
                    className="w-full"
                    dir="rtl"
                  />
                </div>
              )}

              {paymentData && paymentData.paymentType === 'הוראת קבע' && (
                <div>
                  <label htmlFor="numPayments" className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full"
                    dir="rtl"
                  />
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg font-semibold"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    מעבד...
                  </>
                ) : (
                  'המשך לתשלום'
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
      <AppFooter />
    </div>
  )
}

