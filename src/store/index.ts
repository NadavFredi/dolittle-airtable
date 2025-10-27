import { configureStore } from "@reduxjs/toolkit"
import { attendanceApi } from "./api"

export const store = configureStore({
  reducer: {
    [attendanceApi.reducerPath]: attendanceApi.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(attendanceApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
