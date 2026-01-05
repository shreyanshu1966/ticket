import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildApiUrl } from './config'

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('adminToken')
      
      if (!token) {
        navigate('/admin/login')
        return
      }

      try {
        // Verify token with a simple API call
        const response = await fetch(buildApiUrl('/api/admin/dashboard/stats'), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('adminToken')
          navigate('/admin/login')
        } else {
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        localStorage.removeItem('adminToken')
        navigate('/admin/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [navigate])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return isAuthenticated ? children : null
}

export default ProtectedRoute