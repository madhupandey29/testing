'use client';

import React, { useState } from 'react';
import Cookies from 'js-cookie';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { useRouter, useSearchParams } from 'next/navigation';
import ErrorMsg from '../common/error-msg';
import { notifyError, notifySuccess } from '@/utils/toast';
import { readAndClearReturnTo, sanitizeReturnTo } from '@/utils/authReturn';

/* ---------------- helpers ---------------- */
const isEmail = (v) => /^\S+@\S+\.\S+$/.test(String(v || '').trim());
const isPhone = (v) => /^[0-9]{8,15}$/.test(String(v || '').trim());
const emailOrPhoneMsg = 'Enter a valid email or mobile number';

/* single input validation: accepts email or phone */
const otpRequestSchema = Yup.object().shape({
  identifier: Yup.string()
    .required(emailOrPhoneMsg)
    .test('email-or-phone', emailOrPhoneMsg, (v) => isEmail(v) || isPhone(v)),
});

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [savedIdentifier, setSavedIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [showVerify, setShowVerify] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register: regOtp,
    handleSubmit: onOtpReqSubmit,
    formState: { errors: otpErrReq },
    reset: resetOtpReq,
  } = useForm({ resolver: yupResolver(otpRequestSchema) });

  const API = process.env.NEXT_PUBLIC_API_BASE_URL;
  const KEY = process.env.NEXT_PUBLIC_API_KEY;

  /* =============== OTP REQUEST (step 1) =============== */
  const handleOtpRequest = async (data) => {
    try {
      setLoading(true);
      const identifier = data.identifier?.trim();
      setSavedIdentifier(identifier);

      // Call login API to send OTP
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(KEY && { 'x-api-key': KEY }),
        },
        body: JSON.stringify({ email: identifier }),
      });

      const json = await res.json();
      
      if (!res.ok) {
        throw new Error(json.message || 'Failed to send OTP');
      }

      notifySuccess(json.message || `OTP sent to ${identifier}`);
      resetOtpReq();
      setShowVerify(true);
      setLoading(false);
    } catch (err) {
      notifyError(err?.message || 'OTP request failed');
      setLoading(false);
    }
  };

  /* =============== OTP VERIFY (step 2) =============== */
  const handleOtpVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Verify OTP with real API
      const verifyRes = await fetch(`${API}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(KEY && { 'x-api-key': KEY }),
        },
        body: JSON.stringify({ 
          email: savedIdentifier, 
          otp 
        }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        throw new Error(verifyData.message || 'Invalid OTP');
      }

      console.log('✅ OTP verified successfully');

      // ✅ SECURE: Backend returns user data in verify-otp response
      const currentUser = verifyData.user;
      
      if (!currentUser || !currentUser.id) {
        throw new Error('User data not returned from OTP verification');
      }

      console.log('✅ User data received from OTP verification (basic):', currentUser);

      const userId = currentUser.id;

      // 🆕 FETCH FULL USER DATA FROM ESPOCRM
      console.log('🔄 Fetching full user data from EspoCRM...');
      const espoRes = await fetch(
        `https://espobackend.vercel.app/api/customeraccount/${userId}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!espoRes.ok) {
        console.warn('⚠️ Failed to fetch full user data from EspoCRM, using basic data');
        // Fallback to basic user data if EspoCRM fetch fails
      } else {
        const espoData = await espoRes.json();
        console.log('✅ EspoCRM Response:', espoData);
        
        // EspoCRM returns: { data: {...}, entity: "CCustomerAccount", success: true }
        // OR directly the user object
        const fullUserData = espoData.data || espoData;
        
        if (fullUserData && fullUserData.id) {
          // Use full data from EspoCRM
          Object.assign(currentUser, fullUserData);
          console.log('✅ Merged with EspoCRM data:', currentUser);
        }
      }

      // Map EspoCRM format to our internal format
      const mappedUser = {
        _id: currentUser.id,
        id: currentUser.id,
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        name: currentUser.name || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim(),
        email: currentUser.emailAddress || currentUser.email || '',
        phone: currentUser.phoneNumber || '',
        organisation: currentUser.organizationNameRaw || '',
        address: currentUser.addressStreet || '',
        city: currentUser.addressCity || '',
        state: currentUser.addressState || '',
        country: currentUser.addressCountry || '',
        pincode: currentUser.addressPostalCode || '',
        avatar: null,
        userImage: null,
      };

      console.log('✅ Mapped user data (internal format):', mappedUser);

      // Generate session and store real EspoCRM user ID
      const sessionId = `session_${Date.now()}`;

      if (typeof window !== 'undefined') {
        localStorage.setItem('sessionId', sessionId);
        localStorage.setItem('userId', userId);
      }

      Cookies.set('sessionId', sessionId, {
        expires: 7,
        sameSite: 'lax',
        path: '/',
      });
      
      // Store mapped user data in cookie
      Cookies.set('userInfo', JSON.stringify({ user: mappedUser }), {
        expires: 7,
        sameSite: 'lax',
        path: '/',
      });

      console.log('✅ Login successful!');
      notifySuccess('Logged in successfully');
      setOtp('');

      // ✅ STEP 3: Proper redirect (sessionStorage > query > home) + REPLACE
      let dest = '/';
      try {
        // Next.js hook is safer than window.location.search in app router
        const qpReturnTo = searchParams?.get('returnTo');
        
        const stored = readAndClearReturnTo(); // one-time read
        const candidate = stored || qpReturnTo || '/';
        
        dest = sanitizeReturnTo(candidate);
      } catch {
        dest = '/';
      }
      
      // ✅ IMPORTANT: replace (so user won't go back to /login)
      router.replace(dest);
    } catch (err) {
      console.error('❌ Login error:', err);
      setError(err?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ====================== UI ====================== */
  return (
    <div>
      {/* STEP 1 — Request OTP */}
      {!showVerify && (
        <form onSubmit={onOtpReqSubmit(handleOtpRequest)} className="space-y-4 mb-6">
          <div className="tp-input-box">
            <label className="tp-label" htmlFor="lo-identifier">Enter Email/Mobile number</label>
            <input
              id="lo-identifier"
              autoFocus
              {...regOtp('identifier')}
              type="text"
              placeholder="you@example.com or 9876543210"
              className="tp-input"
              inputMode="email"
            />
            <ErrorMsg msg={otpErrReq?.identifier?.message} />
          </div>

          <div className="tp-actions">
            <button type="submit" className="tp-btn tp-btn-black" disabled={loading}>
              {loading ? 'Sending…' : 'Request OTP'}
            </button>
          </div>
        </form>
      )}

      {/* STEP 2 — Verify OTP */}
      {showVerify && (
        <form onSubmit={handleOtpVerify} className="space-y-4 mb-6">
          <div className="tp-input-box">
            <label className="tp-label" htmlFor="lv-otp">OTP</label>
            <input
              id="lv-otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              className="tp-input"
              inputMode="numeric"
              pattern="[0-9]*"
              required
              autoFocus
            />
          </div>

          {error ? <ErrorMsg msg={error} /> : null}

          <div className="tp-actions">
            <button type="submit" disabled={loading} className="tp-btn tp-btn-black">
              {loading ? 'Verifying…' : 'Verify OTP'}
            </button>
          </div>

          <div className="tp-divider">
            <button
              type="button"
              className="tp-link"
              onClick={() => { setShowVerify(false); setOtp(''); }}
            >
              edit email / mobile
            </button>
          </div>
        </form>
      )}

      <style jsx>{`
        .tp-input-box { display:flex; flex-direction:column; gap:6px; }
        .tp-label { font-weight:600; color:#0f172a; }
        .tp-input {
          width:100%;
          padding:12px 14px;
          border:1px solid #d6dae1;
          border-radius:0;
          background:#fff;
          color:#0f172a;
          outline:none;
          transition:border-color .15s ease, box-shadow .15s ease;
        }
        .tp-input:focus { border-color:#0f172a; box-shadow:0 0 0 2px rgba(15,23,42,.15); }
        .tp-actions { margin-top:8px; }
        .tp-btn { width:100%; padding:12px 18px; border:1px solid transparent; border-radius:0; font-weight:700; cursor:pointer; transition:all .18s ease; }
        .tp-btn-black { background:#000; color:#fff; border-color:#000; }
        .tp-btn-black:hover { background:#fff; color:#000; border-color:#000; }
        .tp-divider { text-align:center; margin:18px 0; }
        .tp-link { background:none; border:0; color:#475569; text-decoration:underline; cursor:pointer; }
      `}</style>
    </div>
  );
}
