'use client';

import React, { useState, useRef } from 'react';

const DEFAULT_STORAGE_KEY = 'fabricpro_contact_form';

function mapToBackend(f) {
  // More robust phone number cleaning and formatting
  let formattedPhone = '';
  if (f.phone && f.phone.trim()) {
    // Remove all non-digit characters except +
    let cleanPhone = f.phone.replace(/[^\d+]/g, '');
    
    // Handle different phone formats
    if (cleanPhone.length >= 7) {
      // If it doesn't start with +, add country code
      if (!cleanPhone.startsWith('+')) {
        // Default to +1 for US/Canada, adjust as needed
        cleanPhone = '+1' + cleanPhone;
      }
      formattedPhone = cleanPhone;
    }
  }

  return {
    salutationName: f.salutation || '',
    firstName: f.firstName?.trim() || '',
    lastName: f.lastName?.trim() || '',
    middleName: f.middleName?.trim() || '',
    emailAddress: f.email?.trim().toLowerCase() || '',
    phoneNumber: formattedPhone,
    accountName: f.companyName?.trim() || '',
    addressStreet: f.addressStreet?.trim() || '',
    addressCity: f.addressCity?.trim() || '',
    addressState: f.addressState?.trim() || '',
    addressCountry: f.addressCountry?.trim() || '',
    addressPostalCode: f.addressPostalCode?.trim() || '',
    opportunityAmountCurrency: f.opportunityAmountCurrency || 'USD',
    opportunityAmount: f.opportunityAmount ? parseFloat(f.opportunityAmount) : null,
    cBusinessType: f.businessType ? [f.businessType] : [],
    cFabricCategory: f.fabricCategory ? [f.fabricCategory] : [],
    description: f.description?.trim() || '',
  };
}

const EMPTY = {
  salutation: '',
  firstName: '',
  lastName: '',
  middleName: '',
  email: '',
  phone: '',
  companyName: '',
  addressStreet: '',
  addressCity: '',
  addressState: '',
  addressCountry: '',
  addressPostalCode: '',
  opportunityAmountCurrency: 'USD',
  opportunityAmount: '',
  businessType: '',
  fabricCategory: '',
  description: '',
};

