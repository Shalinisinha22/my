import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useCustomer } from '../../context/CustomerContext';
import { clearCart } from '../../redux/cartSlice';
import API from '../../../api';
import toast from 'react-hot-toast';

const CheckoutPage = () => {
    const cart = useSelector((state) => state.cart);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { customer, updateProfile } = useCustomer();
    
    const [loading, setLoading] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [newAddress, setNewAddress] = useState({
        firstName: customer?.firstName || '',
        lastName: customer?.lastName || '',
        line1: '',
        city: '',
        state: '',
        country: '',
        zipCode: '',
        phone: customer?.phone || ''
    });

    useEffect(() => {
        if (!customer) {
            navigate('/login', { state: { from: '/checkout' } });
            return;
        }
        
        if (cart.cartItems.length === 0) {
            navigate('/cart');
            return;
        }
        
        // Debug: Log customer data
        console.log('Customer data in checkout:', customer);
        console.log('Customer addresses:', customer.addresses);
        
        // Set default address if available
        if (customer.addresses && customer.addresses.length > 0) {
            const defaultAddress = customer.addresses.find(addr => addr.isDefault);
            setSelectedAddress(defaultAddress || customer.addresses[0]);
        }
    }, [customer, cart.cartItems.length, navigate]);

    const handleAddAddress = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const updatedAddresses = [...(customer.addresses || []), newAddress];
            const response = await updateProfile({
                addresses: updatedAddresses
            });
            
            // Set the new address as selected
            setSelectedAddress(newAddress);
            setShowAddressForm(false);
            setNewAddress({
                firstName: customer?.firstName || '',
                lastName: customer?.lastName || '',
                line1: '',
                city: '',
                state: '',
                country: '',
                zipCode: '',
                phone: customer?.phone || ''
            });
            
            toast.success('Address added successfully!');
            
        } catch (error) {
            toast.error('Failed to add address');
            console.error('Error adding address:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrder = async () => {
        if (!selectedAddress) {
            toast.error('Please select a shipping address');
            return;
        }
        
        setLoading(true);
        
        try {
            const orderData = {
                items: cart.cartItems.map(item => ({
                    product: item._id,
                    name: item.name,
                    image: item.image,
                    price: item.price,
                    quantity: item.cartQuantity
                })),
                billing: {
                    firstName: selectedAddress.firstName,
                    lastName: selectedAddress.lastName,
                    email: customer.email,
                    phone: selectedAddress.phone,
                    address: {
                        line1: selectedAddress.line1,
                        city: selectedAddress.city,
                        state: selectedAddress.state,
                        country: selectedAddress.country,
                        zipCode: selectedAddress.zipCode
                    }
                },
                shipping: {
                    firstName: selectedAddress.firstName,
                    lastName: selectedAddress.lastName,
                    address: {
                        line1: selectedAddress.line1,
                        city: selectedAddress.city,
                        state: selectedAddress.state,
                        country: selectedAddress.country,
                        zipCode: selectedAddress.zipCode
                    },
                    method: 'standard',
                    cost: 0
                },
                payment: {
                    method: 'cod',
                    status: 'pending',
                    amount: cart.cartTotalAmount
                },
                pricing: {
                    subtotal: cart.cartTotalAmount,
                    tax: 0,
                    shipping: 0,
                    discount: 0,
                    total: cart.cartTotalAmount
                },
                status: 'pending'
            };

            const response = await API.request(API.endpoints.customerOrderCreate, {
                method: 'POST',
                body: JSON.stringify(orderData)
            });

            dispatch(clearCart());
            toast.success('Order placed successfully!');
            navigate(`/order-confirmation/${response._id}`);
            
        } catch (error) {
            toast.error('Failed to create order');
            console.error('Error creating order:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <h1 className="text-3xl font-bold mb-8">Checkout</h1>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Address Selection */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
                        
                        {customer?.addresses && customer.addresses.length > 0 ? (
                            <div className="space-y-3">
                                {customer.addresses.map((address, index) => (
                                    <div
                                        key={index}
                                        className={`border p-4 rounded cursor-pointer ${
                                            selectedAddress === address ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                                        }`}
                                        onClick={() => setSelectedAddress(address)}
                                    >
                                        <p className="font-medium">{address.firstName} {address.lastName}</p>
                                        <p className="text-sm text-gray-600">{address.line1}</p>
                                        <p className="text-sm text-gray-600">
                                            {address.city}, {address.state} {address.zipCode}
                                        </p>
                                        <p className="text-sm text-gray-600">{address.country}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-600 mb-4">No saved addresses</p>
                        )}
                        
                        <button
                            onClick={() => setShowAddressForm(!showAddressForm)}
                            className="btn btn-outline mt-4"
                        >
                            {showAddressForm ? 'Cancel' : 'Add New Address'}
                        </button>

                        {showAddressForm && (
                            <form onSubmit={handleAddAddress} className="mt-4 p-4 border border-gray-200 rounded-lg">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                        <input
                                            type="text"
                                            value={newAddress.firstName}
                                            onChange={(e) => setNewAddress({...newAddress, firstName: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                        <input
                                            type="text"
                                            value={newAddress.lastName}
                                            onChange={(e) => setNewAddress({...newAddress, lastName: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                            required
                                        />
                                    </div>
                                </div>
                                
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                    <input
                                        type="text"
                                        value={newAddress.line1}
                                        onChange={(e) => setNewAddress({...newAddress, line1: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        required
                                    />
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                        <input
                                            type="text"
                                            value={newAddress.city}
                                            onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                        <input
                                            type="text"
                                            value={newAddress.state}
                                            onChange={(e) => setNewAddress({...newAddress, state: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                                        <input
                                            type="text"
                                            value={newAddress.zipCode}
                                            onChange={(e) => setNewAddress({...newAddress, zipCode: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                            required
                                        />
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                        <input
                                            type="text"
                                            value={newAddress.country}
                                            onChange={(e) => setNewAddress({...newAddress, country: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                        <input
                                            type="tel"
                                            value={newAddress.phone}
                                            onChange={(e) => setNewAddress({...newAddress, phone: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                            required
                                        />
                                    </div>
                                </div>
                                
                                <div className="flex gap-3 mt-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
                                    >
                                        {loading ? 'Adding...' : 'Add Address'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddressForm(false)}
                                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Order Summary */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                        
                        <div className="space-y-4">
                            {cart.cartItems.map((item) => (
                                <div key={item._id} className="flex justify-between">
                                    <div>
                                        <p className="font-medium">{item.name}</p>
                                        <p className="text-sm text-gray-600">Qty: {item.cartQuantity}</p>
                                    </div>
                                    <p className="font-medium">
                                        ${(item.price * item.cartQuantity).toFixed(2)}
                                    </p>
                                </div>
                            ))}
                        </div>
                        
                        <div className="border-t mt-4 pt-4">
                            <div className="flex justify-between font-semibold text-lg">
                                <span>Total</span>
                                <span>${cart.cartTotalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                        
                        <button
                            onClick={handleCreateOrder}
                            disabled={loading || !selectedAddress}
                            className="w-full btn btn-primary mt-6"
                        >
                            {loading ? 'Creating Order...' : 'Place Order'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
