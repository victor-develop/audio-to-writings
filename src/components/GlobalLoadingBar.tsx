import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLoading } from '../contexts/LoadingContext'

const GlobalLoadingBar: React.FC = () => {
  const { isLoading } = useLoading()

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: '100%', opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="fixed top-0 left-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 z-50 shadow-lg"
          style={{
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s ease-in-out infinite'
          }}
        />
      )}
    </AnimatePresence>
  )
}

export default GlobalLoadingBar
