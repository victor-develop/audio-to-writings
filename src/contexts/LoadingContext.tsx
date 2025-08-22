import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { useIsFetching, useIsMutating } from '@tanstack/react-query'

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
  
  // Auto-track TanStack Query loading states
  const isFetching = useIsFetching()
  const isMutating = useIsMutating()

  const startLoading = useCallback(() => {
    setLoadingCount(prev => prev + 1)
  }, [])

  const stopLoading = useCallback(() => {
    setLoadingCount(prev => Math.max(0, prev - 1))
  }, [])

  // Combine manual loading with TanStack Query loading states
  const isLoading = loadingCount > 0 || isFetching > 0 || isMutating > 0

  return (
    <LoadingContext.Provider value={{ isLoading, startLoading, stopLoading, loadingCount }}>
      {children}
    </LoadingContext.Provider>
  )
}
