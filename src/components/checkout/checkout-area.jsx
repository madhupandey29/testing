'use client';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';
import { selectUserId } from '@/utils/userSelectors';

const CheckoutArea = () => {
  const userId = useSelector(selectUserId);
  const router = useRouter();
  
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [companyWhatsApp, setCompanyWhatsApp] = useState('919054508118'); // Default fallback
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    notes: ''
  });

  // Load user data from cookies immediately on mount
  useEffect(() => {
    try {
      const userInfoCookie = Cookies.get('userInfo');
      if (userInfoCookie) {
        const parsed = JSON.parse(userInfoCookie);
        const user = parsed?.user;
        
        if (user) {
          console.log('🍪 Loading initial data from cookie:', user);
          setFormData({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            phone: user.phone || '',
            company: user.organisation || '',
            address: user.address || '',
            city: user.city || '',
            state: user.state || '',
            zipCode: user.pincode || '',
            country: user.country || '',
            notes: ''
          });
        }
      }
    } catch (e) {
      console.warn('Failed to load cookie data:', e);
    }
  }, []);

  // Fetch user profile and cart items
  useEffect(() => {
    if (!userId) {
      console.log('❌ No userId found');
      setLoading(false);
      return;
    }
    
    console.log('🔍 Fetching data for userId:', userId);
    
    const fetchData = async () => {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://espobackend.vercel.app/api";
        console.log('🌐 API Base:', API_BASE);
        
        // Fetch company info to get WhatsApp number (same as FloatingButtons)
        try {
          const companyRes = await fetch(`${API_BASE}/companyinformation`, {
            method: "GET",
            credentials: "include",
            headers: { "Accept": "application/json" }
          });
          
          if (companyRes.ok) {
            const companyData = await companyRes.json();
            if (companyData.success && companyData.data && companyData.data.length > 0) {
              const companyFilter = process.env.NEXT_PUBLIC_COMPANY_FILTER;
              const targetCompany = companyFilter 
                ? companyData.data.find(company => company.name === companyFilter) || companyData.data[0]
                : companyData.data[0];
              
              const digitsOnly = (v) => String(v || "").replace(/[^\d]/g, "");
              const waDigits = digitsOnly(targetCompany?.whatsappNumber) || "919054508118";
              setCompanyWhatsApp(waDigits);
              console.log('📱 Company WhatsApp:', waDigits);
            }
          }
        } catch (e) {
          console.warn('Failed to fetch company WhatsApp, using default');
        }
        
        // Try to get user data from cookies first as fallback
        let userDataFromCookie = null;
        try {
          const userInfoCookie = Cookies.get('userInfo');
          if (userInfoCookie) {
            const parsed = JSON.parse(userInfoCookie);
            userDataFromCookie = parsed?.user;
            console.log('🍪 User data from cookie:', userDataFromCookie);
          }
        } catch (e) {
          console.warn('Failed to parse cookie:', e);
        }
        
        // Fetch user profile from API
        const profileUrl = `${API_BASE}/account/${encodeURIComponent(userId)}`;
        console.log('� Fetching profile from:', profileUrl);
        
        const profileRes = await fetch(profileUrl, {
          method: "GET",
          credentials: "include",
          headers: { "Accept": "application/json" }
        });
        
        console.log('📥 Profile response status:', profileRes.status);
        
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          console.log('✅ Profile data received:', profileData);
          
          const user = profileData?.data || profileData;
          console.log('👤 User object:', user);
          
          // Auto-fill form with user profile data
          const updatedFormData = {
            firstName: user.firstName || userDataFromCookie?.firstName || '',
            lastName: user.lastName || userDataFromCookie?.lastName || '',
            email: user.emailAddress || userDataFromCookie?.email || '',
            phone: user.phoneNumber || userDataFromCookie?.phone || '',
            company: user.organizationNameRaw || userDataFromCookie?.organisation || '',
            address: user.addressStreet || userDataFromCookie?.address || '',
            city: user.addressCity || userDataFromCookie?.city || '',
            state: user.addressState || userDataFromCookie?.state || '',
            zipCode: user.addressPostalCode || userDataFromCookie?.pincode || '',
            country: user.addressCountry || userDataFromCookie?.country || '',
            notes: ''
          };
          
          console.log('📝 Setting form data:', updatedFormData);
          setFormData(updatedFormData);
          
          // Check if any data was actually filled
          const hasData = Object.values(updatedFormData).some(val => val && val !== '');
          if (hasData) {
            toast.success('Profile data loaded successfully!');
          } else {
            toast.info('No profile data found. Please fill in your details.');
          }
        } else {
          console.warn('⚠️ Profile fetch failed with status:', profileRes.status);
          
          // Use cookie data as fallback
          if (userDataFromCookie) {
            const fallbackFormData = {
              firstName: userDataFromCookie.firstName || '',
              lastName: userDataFromCookie.lastName || '',
              email: userDataFromCookie.email || '',
              phone: userDataFromCookie.phone || '',
              company: userDataFromCookie.organisation || '',
              address: userDataFromCookie.address || '',
              city: userDataFromCookie.city || '',
              state: userDataFromCookie.state || '',
              zipCode: userDataFromCookie.pincode || '',
              country: userDataFromCookie.country || '',
              notes: ''
            };
            setFormData(fallbackFormData);
            toast.info('Using cached profile data');
          } else {
            toast.warning('Could not load profile data. Please fill in manually.');
          }
        }
        
        // Fetch items (cart or checkout)
        const itemsUrl = `${API_BASE}/wishlist/fieldname/customerAccountId/${encodeURIComponent(userId)}`;
        console.log('📡 Fetching items from:', itemsUrl);
        
        const itemsRes = await fetch(itemsUrl, {
          method: "GET",
          credentials: "include",
          headers: { "Accept": "application/json" }
        });
        
        console.log('📥 Items response status:', itemsRes.status);
        
        if (!itemsRes.ok) throw new Error('Failed to fetch items');
        
        const json = await itemsRes.json();
        console.log('🛒 Items data received:', json);
        
        const allItems = Array.isArray(json?.data) ? json.data : [];
        
        // Clean up any old checkout items first
        const oldCheckoutItems = allItems.filter(item => item.itemType === 'checkout');
        if (oldCheckoutItems.length > 0) {
          console.log(`🧹 Cleaning up ${oldCheckoutItems.length} old checkout items`);
          const cleanupPromises = oldCheckoutItems.map(item => 
            fetch(`${API_BASE}/wishlist/${item.id}`, {
              method: 'DELETE',
              credentials: 'include'
            }).catch(e => console.warn('Failed to delete old checkout item:', e))
          );
          await Promise.all(cleanupPromises);
        }
        
        // ALWAYS get current cart items (ignore old checkout items)
        const cartItems = allItems.filter(item => item.itemType === 'cart');
        console.log('🛒 Current cart items:', cartItems.length);
        
        if (cartItems.length === 0) {
          console.log('⚠️ No cart items found');
          setCartItems([]);
          setLoading(false);
          return;
        }
        
        // Move cart items to checkout (create new checkout items)
        const checkoutPromises = cartItems.map(async (item) => {
          // Get price from nested product object
          const productPrice = item.product?.price || item.product?.salesPrice || 0;
          const itemPrice = parseFloat(item.price) || productPrice || 0;
          const currency = item.product?.priceCurrency || item.priceCurrency || 'INR';
          
          try {
            // Create new checkout item
            const createResponse = await fetch(`${API_BASE}/wishlist`, {
              method: 'POST',
              credentials: 'include',
              headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify({
                customerAccountId: userId,
                productId: item.productId,
                itemType: 'checkout',
                qty: item.qty,
                price: itemPrice.toString(),
                priceCurrency: currency
              })
            });
            
            if (!createResponse.ok) {
              console.error('Failed to create checkout item:', createResponse.status);
              return null;
            }
            
            const newCheckoutItem = await createResponse.json();
            console.log('✅ Created checkout item:', item.productName);
            
            // Delete the cart item
            try {
              await fetch(`${API_BASE}/wishlist/${item.id}`, {
                method: 'DELETE',
                credentials: 'include'
              });
              console.log('✅ Deleted cart item:', item.id);
            } catch (deleteError) {
              console.warn('Failed to delete cart item:', deleteError);
            }
            
            // Return the item with product data for display
            return {
              ...newCheckoutItem.data || newCheckoutItem,
              product: item.product
            };
          } catch (e) {
            console.error('Failed to process item:', item.id, e);
            return null;
          }
        });
        
        const checkoutResults = await Promise.all(checkoutPromises);
        const checkoutItems = checkoutResults.filter(item => item !== null);
        
        console.log('✅ Checkout items ready:', checkoutItems.length);
        setCartItems(checkoutItems);
      } catch (error) {
        console.error('❌ Error fetching data:', error);
        toast.error('Failed to load checkout data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [userId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => {
      // Get price from nested product object if available
      const productPrice = item.product?.price || item.product?.salesPrice || 0;
      const itemPrice = parseFloat(item.price) || productPrice || 0;
      const qty = item.qty || 1;
      return sum + (itemPrice * qty);
    }, 0);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.address) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    
    // Check if any items have invalid prices
    const itemsWithoutPrice = cartItems.filter(item => {
      const productPrice = item.product?.price || item.product?.salesPrice || 0;
      const itemPrice = parseFloat(item.price) || productPrice || 0;
      return itemPrice <= 0;
    });
    
    if (itemsWithoutPrice.length > 0) {
      const itemNames = itemsWithoutPrice.map(item => item.productName).join(', ');
      toast.error(`The following items have no price set: ${itemNames}. Please remove them or contact support.`);
      return;
    }
    
    setSubmitting(true);
    
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://espobackend.vercel.app/api";
      
      // Generate order ID: YYYYMMDD-RANDOM (e.g., 20260221-A3F9K2)
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
      const orderId = `ORD-${year}${month}${day}-${randomPart}`;
      
      console.log('📦 Generated Order ID:', orderId);
      
      // Update checkout items to Ordered status
      const updatePromises = cartItems.map(async (item) => {
        const productPrice = item.product?.price || item.product?.salesPrice || 0;
        const itemPrice = parseFloat(item.price) || productPrice || 0;
        const currency = item.product?.priceCurrency || item.priceCurrency || 'INR';
        
        console.log(`📝 Updating item to Ordered: ${item.productName} (ID: ${item.id})`);
        console.log(`   ProductId: ${item.productId}, Price: ${itemPrice}, Currency: ${currency}, Qty: ${item.qty}`);
        
        try {
          // Update the existing checkout item to 'Ordered' status
          const updateResponse = await fetch(`${API_BASE}/wishlist/${item.id}`, {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
              customerAccountId: userId,
              productId: item.productId,
              itemType: 'Ordered'
            })
          });
          
          console.log(`📥 Response status:`, updateResponse.status);
          
          if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            console.error(`❌ Failed to update to Ordered:`, errorText);
            throw new Error(`Failed to update order status for ${item.productName}: ${updateResponse.status}`);
          }
          
          const updateResult = await updateResponse.json();
          console.log(`✅ Updated to Ordered:`, updateResult);
          
          return updateResult;
        } catch (error) {
          console.error(`❌ Error processing ${item.productName}:`, error);
          throw error;
        }
      });
      
      const updateResults = await Promise.all(updatePromises);
      console.log(`✅ Updated ${updateResults.length} items to Ordered status`);
      
      // Calculate total with correct prices
      const orderTotal = cartItems.reduce((sum, item) => {
        const productPrice = item.product?.price || item.product?.salesPrice || 0;
        const itemPrice = parseFloat(item.price) || productPrice || 0;
        const qty = item.qty || 1;
        return sum + (itemPrice * qty);
      }, 0);
      
      // Format date
      const formattedDate = now.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      // Build WhatsApp message
      let whatsappMessage = `🎉 *NEW ORDER FROM AMRITA GLOBAL ENTERPRISES* 🎉\n\n`;
      whatsappMessage += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      whatsappMessage += `📋 *ORDER DETAILS*\n`;
      whatsappMessage += `Order ID: *${orderId}*\n`;
      whatsappMessage += `Date: ${formattedDate}\n`;
      whatsappMessage += `Payment: Offline Payment\n\n`;
      
      whatsappMessage += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      whatsappMessage += `🛍️ *ORDER ITEMS*\n\n`;
      
      cartItems.forEach((item, index) => {
        const productPrice = item.product?.price || item.product?.salesPrice || 0;
        const itemPrice = parseFloat(item.price) || productPrice || 0;
        const currency = item.product?.priceCurrency || item.priceCurrency || 'INR';
        const lineTotal = itemPrice * (item.qty || 1);
        const unitOfMeasurement = item.product?.uM || item.uM || 'Kg';
        
        whatsappMessage += `${index + 1}. *${item.productName}*\n`;
        whatsappMessage += `   Quantity: ${item.qty} ${unitOfMeasurement}\n`;
        whatsappMessage += `   Price: ${currency} ${itemPrice.toFixed(2)}/${unitOfMeasurement}\n`;
        whatsappMessage += `   Total: ${currency} ${lineTotal.toFixed(2)}\n\n`;
      });
      
      whatsappMessage += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      whatsappMessage += `💰 *ORDER TOTAL: INR ${orderTotal.toFixed(2)}*\n\n`;
      
      whatsappMessage += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      whatsappMessage += `📦 *SHIPPING ADDRESS*\n\n`;
      whatsappMessage += `${formData.firstName} ${formData.lastName}\n`;
      if (formData.company) whatsappMessage += `${formData.company}\n`;
      whatsappMessage += `${formData.address}\n`;
      whatsappMessage += `${formData.city}${formData.state ? ', ' + formData.state : ''}${formData.zipCode ? ' - ' + formData.zipCode : ''}\n`;
      if (formData.country) whatsappMessage += `${formData.country}\n`;
      whatsappMessage += `\n📧 Email: ${formData.email}\n`;
      whatsappMessage += `📱 Phone: ${formData.phone}\n`;
      
      if (formData.notes) {
        whatsappMessage += `\n📝 *Special Instructions:*\n${formData.notes}\n`;
      }
      
      whatsappMessage += `\n━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      whatsappMessage += `✅ *WHAT'S NEXT?*\n\n`;
      whatsappMessage += `1️⃣ Our team will review your order\n`;
      whatsappMessage += `2️⃣ We'll contact you for payment details\n`;
      whatsappMessage += `3️⃣ Once payment is confirmed, we'll process your order\n`;
      whatsappMessage += `4️⃣ You'll receive shipping updates via email\n\n`;
      whatsappMessage += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      whatsappMessage += `Thank you for choosing *Amrita Global Enterprises*! 🙏\n`;
      whatsappMessage += `We look forward to serving you.\n\n`;
      whatsappMessage += `_This is an automated order notification_`;
      
      // Encode message for URL
      const encodedMessage = encodeURIComponent(whatsappMessage);
      
      // Use company WhatsApp number from API (same as floating button)
      const waDigits = companyWhatsApp;
      
      // Create WhatsApp URL using the exact same format as your website's WhatsApp button
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${waDigits}&text=${encodedMessage}`;
      
      // Store order data in sessionStorage for confirmation page
      const orderData = {
        orderId: orderId,
        customerAccountId: userId,
        items: cartItems.map(item => {
          const productPrice = item.product?.price || item.product?.salesPrice || 0;
          const itemPrice = parseFloat(item.price) || productPrice || 0;
          const currency = item.product?.priceCurrency || item.priceCurrency || 'INR';
          
          return {
            productId: item.productId,
            productName: item.productName,
            qty: item.qty,
            price: itemPrice,
            priceCurrency: currency
          };
        }),
        shippingAddress: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country
        },
        notes: formData.notes,
        total: orderTotal,
        status: 'pending',
        orderDate: now.toISOString()
      };
      
      sessionStorage.setItem('lastOrder', JSON.stringify(orderData));
      
      // Open WhatsApp in new tab
      window.open(whatsappUrl, '_blank');
      
      toast.success(`Order ${orderId} placed successfully! Opening WhatsApp...`);
      
      // Redirect to order confirmation page after a short delay
      setTimeout(() => {
        router.push('/order-confirmation');
      }, 1500);
      
    } catch (error) {
      console.error('❌ Error placing order:', error);
      toast.error(`Failed to place order: ${error.message || 'Please try again.'}`);
      
      // Log detailed error for debugging
      console.error('Order submission failed with details:', {
        userId,
        cartItemsCount: cartItems.length,
        error: error.stack
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!userId) {
    return (
      <section className="checkout-area pb-120">
        <div className="container">
          <div className="text-center pt-50">
            <h3>Please sign in to checkout</h3>
            <button
              type="button"
              className="btn-ghost-invert square mt-20"
              onClick={() => router.push('/login')}
            >
              Go to Login
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="checkout-area pb-120 pt-80">
        <div className="container">
          <div className="text-center">
            <div className="spinner"></div>
            <p className="mt-3">Loading checkout...</p>
          </div>
        </div>
      </section>
    );
  }

  if (cartItems.length === 0) {
    return (
      <>
        <section className="checkout-area pb-120 pt-80">
          <div className="container">
            <div className="empty-cart-state">
              <div className="empty-cart-icon">
                <svg viewBox="0 0 24 24" width="80" height="80" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="9" cy="21" r="1"/>
                  <circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
              </div>
              <h3>Your cart is empty</h3>
              <p>Add some items to your cart before checking out</p>
              <button
                type="button"
                onClick={() => router.push('/fabric')}
                className="btn-primary-modern"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                Continue Shopping
              </button>
            </div>
          </div>
        </section>

        <style jsx>{`
          .empty-cart-state {
            text-align: center;
            padding: 80px 40px;
            background: white;
            border-radius: 20px;
            box-shadow: 0 8px 30px rgba(0,0,0,0.08);
            max-width: 600px;
            margin: 0 auto;
          }

          .empty-cart-icon {
            width: 120px;
            height: 120px;
            margin: 0 auto 32px;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #6c757d;
            position: relative;
          }

          .empty-cart-icon::before {
            content: '';
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--tp-theme-primary) 0%, #1e3a8a 100%);
            opacity: 0.1;
            animation: pulse 2s ease-in-out infinite;
          }

          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
              opacity: 0.1;
            }
            50% {
              transform: scale(1.1);
              opacity: 0.15;
            }
          }

          .empty-cart-state h3 {
            font-size: 28px;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 16px;
          }

          .empty-cart-state p {
            color: #6c757d;
            margin-bottom: 32px;
            font-size: 16px;
            line-height: 1.6;
          }

          .btn-primary-modern {
            background: linear-gradient(135deg, var(--tp-theme-primary) 0%, #1e3a8a 100%);
            color: white;
            border: none;
            border-radius: 12px;
            padding: 16px 40px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(44, 76, 151, 0.3);
            display: inline-flex;
            align-items: center;
            gap: 10px;
          }

          .btn-primary-modern:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(44, 76, 151, 0.4);
          }

          .btn-primary-modern svg {
            transition: transform 0.3s ease;
          }

          .btn-primary-modern:hover svg {
            transform: translateX(-3px);
          }

          @media (max-width: 768px) {
            .empty-cart-state {
              padding: 60px 24px;
            }

            .empty-cart-icon {
              width: 100px;
              height: 100px;
            }

            .empty-cart-icon svg {
              width: 60px;
              height: 60px;
            }

            .empty-cart-state h3 {
              font-size: 24px;
            }

            .empty-cart-state p {
              font-size: 15px;
            }

            .btn-primary-modern {
              padding: 14px 32px;
              font-size: 15px;
            }
          }
        `}</style>
      </>
    );
  }

  const total = calculateTotal();

  return (
    <>
      <section className="checkout-area-modern">
        <div className="container-fluid px-4">
          <form onSubmit={handlePlaceOrder} className="checkout-form-modern">
            
            {/* Header */}
            <div className="checkout-header">
              <h2>Checkout</h2>
              <p>Complete your order in a few simple steps</p>
            </div>

            <div className="checkout-grid">
              
              {/* Left Column - Shipping Address */}
              <div className="shipping-section">
                <div className="section-header">
                  <h3>📦 Shipping Address</h3>
                </div>

                <div className="form-grid">
                  <div className="form-row-2">
                    <div className="form-field">
                      <label>First Name <span className="req">*</span></label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter first name"
                      />
                    </div>
                    
                    <div className="form-field">
                      <label>Last Name <span className="req">*</span></label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="form-field">
                      <label>Email <span className="req">*</span></label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="your@email.com"
                      />
                    </div>

                    <div className="form-field">
                      <label>Phone <span className="req">*</span></label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>

                  <div className="form-field">
                    <label>Company (Optional)</label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      placeholder="Company name"
                    />
                  </div>

                  <div className="form-field">
                    <label>Street Address <span className="req">*</span></label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      placeholder="House number and street name"
                    />
                  </div>

                  <div className="form-row-3">
                    <div className="form-field">
                      <label>City <span className="req">*</span></label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        placeholder="City"
                      />
                    </div>
                    
                    <div className="form-field">
                      <label>State</label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        placeholder="State"
                      />
                    </div>

                    <div className="form-field">
                      <label>ZIP Code</label>
                      <input
                        type="text"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        placeholder="ZIP"
                      />
                    </div>
                  </div>

                  <div className="form-field">
                    <label>Country</label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      placeholder="Country"
                    />
                  </div>

                  <div className="form-field">
                    <label>Order Notes (Optional)</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="Special instructions for delivery..."
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Right Column - Order Summary */}
              <div className="order-section">
                <div className="section-header">
                  <h3>🛍️ Your Order</h3>
                </div>

                <div className="order-items">
                  {cartItems.map((item, index) => {
                    // Get price from nested product object if available
                    const productPrice = item.product?.price || item.product?.salesPrice || 0;
                    const itemPrice = parseFloat(item.price) || productPrice || 0;
                    const currency = item.product?.priceCurrency || item.priceCurrency || 'USD';
                    const lineTotal = itemPrice * (item.qty || 1);
                    const hasNoPrice = itemPrice <= 0;
                    
                    return (
                      <div key={item.id || index} className={`order-item ${hasNoPrice ? 'no-price' : ''}`}>
                        <div className="item-info">
                          <span className="item-name">{item.productName}</span>
                          <span className="item-qty">Qty: {item.qty}</span>
                          {hasNoPrice && (
                            <span className="price-warning">⚠️ Price not available</span>
                          )}
                        </div>
                        <span className="item-price">
                          {hasNoPrice ? 'N/A' : `${currency} ${lineTotal.toFixed(2)}`}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="order-totals">
                  <div className="total-row">
                    <span>Subtotal</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <div className="total-row total-final">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="payment-notice">
                  <p>💳 Payment will be processed offline. Our team will contact you for payment details.</p>
                </div>

                <button
                  type="submit"
                  className="btn-checkout"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="btn-spinner"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      Place Order
                      <span className="btn-arrow">→</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </form>
        </div>
      </section>

      <style jsx>{`
        /* Modern Checkout Styles - Compact Version */
        .checkout-area-modern {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          min-height: 100vh;
          padding: 20px 0 40px;
        }

        .checkout-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .checkout-header h2 {
          font-size: 28px;
          font-weight: 800;
          color: #1a1a1a;
          margin-bottom: 4px;
        }

        .checkout-header p {
          color: #6c757d;
          font-size: 14px;
        }

        .checkout-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .shipping-section,
        .order-section {
          background: transparent;
        }

        .section-header {
          margin-bottom: 16px;
        }

        .section-header h3 {
          font-size: 18px;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0;
          padding-bottom: 8px;
          border-bottom: 3px solid var(--tp-theme-primary);
          display: inline-block;
        }

        /* Form Styles - Compact */
        .form-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .form-row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .form-row-3 {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 12px;
        }

        .form-field {
          display: flex;
          flex-direction: column;
        }

        .form-field label {
          font-size: 13px;
          font-weight: 600;
          color: #495057;
          margin-bottom: 4px;
        }

        .req {
          color: #dc3545;
          font-weight: 700;
        }

        .form-field input,
        .form-field textarea {
          padding: 10px 14px;
          border: 2px solid #dee2e6;
          border-radius: 8px;
          font-size: 14px;
          font-family: inherit;
          transition: all 0.2s ease;
          background: white;
        }

        .form-field input:focus,
        .form-field textarea:focus {
          outline: none;
          border-color: var(--tp-theme-primary);
          box-shadow: 0 0 0 3px rgba(44, 76, 151, 0.1);
        }

        .form-field textarea {
          resize: vertical;
          min-height: 60px;
        }

        /* Order Summary - Compact */
        .order-items {
          background: white;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          max-height: 300px;
          overflow-y: auto;
        }

        .order-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 12px 0;
          border-bottom: 1px solid #e9ecef;
        }

        .order-item.no-price {
          background: #fff3cd;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 8px;
        }

        .order-item:last-child {
          border-bottom: none;
        }

        .item-info {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .item-name {
          font-weight: 600;
          color: #1a1a1a;
          font-size: 14px;
        }

        .item-qty {
          font-size: 12px;
          color: #6c757d;
        }

        .price-warning {
          font-size: 11px;
          color: #856404;
          font-weight: 600;
        }

        .item-price {
          font-weight: 700;
          color: var(--tp-theme-primary);
          font-size: 15px;
        }

        .order-totals {
          background: white;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          font-size: 14px;
          color: #495057;
        }

        .total-final {
          border-top: 2px solid #e9ecef;
          margin-top: 6px;
          padding-top: 12px;
          font-size: 18px;
          font-weight: 700;
          color: #1a1a1a;
        }

        .total-final span:last-child {
          color: var(--tp-theme-primary);
        }

        .payment-notice {
          background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
          border-radius: 12px;
          padding: 12px;
          margin-bottom: 16px;
        }

        .payment-notice p {
          margin: 0;
          font-size: 13px;
          color: #856404;
          line-height: 1.5;
        }

        .btn-checkout {
          width: 100%;
          background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 16px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 4px 15px rgba(37, 211, 102, 0.3);
        }

        .btn-checkout:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(37, 211, 102, 0.4);
        }

        .btn-checkout:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .btn-arrow {
          font-size: 18px;
          transition: transform 0.3s ease;
        }

        .btn-checkout:hover .btn-arrow {
          transform: translateX(4px);
        }

        .btn-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .spinner {
          border: 4px solid #e9ecef;
          border-top: 4px solid var(--tp-theme-primary);
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }

        .empty-cart-state {
          text-align: center;
          padding: 80px 40px;
          background: white;
          border-radius: 20px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.08);
          max-width: 600px;
          margin: 0 auto;
        }

        .empty-cart-icon {
          width: 120px;
          height: 120px;
          margin: 0 auto 32px;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6c757d;
          position: relative;
        }

        .empty-cart-icon::before {
          content: '';
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--tp-theme-primary) 0%, #1e3a8a 100%);
          opacity: 0.1;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.15;
          }
        }

        .empty-cart-state h3 {
          font-size: 28px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 16px;
        }

        .empty-cart-state p {
          color: #6c757d;
          margin-bottom: 32px;
          font-size: 16px;
          line-height: 1.6;
        }

        .btn-primary-modern {
          background: linear-gradient(135deg, var(--tp-theme-primary) 0%, #1e3a8a 100%);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 16px 40px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(44, 76, 151, 0.3);
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }

        .btn-primary-modern:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(44, 76, 151, 0.4);
        }

        .btn-primary-modern svg {
          transition: transform 0.3s ease;
        }

        .btn-primary-modern:hover svg {
          transform: translateX(-3px);
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .checkout-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .form-row-3 {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 768px) {
          .checkout-header h2 {
            font-size: 24px;
          }

          .form-row-2,
          .form-row-3 {
            grid-template-columns: 1fr;
          }

          .section-header h3 {
            font-size: 16px;
          }

          .checkout-area-modern {
            padding: 16px 0 32px;
          }

          .order-items {
            max-height: 250px;
          }

          .empty-cart-state {
            padding: 60px 24px;
          }

          .empty-cart-icon {
            width: 100px;
            height: 100px;
          }

          .empty-cart-icon svg {
            width: 60px;
            height: 60px;
          }

          .empty-cart-state h3 {
            font-size: 24px;
          }

          .empty-cart-state p {
            font-size: 15px;
          }

          .btn-primary-modern {
            padding: 14px 32px;
            font-size: 15px;
          }
        }
      `}</style>
    </>
  );
};

export default CheckoutArea;
