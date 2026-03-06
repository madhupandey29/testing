'use client';

import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useAddContactMutation } from '@/redux/features/contactsApi';

const NewsletterSubscribeForm = ({ 
  placeholder = "Enter your email", 
  buttonText = "Subscribe",
  className = "",
  onSuccess 
}) => {
  const [email, setEmail] = useState("");
  const [addContact, { isLoading }] = useAddContactMutation();

  const isValidEmail = (email) => 
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      // Using the same structure as your contact form
      await addContact({
        salutationName: "",
        firstName: "Newsletter",
        lastName: "Subscriber", 
        middleName: "",
        emailAddress: trimmedEmail, // This maps to the email field in your API
        phoneNumber: "",
        accountName: "Newsletter Subscription",
        addressStreet: "",
        addressCity: "",
        addressState: "",
        addressCountry: "",
        addressPostalCode: "",
        opportunityAmountCurrency: "USD",
        opportunityAmount: null,
        cBusinessType: ["newsletter"],
        cFabricCategory: [],
        description: "Subscribed to newsletter from website footer",
      }).unwrap();

      setEmail("");
      toast.success("Successfully subscribed! 🎉");
      onSuccess?.();
    } catch (error) {
      const message = error?.data?.message || error?.message || "Subscription failed. Please try again.";
      toast.error(message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`newsletter-form ${className}`}>
      <div className="newsletter-input-group">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder}
          required
          disabled={isLoading}
          className="newsletter-input"
        />
        <button 
          type="submit" 
          disabled={isLoading}
          className="newsletter-button"
        >
          {isLoading ? "..." : buttonText}
        </button>
      </div>
      
      <style jsx>{`
        .newsletter-form {
          width: 100%;
        }
        
        .newsletter-input-group {
          display: flex;
          align-items: center;
          background: #fff;
          border: 1px solid rgba(0,0,0,.04);
          border-radius: 9999px;
          height: 52px;
          padding: 6px;
          box-shadow: 0 10px 26px rgba(0,0,0,.18);
        }
        
        .newsletter-input {
          flex: 1;
          height: 100%;
          background: transparent;
          border: none;
          color: #0b1220;
          padding: 0 18px;
          outline: none;
          font-size: 15px;
        }
        
        .newsletter-input::placeholder {
          color: #6b7280;
        }
        
        .newsletter-input:disabled {
          opacity: 0.7;
        }
        
        .newsletter-button {
          width: 40px;
          height: 40px;
          border-radius: 9999px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #D6A74B;
          color: #fff;
          box-shadow: 0 10px 22px rgba(214,167,75,.35);
          font-size: 24px;
          transition: all 0.2s ease;
        }
        
        .newsletter-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 12px 28px rgba(214,167,75,.45);
        }
        
        .newsletter-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }
      `}</style>
    </form>
  );
};

export default NewsletterSubscribeForm;