import { createContext, useContext } from 'react'

export const AlertsContext = createContext(null)

export function useAlerts() {
  return useContext(AlertsContext)
}
