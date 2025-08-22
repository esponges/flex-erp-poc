import { createContext, useContext, useReducer, type ReactNode } from 'react'

interface User {
  id: number
  organization_id: number
  email: string
  name: string
  role: string
}

interface Organization {
  id: number
  name: string
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  organization: Organization | null
  token: string | null
}

type AuthAction = 
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; organization: Organization; token: string } }
  | { type: 'LOGOUT' }

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  organization: null,
  token: localStorage.getItem('auth_token'),
}

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      localStorage.setItem('auth_token', action.payload.token)
      return {
        isAuthenticated: true,
        user: action.payload.user,
        organization: action.payload.organization,
        token: action.payload.token,
      }
    case 'LOGOUT':
      localStorage.removeItem('auth_token')
      return {
        isAuthenticated: false,
        user: null,
        organization: null,
        token: null,
      }
    default:
      return state
  }
}

interface AuthContextType {
  state: AuthState
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('http://localhost:8080/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        throw new Error('Login failed')
      }

      const data = await response.json()
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: data.user,
          organization: data.organization,
          token: data.token,
        },
      })
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const logout = () => {
    dispatch({ type: 'LOGOUT' })
  }

  return (
    <AuthContext.Provider value={{ state, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}