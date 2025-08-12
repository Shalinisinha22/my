import React, { createContext, useContext, useState, useEffect } from 'react';
import userService from '../services/userService';

const CustomerContext = createContext();

export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
};

export const CustomerProvider = ({ children }) => {
  // Initialize auth check ref to prevent multiple checks
  const authCheckComplete = React.useRef(false);
  const [customer, setCustomer] = useState(() => {
    const savedCustomer = localStorage.getItem('customer');
    return savedCustomer ? JSON.parse(savedCustomer) : null;
  });
  const [store, setStore] = useState(() => {
    const storeId = localStorage.getItem('storeId');
    const storeName = localStorage.getItem('storeName');
    return storeId && storeName ? { id: storeId, name: storeName } : null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if customer is logged in on app start
  useEffect(() => {
    const checkAuth = async (retryCount = 0) => {
      // Prevent multiple auth checks
      if (authCheckComplete.current) return;
      authCheckComplete.current = true;

      setLoading(true);
      const token = localStorage.getItem('token');
      const storeId = localStorage.getItem('storeId');
      const storeName = localStorage.getItem('storeName');
      const savedCustomer = localStorage.getItem('customer');

      if (token && storeId && storeName) {
        try {
          // Set initial state from localStorage if available
          if (savedCustomer) {
            const parsedCustomer = JSON.parse(savedCustomer);
            setCustomer(parsedCustomer);
            setStore({
              id: storeId,
              name: storeName
            });
          }

          // Verify with the server
          const customerData = await userService.getProfile();
          if (customerData) {
            setCustomer(customerData);
            localStorage.setItem('customer', JSON.stringify(customerData));
            setStore({
              id: storeId,
              name: storeName
            });
          } else {
            throw new Error('Invalid authentication');
          }
        } catch (err) {
          console.error('Auth check failed:', err);
          
          // Only clear auth data if it's a 401 Unauthorized error
          // This prevents logout on network errors or temporary server issues
          if (err.status === 401 || (err.message && (
            err.message.includes('401') || 
            err.message.includes('Unauthorized') || 
            err.message.includes('Invalid authentication') ||
            err.message.includes('Token expired')
          ))) {
            // Clear all auth data only on authentication errors
            localStorage.clear();
            setCustomer(null);
            setStore(null);
          } else {
            // For network errors, retry once after a short delay
            if (retryCount < 1 && (err.status === 0 || err.message.includes('Network error'))) {
              console.log('Network error during auth check, retrying...');
              setTimeout(() => {
                authCheckComplete.current = false;
                checkAuth(retryCount + 1);
              }, 1000);
              return;
            }
            
            // For other errors (server down, etc.), keep the user logged in
            // The existing localStorage data will remain
            console.log('Non-auth error during profile check, keeping user logged in:', err.message);
          }
        }
      } else {
        // Clear everything if any required auth item is missing
        localStorage.clear();
        setCustomer(null);
        setStore(null);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password, storeName) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await userService.login(email, password, storeName);
      
      setCustomer(response.customer);
      setStore(response.store);
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('storeId', response.store.id);
      localStorage.setItem('storeName', response.store.name);
      localStorage.setItem('customer', JSON.stringify(response.customer));
      
      return response;
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await userService.register(userData);
      
      setCustomer(response.customer);
      setStore(response.store);
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('storeId', response.store.id);
      localStorage.setItem('storeName', response.store.name);
      
      return response;
    } catch (err) {
      setError(err.message || 'Signup failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setCustomer(null);
    setStore(null);
    setError(null);
    
    localStorage.removeItem('token');
    localStorage.removeItem('storeId');
    localStorage.removeItem('storeName');
    localStorage.removeItem('customer');
  };

  const updateProfile = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await userService.updateProfile(userData);
      setCustomer(response.customer);
      
      return response;
    } catch (err) {
      setError(err.message || 'Profile update failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await userService.changePassword(currentPassword, newPassword);
      
      return response;
    } catch (err) {
      setError(err.message || 'Password change failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    customer,
    store,
    loading,
    error,
    login,
    signup,
    logout,
    updateProfile,
    changePassword,
    isAuthenticated: !!customer && !!store
  };

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  );
}; 