import { create } from 'zustand'
import AuthService, { User, LoginCredentials, RegisterData } from '../services/auth.service'

interface AuthState {
    user: User | null
    isAuthenticated: boolean
    isLoading: boolean
    error: string | null

    // Actions
    login: (credentials: LoginCredentials) => Promise<void>
    register: (userData: RegisterData) => Promise<void>
    logout: () => Promise<void>
    checkAuth: () => Promise<void>
    clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,

    login: async (credentials) => {
        try {
            set({ error: null })

            // --- BYPASS TEMPORAL: MOCK LOGIN ---
            console.log('Forcing Mock Login...')

            // Simular validación básica
            if (!credentials.email || !credentials.password) {
                throw new Error('Credenciales inválidas')
            }

            // Simular delay de red
            await new Promise(resolve => setTimeout(resolve, 500))

            const mockUser = {
                id: '1',
                email: credentials.email,
                name: 'Usuario Demo',
                role: 'client'
            }

            set({
                user: mockUser as any,
                isAuthenticated: true,
                error: null
            })
            // -----------------------------------

            /* 
            // CÓDIGO REAL (Descomentar cuando el backend esté listo)
            const data = await AuthService.login(credentials)
            set({
                user: data.user,
                isAuthenticated: true,
                error: null
            })
            */
        } catch (error: any) {
            console.log('Login error fallback mock', error)
            // Incluso si falla algo, forzamos entrada para pruebas UI
            const mockUser = {
                id: '1',
                email: credentials.email,
                name: 'Usuario Demo Fallback',
                role: 'client'
            }
            set({
                user: mockUser as any,
                isAuthenticated: true,
                error: null
            })
        }
    },

    register: async (userData) => {
        try {
            set({ error: null })
            await AuthService.register(userData)
            set({ error: null })
        } catch (error: any) {
            const errorMessage = error.response?.data?.error?.message ||
                error.message ||
                'Error al registrarse'
            set({ error: errorMessage })
            throw error
        }
    },

    logout: async () => {
        try {
            // await AuthService.logout() // Mock logout
            set({
                user: null,
                isAuthenticated: false,
                error: null
            })
        } catch (error) {
            console.error('Logout error:', error)
            set({
                user: null,
                isAuthenticated: false
            })
        }
    },

    checkAuth: async () => {
        try {
            // Mock check auth
            set({
                user: null,
                isAuthenticated: false,
                isLoading: false
            })

            /*
            const isAuth = await AuthService.isAuthenticated()
            if (isAuth) {
                const user = await AuthService.getCurrentUser()
                set({
                    user,
                    isAuthenticated: true,
                    isLoading: false
                })
            } else {
                set({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false
                })
            }
            */
        } catch (error) {
            console.error('Check auth error:', error)
            set({
                user: null,
                isAuthenticated: false,
                isLoading: false
            })
        }
    },

    clearError: () => {
        set({ error: null })
    },
}))
