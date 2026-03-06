'use client';

import React, { useState, useEffect, memo } from 'react';
import { FiPhoneCall } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import styles from './FloatingButtons.module.scss';

const FloatingButtons = memo(() => {
  const [office, setOffice] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Fetch office info for contact numbers with caching
  useEffect(() => {
    const fetchOfficeInfo = async () => {
      try {
        // Check cache first
        const cached = sessionStorage.getItem('office-info');
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          // Cache for 1 hour
          if (Date.now() - timestamp < 3600000) {
            setOffice(data);
            setIsLoaded(true);
            return;
          }
        }

        const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
        const response = await fetch(`${API_BASE}/companyinformation`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.data.length > 0) {
            const companyFilter = process.env.NEXT_PUBLIC_COMPANY_FILTER;
            
            const targetCompany = companyFilter 
              ? data.data.find(company => company.name === companyFilter) || data.data[0]
              : data.data[0];
            
            setOffice(targetCompany);
            
            // Cache the result
            sessionStorage.setItem('office-info', JSON.stringify({
              data: targetCompany,
              timestamp: Date.now()
            }));
          }
        }
      } catch (error) {
        // Silent fail
      } finally {
        setIsLoaded(true);
      }
    };

    // Delay loading to not block initial render
    const timer = setTimeout(fetchOfficeInfo, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Don't render until loaded to avoid layout shift
  if (!isLoaded) return null;

  // Helper function to extract digits only
  const digitsOnly = (v) => String(v || "").replace(/[^\d]/g, "");

  // WhatsApp + Call numbers from API (with fallbacks)
  const waDigits = digitsOnly(office?.whatsappNumber) || "919999999999";
  const phoneDigits = digitsOnly(office?.phone1) || digitsOnly(office?.phone2) || "919999999999";

  //const whatsappHref = `https://wa.me/${waDigits}`;
  const message = "Hello I am interested in your fabrics";

const whatsappHref = `https://api.whatsapp.com/send?phone=${waDigits}&text=${encodeURIComponent(message)}`;

  const callHref = `tel:+${phoneDigits}`;


  return (
    <>
      {/* WhatsApp button (left side) */}
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.whatsappBtn}
        aria-label="Chat on WhatsApp"
      >
        <FaWhatsapp size={26} />
      </a>

      {/* Call button (right side) */}
      <a 
        href={callHref} 
        aria-label="Call us" 
        className={styles.callBtn}
      >
        <FiPhoneCall size={24} />
      </a>
    </>
  );
});

FloatingButtons.displayName = 'FloatingButtons';

export default FloatingButtons;