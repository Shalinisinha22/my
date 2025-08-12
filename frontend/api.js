// const BASE_API_URL = 'http://localhost:5000/api';
// const IMG_URL = 'http://localhost:5000/uploads/';
const BASE_API_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000/api' 
  : 'https://ewa-back.vercel.app/api';
const IMG_URL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:5000'
  : 'https://ewa-back.vercel.app';


const API = {
    endpoints: {
        products: `${BASE_API_URL}/products`,
        publicProducts: `${BASE_API_URL}/products/public`,
        publicProductsByCategory: `${BASE_API_URL}/products/public/category`,
        categories: `${BASE_API_URL}/categories`,
        publicCategories: `${BASE_API_URL}/categories/public`,
        stores: `${BASE_API_URL}/stores`,
        users: `${BASE_API_URL}/users`,
        orders: `${BASE_API_URL}/orders`,
        customerOrders: `${BASE_API_URL}/customer/auth/orders`,
        customerOrderCreate: `${BASE_API_URL}/customer/auth/orders`,
        customerOrderDetails: `${BASE_API_URL}/customer/auth/orders`,
        auth: `${BASE_API_URL}/auth`,
        customerAuth: `${BASE_API_URL}/customer/auth`
    },

    async request(endpoint, options = {}) {
        const token = localStorage.getItem('token');
        const storeId = localStorage.getItem('storeId');
        
        const defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        if (token) {
            defaultHeaders.Authorization = `Bearer ${token}`;
        }

        if (storeId) {
            defaultHeaders['X-Store-ID'] = storeId;
        }

        const config = {
            method: options.method || 'GET',
            headers: {
                ...defaultHeaders,
                ...options.headers
            },
            mode: 'cors'
        };

        // Add body for non-GET requests
        if (options.body && config.method !== 'GET') {
            config.body = options.body;
        }

        // Debug logging
        console.log('API Request:', {
            endpoint,
            method: config.method,
            headers: config.headers,
            hasToken: !!token,
            hasStoreId: !!storeId
        });

        try {
            const response = await fetch(endpoint, config);
            
            // Debug response
            console.log('API Response:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries())
            });

            const data = await response.json();

            if (!response.ok) {
                // Include status code in error message for better error handling
                const errorMessage = data.message || `HTTP ${response.status}: ${response.statusText}`;
                const error = new Error(errorMessage);
                error.status = response.status;
                throw error;
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            // If it's already an error with status, re-throw it
            if (error.status) {
                throw error;
            }
            // For network errors or other issues, create a generic error
            const networkError = new Error(error.message || 'Network error');
            networkError.status = 0; // 0 indicates network error
            throw networkError;
        }
    },

    getImageUrl(imagePath) {
        return imagePath ? `${IMG_URL}${imagePath}` : null;
    }
};

export default API;