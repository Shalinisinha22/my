import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { addToCart, decreaseCart, removeFromCart, getTotals } from '../../redux/cartSlice';
import { useCustomer } from '../../context/CustomerContext';

const CartScreen = () => {
    const cart = useSelector((state) => state.cart);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { customer, isAuthenticated } = useCustomer();

    useEffect(() => {
        dispatch(getTotals());
    }, [cart, dispatch]);

    const handleRemoveFromCart = (product) => {
        dispatch(removeFromCart(product));
    };

    const handleDecreaseCart = (product) => {
        dispatch(decreaseCart(product));
    };

    const handleIncreaseCart = (product) => {
        dispatch(addToCart(product));
    };

    const handleProceedToCheckout = () => {
        if (!isAuthenticated) {
            // Redirect to login with return path
            navigate('/login', { state: { from: '/cart' } });
            return;
        }
        
        if (cart.cartItems.length === 0) {
            return;
        }
        
        navigate('/checkout');
    };

    return (
        <div className="cart-container">
            <h2 className="text-2xl font-bold mb-8 text-gray-800">Shopping Cart</h2>
            {cart.cartItems.length === 0 ? (
                <div className="cart-empty">
                    <p>Your cart is currently empty</p>
                    <div className="start-shopping">
                        <Link to="/" className="flex items-center justify-center gap-2">
                            <i className="ri-arrow-left-line"></i>
                            <span>Start Shopping</span>
                        </Link>
                    </div>
                </div>
            ) : (
                <div>
                    <div className="cart-items">
                        {cart.cartItems?.map((cartItem) => (
                            <div className="cart-item" key={cartItem._id}>
                                <div className="cart-product">
                                    <img src={cartItem.image} alt={cartItem.name} />
                                    <div>
                                        <h3>{cartItem.name}</h3>
                                        <p>${cartItem.price}</p>
                                        <button onClick={() => handleRemoveFromCart(cartItem)}>
                                            Remove
                                        </button>
                                    </div>
                                </div>
                                <div className="cart-product-quantity">
                                    <button onClick={() => handleDecreaseCart(cartItem)}>-</button>
                                    <div className="count">{cartItem.cartQuantity}</div>
                                    <button onClick={() => handleIncreaseCart(cartItem)}>+</button>
                                </div>
                                <div className="cart-product-total-price">
                                    ${cartItem.price * cartItem.cartQuantity}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="cart-summary">
                        <div className="cart-checkout">
                            <div className="subtotal">
                                <span>Subtotal ({cart.cartTotalQuantity} items)</span>
                                <span className="text-primary">${cart.cartTotalAmount.toFixed(2)}</span>
                            </div>
                            <button 
                                className="checkout-button"
                                onClick={handleProceedToCheckout}
                                disabled={cart.cartItems.length === 0}
                            >
                                {!isAuthenticated ? 'Login to Checkout' : 'Proceed to Checkout'}
                            </button>
                            <div className="continue-shopping">
                                <Link to="/">
                                    <i className="ri-arrow-left-line"></i>
                                    <span>Continue Shopping</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CartScreen;