export default function ContactForm({ onSuccess, storageKey = DEFAULT_STORAGE_KEY }) {
  // Initial load
  const initialSnapshot = (() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const [formData, setFormData] = useState(() => ({
    ...EMPTY,
    ...(initialSnapshot?.formData ?? {}),
  }));
  const [currentStep, setCurrentStep] = useState(() => {
    const s = Number(initialSnapshot?.currentStep);
    return s >= 1 && s <= 3 ? s : 1;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [shake, setShake] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const honeypotRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value }));
    
    // Clear validation errors when user starts typing
    if (validationErrors[name] || validationErrors.contact) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        // Clear contact error if user provides email or phone
        if ((name === 'email' || name === 'phone') && value.trim()) {
          delete newErrors.contact;
        }
        return newErrors;
      });
    }
    
    // Save to localStorage
    const updatedFormData = { ...formData, [name]: value };
    localStorage.setItem(storageKey, JSON.stringify({
      formData: updatedFormData,
      currentStep,
    }));
  };

  // Validation functions
  const validateStep1 = () => {
    const errors = {};
    
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    
    // Require either email or phone
    if (!formData.email && !formData.phone) {
      errors.contact = 'Please provide either an email address or phone number';
    }
    
    // Basic email validation if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Basic phone validation if provided - more lenient
    if (formData.phone && formData.phone.trim()) {
      const cleanPhone = formData.phone.replace(/[\s\-()\\+]/g, '');
      if (!/^\d{7,15}$/.test(cleanPhone)) {
        errors.phone = 'Please enter a valid phone number (7-15 digits)';
      } else if (cleanPhone.length < 10) {
        errors.phone = 'Phone number should be at least 10 digits';
      }
    }
    
    return errors;
  };

  const goNext = () => {
    if (currentStep === 1) {
      const errors = validateStep1();
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }
      setValidationErrors({});
    }
    setCurrentStep((s) => Math.min(3, s + 1));
  };
  
  const goBack = () => {
    setValidationErrors({});
    setCurrentStep((s) => Math.max(1, s - 1));
  };
  
  const goToStep = (step) => {
    if (step < 1 || step > 3) return;
    if (step > currentStep && currentStep === 1) {
      // Validate step 1 before allowing navigation
      const errors = validateStep1();
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }
    }
    setValidationErrors({});
    setCurrentStep(step);
  };

  const resetAll = () => {
    localStorage.removeItem(storageKey);
    setFormData({ ...EMPTY });
    setCurrentStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (honeypotRef.current?.value) {
      alert('Spam detected');
      return;
    }

    // Final validation
    const errors = validateStep1();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Submit to the new EspoCRM API endpoint (full URL)
      const payload = mapToBackend(formData);
      
      // Debug logging - remove in production
      console.log('Form data being sent:', payload);
      console.log('Original form data:', formData);
      
      const apiUrl = 'https://espo.egport.com/api/v1/LeadCapture/a4624c9bb58b8b755e3d94f1a25fc9be';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': navigator.userAgent || 'Unknown',
        },
        body: JSON.stringify(payload),
        mode: 'cors',
        credentials: 'omit'
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        
        // Handle specific validation errors
        if (response.status === 400 && errorData?.messageTranslation?.data?.field) {
          const field = errorData.messageTranslation.data.field;
          const fieldMap = {
            'phoneNumber': 'phone',
            'emailAddress': 'email',
            'firstName': 'firstName',
            'lastName': 'lastName'
          };
          
          console.error('Field validation error:', field, errorData);
          
          if (fieldMap[field]) {
            setValidationErrors({
              [fieldMap[field]]: `Please check your ${fieldMap[field].replace(/([A-Z])/g, ' $1').toLowerCase()}`
            });
            setShake(true);
            setTimeout(() => setShake(false), 500);
            return;
          }
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Success response:', result);
      
      resetAll();
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onSuccess?.();
      }, 2000);
    } catch (err) {
      console.error('Full error details:', err);
      console.error('Error stack:', err.stack);
      
      // Show user-friendly error message
      let errorMessage = 'Failed to submit form. Please try again.';
      
      if (err?.message?.includes('404')) {
        errorMessage = 'Submission endpoint not found. Please contact support.';
      } else if (err?.message?.includes('500')) {
        errorMessage = 'Server error. Please try again later.';
      } else if (err?.message?.includes('CORS') || err?.message?.includes('fetch') || err?.message?.includes('NetworkError')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (err?.message?.includes('400')) {
        errorMessage = 'Please check your information and try again.';
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Inline styles for compact design
  const progressBarStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
    position: 'relative',
    padding: '0 20px'
  };

  const circleStyle = {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: '#FFFFFF',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: '#E6ECF2',
    color: '#475569',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 2,
    fontWeight: '600',
    fontSize: '12px',
    transition: 'all .3s ease',
    position: 'relative'
  };

  const activeCircleStyle = {
    ...circleStyle,
    background: '#2C4C97',
    borderColor: '#2C4C97',
    color: '#fff',
    transform: 'scale(1.1)',
    boxShadow: '0 4px 12px rgba(44,76,151,.3)'
  };

  const lineStyle = {
    position: 'absolute',
    top: '50%',
    left: '20%',
    right: '20%',
    height: '2px',
    background: '#E6ECF2',
    transform: 'translateY(-50%)',
    zIndex: 1,
    borderRadius: '2px'
  };

  const stepLabelStyle = {
    fontSize: '12px',
    color: '#475569',
    marginBottom: '16px',
    textAlign: 'center',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  const stepContentStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  };

  const inputGroupStyle = {
    display: 'flex',
    flexDirection: 'column'
  };

  const labelStyle = {
    fontSize: '12px',
    fontWeight: '600',
    color: '#0F2235',
    marginBottom: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.3px'
  };

  const inputStyle = {
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#E6ECF2',
    borderRadius: '6px',
    padding: '10px 12px',
    fontSize: '14px',
    color: '#0F2235',
    background: '#FFFFFF',
    transition: 'all .3s ease',
    fontFamily: 'inherit'
  };

  const inputErrorStyle = {
    ...inputStyle,
    borderColor: '#dc2626',
    boxShadow: '0 0 0 3px rgba(220,38,38,.1)'
  };

  const errorTextStyle = {
    color: '#dc2626',
    fontSize: '12px',
    marginTop: '4px',
    fontWeight: '500'
  };

  const validationMessageStyle = {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    padding: '8px 12px',
    color: '#dc2626',
    fontSize: '12px',
    marginBottom: '12px',
    fontWeight: '500'
  };

  const inputFocusStyle = {
    ...inputStyle,
    borderColor: '#2C4C97',
    boxShadow: '0 0 0 3px rgba(44,76,151,.1)',
    outline: 'none'
  };

  const textareaStyle = {
    ...inputStyle,
    resize: 'vertical',
    minHeight: '70px'
  };

  const pillGroupStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginTop: '6px'
  };

  const pillStyle = {
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#E6ECF2',
    borderRadius: '16px',
    padding: '6px 12px',
    background: '#FFFFFF',
    color: '#0F2235',
    cursor: 'pointer',
    transition: 'all .3s ease',
    fontWeight: '500',
    fontSize: '12px'
  };

  const activePillStyle = {
    ...pillStyle,
    background: '#2C4C97',
    color: '#fff',
    borderColor: '#2C4C97',
    transform: 'translateY(-1px)',
    boxShadow: '0 2px 8px rgba(44,76,151,.3)'
  };

  const actionsStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '10px',
    marginTop: '20px'
  };

  const btnStyle = {
    padding: '10px 20px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'transparent',
    transition: 'all .3s ease',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    minWidth: '90px'
  };

  const primaryBtnStyle = {
    ...btnStyle,
    background: '#2C4C97',
    color: '#fff',
    borderColor: '#2C4C97'
  };

  const ghostBtnStyle = {
    ...btnStyle,
    background: 'transparent',
    color: '#0F2235',
    borderColor: '#E6ECF2'
  };

  if (showSuccess) {
    return (
      <div style={{width: '100%'}}>
        <div style={{
          textAlign: 'center',
          padding: '40px 24px',
          background: '#FFFFFF',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: '#E6ECF2',
          borderRadius: '12px',
          boxShadow: '0 10px 24px rgba(15,34,53,.08)'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            background: '#10b981',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: 'white',
            fontSize: '24px',
            fontWeight: 'bold'
          }}>✓</div>
          <h3 style={{color: '#0F2235', fontSize: '20px', fontWeight: '700', margin: '0 0 6px'}}>Request Submitted</h3>
          <p style={{color: '#475569', margin: '0', fontSize: '14px'}}>Thank you! {`We'll`} contact you soon.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{width: '100%'}}>
      <style>{`
        @keyframes shake {
          10%, 90% { transform: translateX(-2px); }
          20%, 80% { transform: translateX(4px); }
          30%, 50%, 70% { transform: translateX(-6px); }
          40%, 60% { transform: translateX(6px); }
        }
      `}</style>
      <div style={{background: 'transparent', borderWidth: '0', borderStyle: 'none', borderColor: 'transparent', borderRadius: '0', maxWidth: '100%', width: '100%', padding: '0', boxShadow: 'none'}}>
        <div style={progressBarStyle}>
          <div style={currentStep >= 1 ? activeCircleStyle : circleStyle} onClick={() => goToStep(1)}>1</div>
          <div style={lineStyle}></div>
          <div style={currentStep >= 2 ? activeCircleStyle : circleStyle} onClick={() => goToStep(2)}>2</div>
          <div style={lineStyle}></div>
          <div style={currentStep >= 3 ? activeCircleStyle : circleStyle} onClick={() => goToStep(3)}>3</div>
        </div>
        <div style={stepLabelStyle}>Step {currentStep} of 3</div>
        <form onSubmit={handleSubmit} noValidate style={shake ? {animation: 'shake 0.5s ease-in-out'} : {}}>
          <div style={{ visibility: 'hidden', height: 0 }}>
            <input ref={honeypotRef} name="hp" type="text" autoComplete="off" />
          </div>

          {currentStep === 1 && (
            <div style={stepContentStyle}>
              {validationErrors.contact && (
                <div style={validationMessageStyle}>
                  {validationErrors.contact}
                </div>
              )}
              
              <InputSelect
                label="Salutation"
                name="salutation"
                value={formData.salutation}
                onChange={handleInputChange}
                options={[
                  ['', 'Select salutation'],
                  ['Mr.', 'Mr.'],
                  ['Ms.', 'Ms.'],
                  ['Mrs.', 'Mrs.'],
                  ['Dr.', 'Dr.'],
                ]}
                inputStyle={inputStyle}
                labelStyle={labelStyle}
                inputGroupStyle={inputGroupStyle}
              />
              <InputField
                label="First Name *"
                name="firstName"
                placeholder="Your first name"
                value={formData.firstName}
                onChange={handleInputChange}
                inputStyle={validationErrors.firstName ? inputErrorStyle : inputStyle}
                labelStyle={labelStyle}
                inputGroupStyle={inputGroupStyle}
                error={validationErrors.firstName}
                errorTextStyle={errorTextStyle}
              />
              <InputField
                label="Last Name *"
                name="lastName"
                placeholder="Your last name"
                value={formData.lastName}
                onChange={handleInputChange}
                inputStyle={validationErrors.lastName ? inputErrorStyle : inputStyle}
                labelStyle={labelStyle}
                inputGroupStyle={inputGroupStyle}
                error={validationErrors.lastName}
                errorTextStyle={errorTextStyle}
              />
              <InputField
                label="Middle Name"
                name="middleName"
                placeholder="Your middle name (optional)"
                value={formData.middleName}
                onChange={handleInputChange}
                inputStyle={inputStyle}
                labelStyle={labelStyle}
                inputGroupStyle={inputGroupStyle}
              />
              <InputField
                label="Email Address *"
                name="email"
                type="email"
                placeholder="your@company.com"
                value={formData.email}
                onChange={handleInputChange}
                inputStyle={validationErrors.email ? inputErrorStyle : inputStyle}
                labelStyle={labelStyle}
                inputGroupStyle={inputGroupStyle}
                error={validationErrors.email}
                errorTextStyle={errorTextStyle}
              />
              <InputField
                label="Phone Number *"
                name="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={handleInputChange}
                inputStyle={validationErrors.phone ? inputErrorStyle : inputStyle}
                labelStyle={labelStyle}
                inputGroupStyle={inputGroupStyle}
                error={validationErrors.phone}
                errorTextStyle={errorTextStyle}
              />
              <div style={{fontSize: '12px', color: '#475569', fontStyle: 'italic', marginTop: '8px'}}>
                * Please provide either an email address or phone number
              </div>
              <div style={actionsStyle}>
                <div></div>
                <button type="button" style={primaryBtnStyle} onClick={goNext}>
                  Next Step
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div style={stepContentStyle}>
              <InputField
                label="Company Name"
                name="companyName"
                placeholder="Your company name"
                value={formData.companyName}
                onChange={handleInputChange}
                inputStyle={inputStyle}
                labelStyle={labelStyle}
                inputGroupStyle={inputGroupStyle}
              />
              <InputField
                label="Street Address"
                name="addressStreet"
                placeholder="Street address"
                value={formData.addressStreet}
                onChange={handleInputChange}
                inputStyle={inputStyle}
                labelStyle={labelStyle}
                inputGroupStyle={inputGroupStyle}
              />
              <InputField
                label="City"
                name="addressCity"
                placeholder="City"
                value={formData.addressCity}
                onChange={handleInputChange}
                inputStyle={inputStyle}
                labelStyle={labelStyle}
                inputGroupStyle={inputGroupStyle}
              />
              <InputField
                label="State/Province"
                name="addressState"
                placeholder="State or Province"
                value={formData.addressState}
                onChange={handleInputChange}
                inputStyle={inputStyle}
                labelStyle={labelStyle}
                inputGroupStyle={inputGroupStyle}
              />
              <InputField
                label="Country"
                name="addressCountry"
                placeholder="Country"
                value={formData.addressCountry}
                onChange={handleInputChange}
                inputStyle={inputStyle}
                labelStyle={labelStyle}
                inputGroupStyle={inputGroupStyle}
              />
              <InputField
                label="Postal Code"
                name="addressPostalCode"
                placeholder="Postal/ZIP code"
                value={formData.addressPostalCode}
                onChange={handleInputChange}
                inputStyle={inputStyle}
                labelStyle={labelStyle}
                inputGroupStyle={inputGroupStyle}
              />
              <div style={actionsStyle}>
                <button type="button" style={ghostBtnStyle} onClick={goBack}>
                  Previous
                </button>
                <button type="button" style={primaryBtnStyle} onClick={goNext}>
                  Next Step
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div style={stepContentStyle}>
              <InputSelect
                label="Business Type"
                name="businessType"
                value={formData.businessType}
                onChange={handleInputChange}
                options={[
                  ['', 'Select business type'],
                  ['garment-manufacturer', 'Garment Manufacturer'],
                  ['clothing-retailer', 'Clothing Retailer'],
                  ['fabric-importer', 'Fabric Importer'],
                  ['trading-company', 'Trading Company'],
                  ['other', 'Other'],
                ]}
                inputStyle={inputStyle}
                labelStyle={labelStyle}
                inputGroupStyle={inputGroupStyle}
              />
              <InputSelect
                label="Fabric Category"
                name="fabricCategory"
                value={formData.fabricCategory}
                onChange={handleInputChange}
                options={[
                  ['', 'Select fabric category'],
                  ['cotton', 'Cotton'],
                  ['silk', 'Silk'],
                  ['polyester', 'Polyester'],
                  ['blends', 'Blends'],
                  ['linen', 'Linen'],
                  ['wool', 'Wool'],
                  ['technical', 'Technical'],
                  ['denim', 'Denim'],
                ]}
                inputStyle={inputStyle}
                labelStyle={labelStyle}
                inputGroupStyle={inputGroupStyle}
              />
              <div style={{display: 'flex', gap: '12px'}}>
                <div style={{flex: '1'}}>
                  <InputField
                    label="Opportunity Amount"
                    name="opportunityAmount"
                    type="number"
                    placeholder="0.00"
                    value={formData.opportunityAmount}
                    onChange={handleInputChange}
                    inputStyle={inputStyle}
                    labelStyle={labelStyle}
                    inputGroupStyle={inputGroupStyle}
                  />
                </div>
                <div style={{flex: '0 0 100px'}}>
                  <InputSelect
                    label="Currency"
                    name="opportunityAmountCurrency"
                    value={formData.opportunityAmountCurrency}
                    onChange={handleInputChange}
                    options={[
                      ['USD', 'USD'],
                      ['EUR', 'EUR'],
                      ['GBP', 'GBP'],
                      ['INR', 'INR'],
                      ['CNY', 'CNY'],
                    ]}
                    inputStyle={inputStyle}
                    labelStyle={labelStyle}
                    inputGroupStyle={inputGroupStyle}
                  />
                </div>
              </div>
              <InputTextArea
                label="Description"
                name="description"
                placeholder="Please describe your requirements, specifications, or any additional information"
                value={formData.description}
                onChange={handleInputChange}
                inputStyle={textareaStyle}
                labelStyle={labelStyle}
                inputGroupStyle={inputGroupStyle}
              />
              <div style={actionsStyle}>
                <button type="button" style={ghostBtnStyle} onClick={goBack}>
                  Previous
                </button>
                <button type="submit" style={{...primaryBtnStyle, opacity: isSubmitting ? 0.7 : 1}} disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting…' : 'Submit Request'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

// Subcomponents with inline styles
function InputField({ label, name, value, onChange, placeholder, type = 'text', inputStyle, labelStyle, inputGroupStyle, error, errorTextStyle }) {
  return (
    <div style={inputGroupStyle}>
      <label htmlFor={name} style={labelStyle}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={inputStyle}
      />
      {error && <div style={errorTextStyle}>{error}</div>}
    </div>
  );
}

function InputSelect({ label, name, value, onChange, options, inputStyle, labelStyle, inputGroupStyle }) {
  return (
    <div style={inputGroupStyle}>
      <label htmlFor={name} style={labelStyle}>{label}</label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        style={inputStyle}
      >
        {options.map(([v, text]) => (
          <option key={v + text} value={v}>
            {text}
          </option>
        ))}
      </select>
    </div>
  );
}

function InputTextArea({ label, name, value, onChange, placeholder, inputStyle, labelStyle, inputGroupStyle }) {
  return (
    <div style={inputGroupStyle}>
      <label htmlFor={name} style={labelStyle}>{label}</label>
      <textarea
        id={name}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        rows={3}
        style={inputStyle}
      />
    </div>
  );
}