'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { useRouter, useSearchParams } from 'next/navigation';
import Cookies from 'js-cookie';
import ErrorMsg from '../common/error-msg';
import { notifyError, notifySuccess } from '@/utils/toast';

const schema = Yup.object().shape({
  firstName:     Yup.string().required('First name is required'),
  lastName:      Yup.string(),
  email:         Yup.string().required('Email is required').email('Enter a valid email'),
  organisation:  Yup.string(),
  phone:         Yup.string(),
  address:       Yup.string(),
  city:          Yup.string(),
  state:         Yup.string(),
  country:       Yup.string(),
  remember:      Yup.bool().oneOf([true], 'You must accept the terms'),
});

export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect'); // if opened as modal, we keep redirect

  const [stage, setStage] = useState('form'); // 'form' or 'otp'
  const [savedEmail, setEmail] = useState('');
  const [otp, setOtp] = useState('');

  const { register, handleSubmit, formState:{ errors }, reset } =
    useForm({ resolver: yupResolver(schema) });

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
  const API_KEY  = process.env.NEXT_PUBLIC_API_KEY;

  // Send OTP (Register user)
  const onFormSubmit = async (data) => {
    try {
      setEmail(data.email);
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(API_KEY && { 'x-api-key': API_KEY }),
        },
        body: JSON.stringify({
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to send OTP');
      notifySuccess(json.message || 'OTP sent successfully');
      setStage('otp');
    } catch (err) {
      notifyError(err.message || 'Failed to send OTP');
    }
  };

  // Verify OTP & register - Auto login after successful registration
  const onOtpSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(API_KEY && { 'x-api-key': API_KEY }),
        },
        body: JSON.stringify({ email: savedEmail, otp }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'OTP verification failed');
      
      // ✅ Auto-login: Get user data from response
      const currentUser = json.user;
      
      if (!currentUser || !currentUser.id) {
        throw new Error('User data not returned after registration');
      }

      // Generate session and store user data
      const sessionId = `session_${Date.now()}`;
      const userId = currentUser.id;

      if (typeof window !== 'undefined') {
        localStorage.setItem('sessionId', sessionId);
        localStorage.setItem('userId', userId);
      }

      Cookies.set('sessionId', sessionId, {
        expires: 7,
        sameSite: 'lax',
        path: '/',
      });
      
      Cookies.set('userInfo', JSON.stringify({ user: currentUser }), {
        expires: 7, // Changed from 0.5 to 7 days
        sameSite: 'lax',
        path: '/',
      });

      console.log('✅ Registration & Auto-login successful!');
      notifySuccess('Registration successful! Welcome!');
      reset();
      
      // ✅ Redirect to home page (not login page)
      const dest = redirect || '/';
      router.push(dest);
    } catch (err) {
      notifyError(err.message || 'OTP verification failed');
    }
  };

  return (
    <>
      {/* Scroll container for right-side items */}
      <div className="tp-scroll-area">
        {stage === 'form' && (
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
            {/* First Name */}
            <div className="tp-input-box">
              <label className="tp-label" htmlFor="rf-firstname">First Name <span style={{color: 'red'}}>*</span></label>
              <input
                id="rf-firstname"
                autoFocus
                type="text"
                {...register('firstName')}
                className={`tp-input ${errors.firstName ? 'border-red-500' : ''}`}
                placeholder="Enter your first name"
              />
              {errors.firstName && <ErrorMsg msg={errors.firstName.message} />}
            </div>

            {/* Last Name */}
            <div className="tp-input-box">
              <label className="tp-label" htmlFor="rf-lastname">Last Name (Optional)</label>
              <input
                id="rf-lastname"
                {...register('lastName')}
                type="text"
                placeholder="Your last name"
                className={`tp-input ${errors.lastName ? 'border-red-500' : ''}`}
              />
              {errors.lastName && <ErrorMsg msg={errors.lastName.message} />}
            </div>

            {/* Email */}
            <div className="tp-input-box">
              <label className="tp-label" htmlFor="rf-email">Email <span style={{color: 'red'}}>*</span></label>
              <input
                id="rf-email"
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                className="tp-input"
              />
              <ErrorMsg msg={errors.email?.message}/>
            </div>

            {/* Organisation */}
            <div className="tp-input-box">
              <label className="tp-label" htmlFor="rf-org">Organisation (Optional)</label>
              <input
                id="rf-org"
                {...register('organisation')}
                type="text"
                placeholder="Company / Organisation"
                className="tp-input"
              />
              <ErrorMsg msg={errors.organisation?.message}/>
            </div>

            {/* Phone */}
            <div className="tp-input-box">
              <label className="tp-label" htmlFor="rf-phone">Phone (Optional)</label>
              <input
                id="rf-phone"
                {...register('phone')}
                type="text"
                placeholder="Contact number"
                className="tp-input"
              />
              <ErrorMsg msg={errors.phone?.message}/>
            </div>

            {/* Address */}
            <div className="tp-input-box">
              <label className="tp-label" htmlFor="rf-address">Address (Optional)</label>
              <input
                id="rf-address"
                {...register('address')}
                type="text"
                placeholder="Address"
                className="tp-input"
              />
              <ErrorMsg msg={errors.address?.message}/>
            </div>

            {/* City */}
            <div className="tp-input-box">
              <label className="tp-label" htmlFor="rf-city">City (Optional)</label>
              <input
                id="rf-city"
                {...register('city')}
                type="text"
                placeholder="City"
                className="tp-input"
              />
              <ErrorMsg msg={errors.city?.message}/>
            </div>

            {/* State */}
            <div className="tp-input-box">
              <label className="tp-label" htmlFor="rf-state">State (Optional)</label>
              <input
                id="rf-state"
                {...register('state')}
                type="text"
                placeholder="State"
                className="tp-input"
              />
              <ErrorMsg msg={errors.state?.message}/>
            </div>

            {/* Country */}
            <div className="tp-input-box">
              <label className="tp-label" htmlFor="rf-country">Country (Optional)</label>
              <input
                id="rf-country"
                {...register('country')}
                type="text"
                placeholder="Country"
                className="tp-input"
              />
              <ErrorMsg msg={errors.country?.message}/>
            </div>

            {/* Terms */}
            <div className="tp-input-box">
              <label className="tp-checkbox">
                <input {...register('remember')} type="checkbox" />
                <span>I agree to the Terms & Conditions</span>
              </label>
              <ErrorMsg msg={errors.remember?.message}/>
            </div>

            <button type="submit" className="tp-btn tp-btn-black">Send OTP</button>
          </form>
        )}

        {stage === 'otp' && (
          <form onSubmit={onOtpSubmit} className="space-y-4">
            <div className="tp-input-box">
              <label className="tp-label" htmlFor="rf-otp">OTP</label>
              <input
                id="rf-otp"
                autoFocus
                value={otp}
                onChange={e => setOtp(e.target.value)}
                placeholder="Enter OTP"
                className="tp-input"
                inputMode="numeric"
                pattern="[0-9]*"
                required
              />
            </div>
            <button type="submit" className="tp-btn tp-btn-black">Verify & Register</button>
          </form>
        )}
      </div>

      {/* Scoped styles for inputs, buttons & scrollbar */}
      <style jsx>{`
        /* Scroll area sized for the modal's right side content */
        .tp-scroll-area {
          max-height: 70vh;          /* fits safely inside your modal */
          overflow-y: auto;
          padding-right: 4px;        /* room for scrollbar without shifting content */
        }

        /* WebKit (Chrome/Edge/Safari) scrollbar */
        .tp-scroll-area::-webkit-scrollbar {
          width: 10px;
        }
        .tp-scroll-area::-webkit-scrollbar-track {
          background: #f1f5f9;       /* subtle track */
        }
        .tp-scroll-area::-webkit-scrollbar-thumb {
          background: #cbd5e1;       /* thumb color */
          border-radius: 0;          /* square */
          border: 2px solid #f1f5f9; /* creates gap around thumb */
        }
        .tp-scroll-area::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        /* Firefox scrollbar */
        .tp-scroll-area {
          scrollbar-width: thin;                   /* auto | thin | none */
          scrollbar-color: #cbd5e1 #f1f5f9;       /* thumb track */
        }

        /* Inputs */
        .tp-input-box { display:flex; flex-direction:column; gap:6px; }
        .tp-label { font-weight:600; color:#0f172a; }
        .tp-input {
          width:100%;
          padding:12px 14px;
          border:1px solid #d6dae1;
          border-radius:0;            /* square */
          background:#fff;
          color:#0f172a;
          outline:none;
          transition:border-color .15s ease, box-shadow .15s ease;
        }
        .tp-input:focus {
          border-color:#0f172a;
          box-shadow:0 0 0 2px rgba(15,23,42,.15);
        }

        /* Checkbox */
        .tp-checkbox { display:flex; align-items:center; gap:10px; user-select:none; }
        .tp-checkbox input { width:16px; height:16px; accent-color:#000; }

        /* Button */
        .tp-btn {
          width:100%;
          padding:12px 18px;
          border:1px solid transparent;
          border-radius:0;            /* square */
          font-weight:700;
          cursor:pointer;
          transition:all .18s ease;
        }
        .tp-btn-black {
          background:#000;
          color:#fff;
          border-color:#000;
        }
        .tp-btn-black:hover {
          background:#fff;
          color:#000;
          border-color:#000;
        }

        /* Tighter max height on very small viewports */
        @media (max-height: 640px) {
          .tp-scroll-area { max-height: 62vh; }
        }
        @media (max-width: 640px) {
          .tp-scroll-area { max-height: 68vh; }
        }
      `}</style>
    </>
  );
}
