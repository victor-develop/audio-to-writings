import React from 'react'
import { motion } from 'framer-motion'
import { Chrome, Mic, FileText } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const LoginPage: React.FC = () => {
  const { signInWithGoogle } = useAuth()

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle()
    } catch (error) {
      console.error('Sign in error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full"
      >
        {/* Logo and Title */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <Mic className="w-8 h-8 text-primary-600" />
          </div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-3">出口成章 AI</h1>
        <p className="text-xl text-primary-600 font-semibold mb-2">把你的每一次表达，都沉淀为穿越时间的内容。</p>
        <p className="text-gray-600">点击录音，即刻将灵感转化为文章、笔记与专业洞察。</p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-6"
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                <Mic className="w-4 h-4 text-primary-600" />
              </div>
              <span className="text-gray-700">AI驱动的语音转文字转换</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-accent-100 rounded-lg flex items-center justify-center">
                <Chrome className="w-4 h-4 text-accent-600" />
              </div>
              <span className="text-gray-700">System & microphone capture</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-gray-700">AI-powered transcription</span>
            </div>
          </div>
        </motion.div>

        {/* Sign In Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <button
            onClick={handleGoogleSignIn}
            className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-xl border border-gray-300 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center space-x-3"
          >
            <Chrome className="w-5 h-5" />
            <span>Continue with Google</span>
          </button>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center text-sm text-gray-500 mt-6"
        >
          By continuing, you agree to our Terms of Service and Privacy Policy
        </motion.p>
      </motion.div>
    </div>
  )
}

export default LoginPage
