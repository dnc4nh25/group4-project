import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = sessionStorage.getItem('cinema_user')
    return saved ? JSON.parse(saved) : null
  })

  const login = (user) => {
    setCurrentUser(user)
    sessionStorage.setItem('cinema_user', JSON.stringify(user))
  }

  const logout = () => {
    setCurrentUser(null)
    sessionStorage.removeItem('cinema_user')
  }

  return (
    <AuthContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
