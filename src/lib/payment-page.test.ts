import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildTranzilaPostData,
  getInitialNumPayments,
  type PaymentPageData,
} from './payment-page'

const basePaymentData: PaymentPageData = {
  id: 'recPaymentPage',
  productName: 'Dog Training',
  productDescription: 'Monthly plan',
  paymentType: 'הוראת קבע',
  numPayments: 6,
  maxPayments: null,
  amount: 250,
  language: 'il',
  notifyUrlAddress: 'https://example.com/webhook',
  termsApprovalText: '',
  termsLink: '',
  firstPayment: null,
}

test('getInitialNumPayments forces one payment when first payment exists', () => {
  const result = getInitialNumPayments({
    ...basePaymentData,
    firstPayment: 400,
  })

  assert.equal(result, 1)
})

test('getInitialNumPayments forces one payment for credit pages', () => {
  const result = getInitialNumPayments({
    ...basePaymentData,
    paymentType: 'אשראי',
    numPayments: 12,
    maxPayments: 12,
  })

  assert.equal(result, 1)
})

test('buildTranzilaPostData keeps recurring setup in iframe when there is no first payment', () => {
  const postData = buildTranzilaPostData({
    paymentData: {
      ...basePaymentData,
      numPayments: 8,
      amount: 180,
      firstPayment: null,
    },
    selectedNumPayments: 8,
    thtk: 'token123',
    childName: 'Kid',
    parentName: 'Parent',
    cleanPhone: '0501234567',
    email: 'parent@example.com',
    userId: 'recRegistration',
    today: new Date('2026-04-01T10:00:00Z'),
  })

  assert.equal(postData.sum, 180)
  assert.equal(postData.cred_type, 1)
  assert.equal(postData.recur_payments, 8)
  assert.equal(postData.recur_transaction, '4_approved')
  assert.equal(postData.recur_start_date, '2026-04-01')
  assert.equal(postData.amount_of_next_payments, 8)
  assert.equal(postData.single_payment_sum, 180)
  assert.equal(postData.first_payment, undefined)
})

test('buildTranzilaPostData avoids iframe recurring setup when first payment exists', () => {
  const postData = buildTranzilaPostData({
    paymentData: {
      ...basePaymentData,
      numPayments: 11,
      amount: 280,
      firstPayment: 350,
    },
    selectedNumPayments: 1,
    thtk: 'token123',
    childName: 'Kid',
    parentName: 'Parent',
    cleanPhone: '0501234567',
    email: 'parent@example.com',
    userId: 'recRegistration',
    today: new Date('2026-04-01T10:00:00Z'),
  })

  assert.equal(postData.sum, 350)
  assert.equal(postData.cred_type, 1)
  assert.equal(postData.first_payment, 350)
  assert.equal(postData.single_payment_sum, 280)
  assert.equal(postData.amount_of_next_payments, 11)
  assert.equal(postData.recur_payments, undefined)
  assert.equal(postData.recur_transaction, undefined)
  assert.equal(postData.recur_start_date, undefined)

  const purchaseData = JSON.parse(decodeURIComponent(String(postData.json_purchase_data)))
  assert.deepEqual(purchaseData, [
    {
      product_name: 'Dog Training',
      product_quantity: 1,
      product_price: 350,
    },
  ])
})

test('buildTranzilaPostData sends credit maxpay without recurring params', () => {
  const postData = buildTranzilaPostData({
    paymentData: {
      ...basePaymentData,
      paymentType: 'אשראי',
      amount: 500,
      maxPayments: 12,
      numPayments: 12,
    },
    selectedNumPayments: 1,
    thtk: 'token123',
    childName: 'Kid',
    parentName: 'Parent',
    cleanPhone: '0501234567',
    email: 'parent@example.com',
    userId: 'recRegistration',
    today: new Date('2026-04-01T10:00:00Z'),
  })

  assert.equal(postData.cred_type, 8)
  assert.equal(postData.maxpay, 12)
  assert.equal(postData.recur_payments, undefined)
  assert.equal(postData.amount_of_next_payments, 1)
  assert.equal(postData.single_payment_sum, 500)
})

test('buildTranzilaPostData sends plain credit payload without maxpay for single charge pages', () => {
  const postData = buildTranzilaPostData({
    paymentData: {
      ...basePaymentData,
      paymentType: 'אשראי',
      amount: 100,
      maxPayments: null,
      numPayments: 1,
      firstPayment: null,
    },
    selectedNumPayments: 1,
    thtk: 'token123',
    childName: 'Kid',
    parentName: 'Parent',
    cleanPhone: '0501234567',
    email: 'parent@example.com',
    userId: 'recRegistration',
    today: new Date('2026-04-01T10:00:00Z'),
  })

  assert.equal(postData.sum, 100)
  assert.equal(postData.cred_type, 8)
  assert.equal(postData.maxpay, undefined)
  assert.equal(postData.first_payment, undefined)
  assert.equal(postData.recur_payments, undefined)
  assert.equal(postData.amount_of_next_payments, 1)
  assert.equal(postData.single_payment_sum, 100)
})
