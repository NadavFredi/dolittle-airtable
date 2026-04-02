# Payment Page Scenarios

This document defines the expected Tranzila payload behavior for the known Airtable payment-page configurations in `דפי תשלום מותאם אישית`.

It is the reference for:
- [payment-page.ts](/Users/nadavfriedman/Desktop/dev/projects/dolittle-airtable/src/lib/payment-page.ts)
- [payment-page.test.ts](/Users/nadavfriedman/Desktop/dev/projects/dolittle-airtable/src/lib/payment-page.test.ts)
- the Make webhook flow that receives the Tranzila payment callback

## Core Rule

When a page is `הוראת קבע` and also has a positive `תשלום ראשון`, the payment page must not configure recurring charges directly in the iframe with `recur_payments` / `recur_transaction` / `recur_start_date`.

Reason:
- the payment page sends the first charge details
- the Make webhook flow creates the STO after successful payment
- sending both can create duplicate recurring setup or duplicate charges

## Scenario 1

Record: `recaKWm8uCKY3sEbx`

Shape:
- `סוג תשלום = הוראת קבע`
- `כמות תשלומים = 3`
- `תשלום ראשון = empty`
- `סכום לתשלום = 0.1`

Expected behavior:
- `sum = 0.1`
- `cred_type = 1`
- `recur_payments = 3`
- `recur_transaction = 4_approved`
- `recur_start_date = today`
- `amount_of_next_payments = 3`
- `single_payment_sum = 0.1`
- no `first_payment`

Meaning:
- the iframe configures the recurring payments directly

## Scenario 2

Record: `recrH4HNdhYqx5NEr`

Shape:
- `סוג תשלום = הוראת קבע`
- `כמות תשלומים = 6`
- `תשלום ראשון = 0.1`
- `סכום לתשלום = 0.2`

Expected behavior:
- `sum = 0.1`
- `cred_type = 1`
- `first_payment = 0.1`
- `amount_of_next_payments = 6`
- `single_payment_sum = 0.2`
- no `recur_payments`
- no `recur_transaction`
- no `recur_start_date`

Meaning:
- the iframe handles the first charge details only
- the Make webhook flow is responsible for STO creation

## Scenario 3

Record: `recH45eVJqYHAqFDv`

Shape:
- `סוג תשלום = אשראי`
- `כמות תשלומים מקסימלית אשראי בלבד = 3`
- `סכום לתשלום = 0.4`
- `תשלום ראשון = empty`

Expected behavior:
- `sum = 0.4`
- `cred_type = 8`
- `maxpay = 3`
- `amount_of_next_payments = 1`
- `single_payment_sum = 0.4`
- no `first_payment`
- no recurring params

Meaning:
- this is a credit-card payment page with installment choice up to the max

## Scenario 4

Record: `recyRlG3KY8oiGpSQ`

Shape:
- `סוג תשלום = אשראי`
- no max installments
- `סכום לתשלום = 0.1`
- `תשלום ראשון = empty`

Expected behavior:
- `sum = 0.1`
- `cred_type = 8`
- no `maxpay`
- `amount_of_next_payments = 1`
- `single_payment_sum = 0.1`
- no `first_payment`
- no recurring params

Meaning:
- this is a plain single-charge credit payment page

## Verification

Current automated coverage:
- recurring without first payment
- recurring with different first payment and ongoing payment
- credit with max installments
- plain credit without max installments

Run:

```bash
npx tsx --test src/lib/payment-page.test.ts
```
