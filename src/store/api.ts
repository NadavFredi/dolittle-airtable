import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import { supabase } from "@/hooks/useAuth"

// Define the API response types
export interface AttendanceData {
  attendance?: Record<string, boolean>
  notes?: Record<string, string>
  history?: Record<string, Record<string, boolean>>
  historyNotes?: Record<string, Record<string, string>>
  dates?: string[]
}

export interface AttendanceResponse {
  success: boolean
  data?: AttendanceData
}

interface GetAttendanceRequest {
  cohortId: string
  date?: string
  fullHistory?: boolean
}

export interface PaymentPage {
  id: string
  name: string
  amount: number
  paymentType: string
}

export interface PaymentPagesResponse {
  success: boolean
  data?: PaymentPage[]
}

interface GetPaymentPagesRequest {
  search?: string
}

export const attendanceApi = createApi({
  reducerPath: "attendanceApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "",
    prepareHeaders: async (headers) => {
      // Add auth headers if needed
      return headers
    },
  }),
  tagTypes: ["Attendance", "PaymentPages"],
  endpoints: (builder) => ({
    getAttendance: builder.query<AttendanceResponse, GetAttendanceRequest>({
      async queryFn({ cohortId, date, fullHistory }) {
        try {
          const body: any = { cohortId }

          if (date && !fullHistory) {
            body.date = date
          } else if (fullHistory) {
            body.fullHistory = true
          }

          const { data, error } = await supabase.functions.invoke("get-attendance", {
            body,
          })

          if (error) {
            return { error: { status: "CUSTOM_ERROR", error: error.message } }
          }

          return { data: data as AttendanceResponse }
        } catch (error: any) {
          return { error: { status: "CUSTOM_ERROR", error: error.message } }
        }
      },
      providesTags: (result, error, arg) => [{ type: "Attendance", id: `${arg.cohortId}-${arg.date || "history"}` }],
    }),
    getPaymentPages: builder.query<PaymentPagesResponse, GetPaymentPagesRequest>({
      async queryFn({ search = "" }) {
        try {
          const { data, error } = await supabase.functions.invoke("get-payment-pages", {
            body: { search },
          })

          if (error) {
            return { error: { status: "CUSTOM_ERROR", error: error.message } }
          }

          return { data: data as PaymentPagesResponse }
        } catch (error: any) {
          return { error: { status: "CUSTOM_ERROR", error: error.message } }
        }
      },
      // Cache based on search query - same search won't trigger duplicate calls
      providesTags: (result, error, arg) => [{ type: "PaymentPages", id: arg.search || "all" }],
    }),
  }),
})

export const { useGetAttendanceQuery, useLazyGetAttendanceQuery, useGetPaymentPagesQuery, useLazyGetPaymentPagesQuery } = attendanceApi
