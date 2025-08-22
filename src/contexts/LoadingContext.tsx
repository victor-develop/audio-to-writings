import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface LoadingContextType {
  isLoading: boolean
  startLoading: () => void
  stopLoading: () => void
  loadingCount: number
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export const useLoading = () => {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}

interface LoadingProviderProps {
  children: ReactNode
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [loadingCount, setLoadingCount] = useState(0)

  const startLoading = useCallback(() => {
    setLoadingCount(prev => prev + 1)
  }, [])

  const stopLoading = useCallback(() => {
    setLoadingCount(prev => Math.max(0, prev - 1))
  }, [])

  const isLoading = loadingCount > 0

  return (
    <LoadingContext.Provider value={{ isLoading, startLoading, stopLoading, loadingCount }}>
      {children}
    </LoadingContext.Provider>
  )
}
