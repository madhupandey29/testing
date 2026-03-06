'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const OrderConfirmationArea = () => {
  const router = useRouter();
  const [orderData, setOrderData] = useState(null);
  const [orderNumber, setOrderNumber] = useState('');

  useEffect(() => {
    // Get order data from sessionStorage
    const storedOrder = sessionStorage.getItem('lastOrder');
    
    if (storedOrder) {
      try {
        const order = JSON.parse(storedOrder);
        setOrderData(order);
        
        // Generate order number
        const orderNum = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        setOrderNumber(orderNum);
        
        // Clear the stored order
        sessionStorage.removeItem('lastOrder');
      } catch (error) {
        console.error('Error parsing order data:', error);
      }
    }
  }, []);

  if (!orderData) {
    return (
      <section className="order-confirmation-area pb-120 pt-80">
        <div className="container">
          <div className="no-order-state">
            <div className="icon-wrapper">
              <svg viewBox="0 0 24 24" width="80" height="80" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4"/>
                <path d="M12 16h.01"/>
              </svg>
            </div>
            <h3>No Order Found</h3>
            <p>We {`couldn't`} find any order information. Please try placing an order first.</p>
            <Link href="/fabric" className="btn-primary-modern">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              Continue Shopping
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const { shippingAddress, items, total, orderId: storedOrderId } = orderData;
  
  // Use stored orderId if available, otherwise use generated one
  const finalOrderId = storedOrderId || orderNumber;
  
  // Generate WhatsApp message
  const generateWhatsAppMessage = () => {
    const companyName = "AMRITA GLOBAL ENTERPRISES";
    const companyPhone = "+919054508118"; // Replace with actual company WhatsApp number
    
    let message = `🎉 *New Order from ${companyName}*\n\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `📋 *ORDER DETAILS*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `🔖 *Order ID:* ${finalOrderId}\n`;
    message += `📅 *Date:* ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\n`;
    message += `💰 *Total Amount:* $${total.toFixed(2)}\n\n`;
    
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `🛍️ *ORDER ITEMS*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    items.forEach((item, index) => {
      message += `${index + 1}. *${item.productName}*\n`;
      message += `   • Quantity: ${item.qty} Kg\n`;
      message += `   • Price: ${item.priceCurrency} ${parseFloat(item.price).toFixed(2)}/Kg\n`;
      message += `   • Subtotal: ${item.priceCurrency} ${(parseFloat(item.price) * item.qty).toFixed(2)}\n\n`;
    });
    
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `📦 *SHIPPING ADDRESS*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `👤 *Name:* ${shippingAddress.firstName} ${shippingAddress.lastName}\n`;
    if (shippingAddress.company) {
      message += `🏢 *Company:* ${shippingAddress.company}\n`;
    }
    message += `📍 *Address:* ${shippingAddress.address}\n`;
    message += `🏙️ *City:* ${shippingAddress.city}`;
    if (shippingAddress.state) message += `, ${shippingAddress.state}`;
    if (shippingAddress.zipCode) message += ` - ${shippingAddress.zipCode}`;
    message += `\n`;
    if (shippingAddress.country) {
      message += `🌍 *Country:* ${shippingAddress.country}\n`;
    }
    message += `📧 *Email:* ${shippingAddress.email}\n`;
    message += `📞 *Phone:* ${shippingAddress.phone}\n\n`;
    
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `✨ *WHAT'S NEXT?*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `✅ Our team will review your order\n`;
    message += `✅ We'll contact you for payment details\n`;
    message += `✅ Once payment is confirmed, we'll process your order\n`;
    message += `✅ You'll receive shipping updates via email\n\n`;
    
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `Thank you for choosing ${companyName}! 🙏\n`;
    message += `We look forward to serving you.\n\n`;
    message += `For any queries, contact us at:\n`;
    message += `📱 ${companyPhone}`;
    
    return encodeURIComponent(message);
  };
  
  const handleWhatsAppShare = () => {
    const message = generateWhatsAppMessage();
    const whatsappUrl = `https://wa.me/?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <>
      <section className="order-confirmation-area pb-120 pt-80">
        <div className="container">
          <div className="order-confirmation-wrapper">
            {/* Success Header */}
            <div className="success-header">
              <div className="success-icon">
                <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h1 className="success-title">Thank You for Your Order!</h1>
              <p className="success-message">
                Your order has been received and is being processed. {`We'll`} contact you shortly with payment details.
              </p>
            </div>

            {/* Order Details */}
            <div className="order-details-card">
              <div className="order-number-section">
                <div className="order-number-label">Order Number</div>
                <div className="order-number-value">{finalOrderId}</div>
              </div>

              <div className="order-info-grid">
                <div className="info-item">
                  <div className="info-label">Date</div>
                  <div className="info-value">{new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Total</div>
                  <div className="info-value">${total.toFixed(2)}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Payment Method</div>
                  <div className="info-value">Offline Payment</div>
                </div>
              </div>
            </div>

            <div className="row">
              {/* Order Items */}
              <div className="col-lg-8">
                <div className="order-items-card">
                  <h3 className="card-title">Order Items</h3>
                  
                  <div className="items-list">
                    {items.map((item, index) => (
                      <div key={index} className="order-item">
                        <div className="item-info">
                          <div className="item-name">{item.productName}</div>
                          <div className="item-meta">
                            Quantity: {item.qty} × {item.priceCurrency} {parseFloat(item.price).toFixed(2)}
                          </div>
                        </div>
                        <div className="item-total">
                          {item.priceCurrency} {(parseFloat(item.price) * item.qty).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="order-total-section">
                    <div className="total-row">
                      <span>Subtotal</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                    <div className="total-row grand-total">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="col-lg-4">
                <div className="shipping-address-card">
                  <h3 className="card-title">Shipping Address</h3>
                  
                  <div className="address-content">
                    <p className="address-name">
                      {shippingAddress.firstName} {shippingAddress.lastName}
                    </p>
                    {shippingAddress.company && (
                      <p className="address-company">{shippingAddress.company}</p>
                    )}
                    <p className="address-line">{shippingAddress.address}</p>
                    <p className="address-line">
                      {shippingAddress.city}
                      {shippingAddress.state && `, ${shippingAddress.state}`}
                      {shippingAddress.zipCode && ` ${shippingAddress.zipCode}`}
                    </p>
                    {shippingAddress.country && (
                      <p className="address-line">{shippingAddress.country}</p>
                    )}
                    <p className="address-contact">{shippingAddress.email}</p>
                    <p className="address-contact">{shippingAddress.phone}</p>
                  </div>
                </div>

                <div className="next-steps-card">
                  <h3 className="card-title">{`What's`} Next?</h3>
                  <ul className="steps-list">
                    <li>Our team will review your order</li>
                    <li>{`We'll`} contact you for payment details</li>
                    <li>Once payment is confirmed, {`we'll`} process your order</li>
                    <li>{`You'll`} receive shipping updates via email</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="btn-whatsapp"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                Share on WhatsApp
              </button>
              <button
                type="button"
                onClick={() => router.push('/fabric')}
                className="btn-continue-shopping"
              >
                Continue Shopping
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-print-order"
              >
                Print Order
              </button>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .order-confirmation-area {
          background: var(--tp-grey-1);
          min-height: calc(100vh - 200px);
        }

        .order-confirmation-wrapper {
          max-width: 1200px;
          margin: 0 auto;
        }

        .success-header {
          text-align: center;
          background: var(--tp-common-white);
          border-radius: 16px;
          padding: 48px 32px;
          margin-bottom: 32px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }

        .success-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 24px;
          background: #dcfce7;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #16a34a;
        }

        .success-title {
          font-size: 32px;
          font-weight: 700;
          color: var(--tp-text-1);
          margin-bottom: 12px;
        }

        .success-message {
          font-size: 16px;
          color: var(--tp-text-2);
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .order-details-card {
          background: var(--tp-common-white);
          border-radius: 16px;
          padding: 32px;
          margin-bottom: 32px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }

        .order-number-section {
          text-align: center;
          padding-bottom: 24px;
          margin-bottom: 24px;
          border-bottom: 2px solid var(--tp-grey-2);
        }

        .order-number-label {
          font-size: 14px;
          color: var(--tp-text-2);
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .order-number-value {
          font-size: 24px;
          font-weight: 700;
          color: var(--tp-theme-primary);
          font-family: monospace;
        }

        .order-info-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        .info-item {
          text-align: center;
        }

        .info-label {
          font-size: 13px;
          color: var(--tp-text-2);
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-value {
          font-size: 16px;
          font-weight: 600;
          color: var(--tp-text-1);
        }

        .order-items-card,
        .shipping-address-card,
        .next-steps-card {
          background: var(--tp-common-white);
          border-radius: 16px;
          padding: 32px;
          margin-bottom: 24px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }

        .card-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--tp-text-1);
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid var(--tp-grey-2);
        }

        .items-list {
          margin-bottom: 24px;
        }

        .order-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 16px 0;
          border-bottom: 1px solid var(--tp-grey-2);
        }

        .order-item:last-child {
          border-bottom: none;
        }

        .item-info {
          flex: 1;
        }

        .item-name {
          font-weight: 600;
          color: var(--tp-text-1);
          margin-bottom: 4px;
        }

        .item-meta {
          font-size: 14px;
          color: var(--tp-text-2);
        }

        .item-total {
          font-weight: 700;
          color: var(--tp-text-1);
          margin-left: 16px;
        }

        .order-total-section {
          padding-top: 16px;
          border-top: 2px solid var(--tp-grey-2);
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 15px;
          color: var(--tp-text-1);
        }

        .total-row.grand-total {
          font-size: 20px;
          font-weight: 700;
          padding-top: 16px;
          margin-top: 8px;
          border-top: 2px solid var(--tp-grey-2);
          color: var(--tp-theme-primary);
        }

        .address-content {
          line-height: 1.8;
        }

        .address-name {
          font-weight: 700;
          color: var(--tp-text-1);
          margin-bottom: 8px;
        }

        .address-company,
        .address-line,
        .address-contact {
          color: var(--tp-text-2);
          margin-bottom: 4px;
        }

        .address-contact {
          font-weight: 500;
        }

        .steps-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .steps-list li {
          padding: 12px 0 12px 32px;
          position: relative;
          color: var(--tp-text-2);
          line-height: 1.6;
        }

        .steps-list li:before {
          content: '✓';
          position: absolute;
          left: 0;
          top: 12px;
          width: 20px;
          height: 20px;
          background: var(--tp-theme-primary);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
        }

        .action-buttons {
          display: flex;
          gap: 16px;
          justify-content: center;
          margin-top: 32px;
          flex-wrap: wrap;
        }

        .btn-whatsapp,
        .btn-continue-shopping,
        .btn-print-order {
          padding: 16px 32px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          border: none;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }

        .btn-whatsapp {
          background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
          color: white;
          flex: 1;
          max-width: 300px;
          justify-content: center;
        }

        .btn-whatsapp:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(37, 211, 102, 0.4);
        }

        .btn-whatsapp svg {
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));
        }

        .btn-continue-shopping {
          background: var(--tp-theme-primary);
          color: var(--tp-common-white);
          flex: 1;
          max-width: 250px;
        }

        .btn-continue-shopping:hover {
          background: color-mix(in srgb, var(--tp-theme-primary) 90%, black);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(44, 76, 151, 0.3);
        }

        .btn-print-order {
          background: var(--tp-common-white);
          color: var(--tp-theme-primary);
          border: 2px solid var(--tp-theme-primary);
          flex: 1;
          max-width: 200px;
        }

        .btn-print-order:hover {
          background: var(--tp-grey-1);
          transform: translateY(-2px);
        }

        .no-order-state {
          text-align: center;
          padding: 80px 40px;
          background: var(--tp-common-white);
          border-radius: 20px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.08);
          max-width: 600px;
          margin: 0 auto;
        }

        .icon-wrapper {
          width: 120px;
          height: 120px;
          margin: 0 auto 32px;
          background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #f59e0b;
          position: relative;
        }

        .icon-wrapper::before {
          content: '';
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          opacity: 0.1;
          animation: pulse-warning 2s ease-in-out infinite;
        }

        @keyframes pulse-warning {
          0%, 100% {
            transform: scale(1);
            opacity: 0.1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.15;
          }
        }

        .no-order-state h3 {
          font-size: 28px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 16px;
        }

        .no-order-state p {
          color: #6c757d;
          margin-bottom: 32px;
          font-size: 16px;
          line-height: 1.6;
        }

        .btn-primary-modern {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: linear-gradient(135deg, var(--tp-theme-primary) 0%, #1e3a8a 100%);
          color: white;
          padding: 16px 40px;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(44, 76, 151, 0.3);
        }

        .btn-primary-modern:hover {
          background: color-mix(in srgb, var(--tp-theme-primary) 90%, black);
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(44, 76, 151, 0.4);
        }

        .btn-primary-modern svg {
          transition: transform 0.3s ease;
        }

        .btn-primary-modern:hover svg {
          transform: translateX(-3px);
        }

        @media print {
          .action-buttons {
            display: none;
          }
        }

        @media (max-width: 991px) {
          .order-info-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .success-header {
            padding: 32px 24px;
          }

          .success-title {
            font-size: 24px;
          }

          .order-details-card,
          .order-items-card,
          .shipping-address-card,
          .next-steps-card {
            padding: 24px;
          }

          .no-order-state {
            padding: 60px 32px;
          }
        }

        @media (max-width: 767px) {
          .action-buttons {
            flex-direction: column;
            align-items: stretch;
          }

          .btn-whatsapp,
          .btn-continue-shopping,
          .btn-print-order {
            width: 100%;
            max-width: none;
          }

          .order-item {
            flex-direction: column;
            gap: 8px;
          }

          .item-total {
            margin-left: 0;
            align-self: flex-end;
          }

          .no-order-state {
            padding: 60px 24px;
          }

          .icon-wrapper {
            width: 100px;
            height: 100px;
          }

          .icon-wrapper svg {
            width: 60px;
            height: 60px;
          }

          .no-order-state h3 {
            font-size: 24px;
          }

          .no-order-state p {
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

export default OrderConfirmationArea;
