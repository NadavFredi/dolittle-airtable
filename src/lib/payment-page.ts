export interface PaymentPageData {
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

interface BuildTranzilaPostDataArgs {
  paymentData: PaymentPageData
  selectedNumPayments: number
  thtk: string
  childName: string
  parentName: string
  cleanPhone: string
  email: string
  userId?: string | null
  today?: Date
}

const isPositiveNumber = (value: number | null | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0

export const hasFirstPayment = (paymentData: PaymentPageData): boolean =>
  isPositiveNumber(paymentData.firstPayment)

export const isRecurringPayment = (paymentType: string): boolean =>
  paymentType === 'הוראת קבע' || paymentType === 'recurring'

export const getHandshakeSum = (paymentData: PaymentPageData): number =>
  hasFirstPayment(paymentData) ? paymentData.firstPayment! : paymentData.amount

export const getRecurringPaymentsCount = (
  paymentData: PaymentPageData,
  selectedNumPayments: number
): number => (hasFirstPayment(paymentData) ? (paymentData.numPayments || 1) : selectedNumPayments)

export const getInitialNumPayments = (paymentData: PaymentPageData): number => {
  if (hasFirstPayment(paymentData) || paymentData.paymentType === 'אשראי') {
    return 1
  }

  const initialNumPayments = paymentData.numPayments || 1
  if (paymentData.maxPayments && paymentData.maxPayments > 0) {
    return Math.min(initialNumPayments, paymentData.maxPayments)
  }

  return initialNumPayments
}

export const buildTranzilaPostData = ({
  paymentData,
  selectedNumPayments,
  thtk,
  childName,
  parentName,
  cleanPhone,
  email,
  userId,
  today = new Date(),
}: BuildTranzilaPostDataArgs): Record<string, string | number> => {
  const postData: Record<string, string | number> = {}

  const addParam = (key: string, value: string | number | null | undefined) => {
    if (value !== null && value !== undefined && value !== '') {
      postData[key] = value
    }
  }

  const sumAmount = getHandshakeSum(paymentData)
  const recurringPaymentsCount = getRecurringPaymentsCount(paymentData, selectedNumPayments)
  const hasSteppedPayments = hasFirstPayment(paymentData)
  const shouldConfigureRecurringInIframe =
    isRecurringPayment(paymentData.paymentType) && !hasFirstPayment(paymentData)

  addParam('supplier', 'calbnoot')
  addParam('thtk', thtk)
  addParam('new_process', 1)
  addParam('lang', paymentData.language || 'il')
  addParam('sum', sumAmount)
  addParam('currency', 1)
  addParam('tranmode', 'AK')

  if (isRecurringPayment(paymentData.paymentType)) {
    addParam('cred_type', 1)

    if (shouldConfigureRecurringInIframe) {
      addParam('recur_payments', selectedNumPayments)
      addParam('recur_transaction', '4_approved')
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      addParam('recur_start_date', `${year}-${month}-${day}`)
    }
  } else {
    addParam('cred_type', 8)

    if (paymentData.maxPayments && paymentData.maxPayments > 0) {
      addParam('maxpay', paymentData.maxPayments)
    }
  }

  addParam('child_name', childName)
  addParam('parent_name', parentName)
  addParam('phone', cleanPhone)
  addParam('email', email)
  if (userId) {
    addParam('record_id', userId)
  }
  addParam('custom_product_name', paymentData.productName)
  addParam('contact', parentName)

  const productList = [
    {
      product_name: paymentData.productName,
      product_quantity: 1,
      product_price: sumAmount,
    },
  ]
  addParam('json_purchase_data', JSON.stringify(productList))
  addParam('u71', 1)

  if (paymentData.notifyUrlAddress?.trim()) {
    addParam('notify_url_address', paymentData.notifyUrlAddress.trim())
  }

  if (isRecurringPayment(paymentData.paymentType) || hasSteppedPayments) {
    addParam('amount_of_next_payments', recurringPaymentsCount)
    addParam('single_payment_sum', paymentData.amount)
  }
  if (hasSteppedPayments) {
    addParam('first_payment', paymentData.firstPayment!)
  }

  return postData
}
