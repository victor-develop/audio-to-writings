import { useCallback } from 'react'
import { useLoading } from '../contexts/LoadingContext'

export const useApiWithLoading = () => {
  const { startLoading, stopLoading } = useLoading()

  const apiCall = useCallback(async <T>(
    apiFunction: () => Promise<T>,
    options?: { 
      showLoading?: boolean
      onSuccess?: (result: T) => void
      onError?: (error: Error) => void
    }
  ): Promise<T | null> => {
    const { showLoading = true, onSuccess, onError } = options || {}
    
    if (showLoading) {
      startLoading()
    }
    
    try {
      const result = await apiFunction()
      if (onSuccess) {
        onSuccess(result)
      }
      return result
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Unknown error occurred')
      if (onError) {
        onError(errorObj)
      }
      throw errorObj
    } finally {
      if (showLoading) {
        stopLoading()
      }
    }
  }, [startLoading, stopLoading])

  return { apiCall }
}
