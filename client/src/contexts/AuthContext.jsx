import { createContext, useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const api = useMemo(() => {
        const instance = axios.create({
            baseURL: 'http://localhost:5001/api',
        });

        // Add a request interceptor
        instance.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        return instance;
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchUser();
        } else {
            setLoading(false);
        }
    }, [api]);

    const fetchUser = async () => {
        try {
            const res = await api.get('/auth/me');
            setUser(res.data);
        } catch (error) {
            console.error('Error fetching user', error);
            localStorage.removeItem('token');
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const res = await api.post('/auth/login', { email, password });
            if (res.data.mfaRequired) {
                return { success: false, mfaRequired: true, userId: res.data._id };
            }
            localStorage.setItem('token', res.data.token);
            setUser(res.data);
            return { success: true };
        } catch (error) {
            let errorMsg = 'Login failed';
            let requiresVerification = false;

            if (error.response) {
                errorMsg = error.response.data.message || 'Login failed';
                requiresVerification = error.response.data.requiresVerification || false;
            } else if (error.request) {
                errorMsg = 'Cannot connect to server. Is the backend running?';
            }
            return { success: false, error: errorMsg, requiresVerification };
        }
    };

    const loginMFA = async (userId, token) => {
        try {
            const res = await api.post('/auth/login-mfa', { userId, token });
            localStorage.setItem('token', res.data.token);
            setUser(res.data);
            return { success: true };
        } catch (error) {
            return { 
                success: false, 
                error: error.response?.data?.message || 'Invalid 2FA code' 
            };
        }
    };

    const signup = async (name, email, password) => {
        try {
            const res = await api.post('/auth/register', { name, email, password });
            // Don't log in yet, need verification
            return { success: true, message: res.data.message };
        } catch (error) {
            let errorMsg = 'Registration failed';
            if (error.response) {
                errorMsg = error.response.data.message || 'Registration failed';
            } else if (error.request) {
                errorMsg = 'Cannot connect to server';
            }
            return { success: false, error: errorMsg };
        }
    };

    const verifyEmail = async (email, otp) => {
        try {
            const res = await api.post('/auth/verify', { email, otp });
            localStorage.setItem('token', res.data.token);
            setUser(res.data);
            return { success: true };
        } catch (error) {
            return { 
                success: false, 
                error: error.response?.data?.message || 'Verification failed' 
            };
        }
    };

    const resendOTP = async (email) => {
        try {
            const res = await api.post('/auth/resend-otp', { email });
            return { success: true, message: res.data.message };
        } catch (error) {
            return { 
                success: false, 
                error: error.response?.data?.message || 'Failed to resend code' 
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, loginMFA, signup, logout, verifyEmail, resendOTP, api }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
