'use client';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Image from 'next/image';
import { useSelector, useDispatch } from 'react-redux';
import Cookies from 'js-cookie';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { FaEdit, FaTrash } from 'react-icons/fa';
import dayjs from 'dayjs';

import {
  useGetSessionInfoQuery,
  useUpdateProfileMutation,
  useLogoutUserMutation,
} from '@/redux/features/auth/authApi';
import { setUserId, userLoggedOut } from '@/redux/features/auth/authSlice';

import { notifyError, notifySuccess } from '@/utils/toast';
import styles from './UserProfile.module.css';


/* ---------------- EspoCRM Field Mapping ---------------- */
const mapEspoToProfile = (espoUser) => {
  if (!espoUser) return null;
  return {
    _id: espoUser.id,
    id: espoUser.id,
    firstName: espoUser.firstName || '',
    lastName: espoUser.lastName || '',
    name: espoUser.name || `${espoUser.firstName || ''} ${espoUser.lastName || ''}`.trim(),
    email: espoUser.emailAddress || '',
    phone: espoUser.phoneNumber || '',
    organisation: espoUser.organizationNameRaw || '',
    address: espoUser.addressStreet || '',
    city: espoUser.addressCity || '',
    state: espoUser.addressState || '',
    country: espoUser.addressCountry || '',
    pincode: espoUser.addressPostalCode || '',
    avatar: null,
    userImage: null,
  };
};

/* ---------------- helpers ---------------- */
const pickInitialUser = (reduxUser) => {
  if (reduxUser) return reduxUser;
  const cookie = Cookies.get('userInfo');
  if (!cookie) return null;
  try { return JSON.parse(cookie)?.user || null; } catch { return null; }
};

const readUserInfoCookie = () => {
  try { return JSON.parse(Cookies.get('userInfo') || '{}'); } catch { return {}; }
};
const writeUserInfoCookiePreserving = (updatedUser) => {
  const prev = readUserInfoCookie();
  Cookies.set('userInfo', JSON.stringify({ ...prev, user: updatedUser }), { expires: 0.5 });
};

const initials = (name = '') =>
  name.split(' ').filter(Boolean).map(s => s[0]?.toUpperCase()).slice(0, 2).join('') || 'U';

const onlyDigits = (s = '') => (s || '').replace(/\D+/g, '');
const normalizeDial = (s = '') => (s ? (s.startsWith('+') ? s : `+${s}`) : '');

const cleanString = (v) => (typeof v === 'string' ? v.trim() : v);

const diffPayload = (next, base, allowEmptyKeys = new Set()) => {
  const out = {};
  Object.keys(next).forEach((k) => {
    const nv = next[k];
    const bv = base?.[k];
    const same = (cleanString(nv) === cleanString(bv));
    if (same) return;
    if (nv === undefined) return;
    if (nv === '' && !allowEmptyKeys.has(k)) return;
    out[k] = nv;
  });
  return out;
};

const isInlineSrc = (src) =>
  typeof src === 'string' && (src.startsWith('data:') || src.startsWith('blob:'));

/**
 * Avatar renderer:
 * - data:/blob: => <img> (but WITH width/height/title/loading so SEO tools are happy)
 * - http(s) => next/image WITH width/height/title
 */
function AvatarImg({ src, size = 80, alt = 'Profile', title = 'Profile', priority = false, className }) {
  if (!src) return null;

  if (isInlineSrc(src)) {
    return (
      <img
        src={src}
        alt={alt}
        title={title}
        width={size}
        height={size}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className={className}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      title={title}
      width={size}
      height={size}
      sizes={`${size}px`}
      priority={priority}
      className={className}
    />
  );
}

/* Validation */
const editSchema = Yup.object().shape({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  organisation: Yup.string().nullable(),
  phone: Yup.string().nullable(),
  address: Yup.string().nullable(),
  city: Yup.string().nullable(),
  state: Yup.string().nullable(),
  country: Yup.string().nullable(),
  pincode: Yup.string().nullable(),
});

/* ---------------- session helpers (client) ---------------- */
const getClientSessionId = () => {
  const fromCookie = Cookies.get('sessionId');
  if (fromCookie) return fromCookie;
  try {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sessionId') || '';
    }
  } catch { /* noop */ }
  return '';
};

const redirectToLogin = () => {
  try {
    // Capture full URL with query params and hash
    const returnTo = typeof window !== 'undefined'
      ? `${window.location.pathname}${window.location.search}${window.location.hash}`
      : '/profile';
    window.location.href = `/login?returnTo=${encodeURIComponent(returnTo)}`;
  } catch {
    window.location.href = '/login';
  }
};

/* =============================== Component =============================== */
export default function UserProfile() {
  // Performance optimization: Preload critical resources
  useEffect(() => {
    // DNS prefetch for external APIs
    if (typeof window !== 'undefined') {
      const prefetchDomains = [
        'https://restcountries.com',
        'https://countriesnow.space',
        'https://espobackend.vercel.app'
      ];
      
      prefetchDomains.forEach(domain => {
        const link = document.createElement('link');
        link.rel = 'dns-prefetch';
        link.href = domain;
        document.head.appendChild(link);
      });
    }
  }, []);

  /* Guard: if no session, redirect */
  const [authChecked, setAuthChecked] = useState(false);
  
  useEffect(() => {
    // Only run auth check once on mount, not on every re-render
    if (authChecked) return;
    
    // Small delay to ensure localStorage is set after login redirect
    const checkAuth = setTimeout(() => {
      const sid = getClientSessionId();
      const uid = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
      
      console.log('🔒 Auth Guard Check:', { sessionId: sid, userId: uid });
      
      // Must have both sessionId and userId
      if (!sid || !uid) {
        console.warn('Missing session or user ID, redirecting to login');
        redirectToLogin();
      } else {
        setAuthChecked(true);
      }
    }, 100); // 100ms delay
    
    return () => clearTimeout(checkAuth);
  }, [authChecked]);

  const dispatch = useDispatch();
  const authUser = useSelector((s) => s?.auth?.user);
  const cookieUser = useMemo(() => pickInitialUser(authUser), [authUser]);
  const derivedUserId = (authUser?._id || cookieUser?._id);

  useEffect(() => {
    if (derivedUserId) {
      localStorage.setItem('userId', String(derivedUserId));
      // Sync userId to Redux for wishlist and other features
      dispatch(setUserId(String(derivedUserId)));
    }
  }, [derivedUserId, dispatch]);

  const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
  const userId = derivedUserId || storedUserId || null;
  
  // Ensure Redux has userId even if it comes from localStorage
  useEffect(() => {
    if (userId && !derivedUserId) {
      dispatch(setUserId(userId));
    }
  }, [userId, derivedUserId, dispatch]);

  const { data: sessionData, refetch: refetchSession } =
    useGetSessionInfoQuery({ userId }, {
      skip: !userId,
      refetchOnFocus: true,
      refetchOnReconnect: true
    });

  // optimistic local user
  const [localUser, setLocalUser] = useState(null);
  const user = useMemo(() => {
    const merged = {
      ...(sessionData?.session?.user || {}),
      ...(cookieUser || {}),
      ...(authUser || {}),
      ...(localUser || {}),
    };
    // derive avatar field
    merged.avatar = merged.userImage || merged.avatarUrl || merged.avatar || null;
    
    console.log('🔄 User object recomputed:', {
      sessionUser: sessionData?.session?.user,
      cookieUser,
      authUser,
      localUser,
      merged
    });
    
    return merged;
  }, [sessionData, cookieUser, authUser, localUser]);

  const [logoutUser] = useLogoutUserMutation();
  const [updateProfile, { isLoading: saving }] = useUpdateProfileMutation();

  const [active, setActive] = useState('profile');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [editingFields, setEditingFields] = useState(new Set()); // Track multiple fields being edited
  const [orderStatus, setOrderStatus] = useState('all'); // Track order status filter
  
  // Helper functions for managing editing fields
  const startEditing = (fieldName) => {
    setEditingFields(prev => new Set([...prev, fieldName]));
  };
  
  const stopEditing = (fieldName) => {
    setEditingFields(prev => {
      const newSet = new Set(prev);
      newSet.delete(fieldName);
      return newSet;
    });
  };
  
  const clearAllEditing = () => {
    setEditingFields(new Set());
  };
  
  const isEditing = (fieldName) => {
    return editingFields.has(fieldName);
  };
  
  const hasAnyEditing = editingFields.size > 0;

  /* Countries + dial codes */
  const [countries, setCountries] = useState([]);
  const [countriesLoaded, setCountriesLoaded] = useState(false);
  const [dialSelected, setDialSelected] = useState(''); // +91
  const [phoneLocal, setPhoneLocal] = useState('');     // digits only

  /* -------------------- Orders (My Orders tab) - lazy load -------------------- */
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersErr, setOrdersErr] = useState(null);
  const [ordersLoaded, setOrdersLoaded] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!userId || ordersLoaded) return;
    
    setOrdersLoading(true);
    setOrdersErr(null);
    
    try {
      const res = await fetch(`https://espobackend.vercel.app/api/orders/user/${userId}`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      const json = await res.json();
      const list = json?.data?.orders || json?.orders || [];
      setOrders(Array.isArray(list) ? list : []);
      setOrdersLoaded(true);
    } catch (e) {
      // Log error for debugging but show user-friendly message
      console.error('Failed to fetch orders:', e);
      setOrdersErr('Failed to load orders');
    } finally {
      setOrdersLoading(false);
    }
  }, [userId, ordersLoaded]);

  // Load orders only when booking tab is active
  useEffect(() => {
    if (active === 'booking' && !ordersLoaded) {
      fetchOrders();
    }
  }, [active, fetchOrders, ordersLoaded]);

  /* -------------------- react-hook-form -------------------- */
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm({
    resolver: yupResolver(editSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      organisation: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      country: '',
      pincode: '',
    }
  });

  /* --- normalize server user response for /shopy/users/:id --- */
  const normalizeUserPayload = (raw) => {
    const u = raw?.data?.user || raw?.user || raw || {};
    const firstName = u.firstName ?? (u.name ? String(u.name).split(' ')[0] : '');
    const lastName = u.lastName ?? (u.name ? String(u.name).split(' ').slice(1).join(' ').trim() : '');
    return {
      ...u,
      firstName,
      lastName,
      name: u.name ?? `${firstName} ${lastName}`.trim(),
      userImage: u.userImage || u.avatarUrl || u.avatar || null,
      avatar: u.userImage || u.avatarUrl || u.avatar || null,
    };
  };

  // ✅ Load user data from session (cookies/localStorage)
  const [userDataLoaded, setUserDataLoaded] = useState(false);
  
  const loadUserFromSession = useCallback(() => {
    if (userDataLoaded) return; // Only load once
    
    try {
      // ====== Load user data from session (cookies) ======
      const storedSessionId = typeof window !== 'undefined' 
        ? localStorage.getItem('sessionId') || Cookies.get('sessionId')
        : null;
      
      if (!storedSessionId) {
        console.warn('No session found, redirecting to login');
        redirectToLogin();
        return;
      }
      
      // Get user from cookie (stored during login)
      const cookieData = Cookies.get('userInfo');
      if (cookieData) {
        try {
          const parsed = JSON.parse(cookieData);
          const sessionUser = parsed?.user || parsed;
          
          if (sessionUser) {
            console.log('✅ Loaded user from session:', sessionUser);
            // Cookie data is already in mapped format, don't map again
            setLocalUser(prev => ({ ...(prev || {}), ...sessionUser }));
            setUserDataLoaded(true);
            return;
          }
        } catch (e) {
          console.warn('Failed to parse user cookie:', e);
        }
      }
      
      // If no valid session data, redirect to login
      console.warn('No valid user data in session, redirecting to login');
      redirectToLogin();
    } catch (error) {
      console.warn('Failed to load user from session:', error);
      redirectToLogin();
    }
  }, [userDataLoaded]);

  useEffect(() => {
    loadUserFromSession();
  }, [loadUserFromSession]);

  /* Initialize form when user changes */
  useEffect(() => {
    if (!user) return;

    const firstName = user.firstName || (user.name ? user.name.split(' ')[0] : '');
    const lastName = user.lastName || (user.name ? user.name.split(' ').slice(1).join(' ').trim() : '');

    console.log('📝 Initializing form with user data:', {
      firstName,
      lastName,
      email: user.email,
      organisation: user.organisation,
      phone: user.phone,
      address: user.address,
      city: user.city,
      state: user.state,
      country: user.country,
      pincode: user.pincode
    });

    reset({
      firstName,
      lastName,
      email: user.email || '',
      organisation: user.organisation || '',
      phone: user.phone || '',
      address: user.address || '',
      city: user.city || '',
      state: user.state || '',
      country: user.country || '',
      pincode: user.pincode || '',
    });

    setCountryName(user.country || '');
    setStateName(user.state || '');
    setCityName(user.city || '');

    const img = user.userImage || user.avatarUrl || user.avatar || null;
    setAvatarPreview(img);
  }, [user, reset]);

  // Load countries only when needed (edit tab)
  const loadCountries = useCallback(async () => {
    if (countriesLoaded || countries.length > 0) return;
    
    try {
      // Check cache first
      const cached = sessionStorage.getItem('countries-cache');
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // Cache for 1 hour
        if (Date.now() - timestamp < 3600000) {
          setCountries(data);
          setCountriesLoaded(true);
          return;
        }
      }

      const res = await fetch('https://restcountries.com/v3.1/all?fields=name,idd,cca2,flags');
      const raw = await res.json();
      const list = (raw || [])
        .map((r) => {
          const root = r?.idd?.root || '';
          const suffixes = r?.idd?.suffixes || [];
          const dial = root && suffixes && suffixes.length ? `${root}${suffixes[0]}` : root || '';
          return {
            cca2: r?.cca2 || '',
            name: r?.name?.common || '',
            dial: dial || '',
            flagPng: r?.flags?.png || '',
          };
        })
        .filter((x) => x.cca2 && x.name && x.dial && x.flagPng)
        .sort((a, b) => a.name.localeCompare(b.name));
      
      // Cache the result
      sessionStorage.setItem('countries-cache', JSON.stringify({
        data: list,
        timestamp: Date.now()
      }));
      
      setCountries(list);
      setCountriesLoaded(true);
    } catch (error) {
      // Silently fail - countries list is optional, form can still work without it
      console.error('Failed to load countries:', error);
      setCountries([]);
      setCountriesLoaded(true);
    }
  }, [countriesLoaded, countries.length]);

  // Load countries only when edit tab is active
  useEffect(() => {
    if (active === 'edit' && !countriesLoaded) {
      loadCountries();
    }
  }, [active, loadCountries, countriesLoaded]);

  /* derive dial + local from current phone once countries are ready */
  useEffect(() => {
    if (!countries.length) return;
    const raw = String(user?.phone || '').trim();
    if (!raw) { setDialSelected(''); setPhoneLocal(''); return; }
    if (raw.startsWith('+')) {
      const match = countries
        .filter(c => raw.startsWith(c.dial))
        .sort((a, b) => b.dial.length - a.dial.length)[0];
      if (match) {
        setDialSelected(match.dial);
        setPhoneLocal(raw.slice(match.dial.length));
      } else {
        setDialSelected('');
        setPhoneLocal(onlyDigits(raw));
      }
    } else {
      setDialSelected('');
      setPhoneLocal(onlyDigits(raw));
    }
  }, [countries.length, user?.phone]);

  /* keep hidden phone value updated */
  useEffect(() => {
    const composed = (dialSelected && phoneLocal)
      ? `${normalizeDial(dialSelected)}${onlyDigits(phoneLocal)}`
      : (user?.phone || '');
    setValue('phone', composed, { shouldValidate: false, shouldDirty: true });
  }, [dialSelected, phoneLocal, setValue, user?.phone]);

  /* Dependent state/city - optimized with caching and debouncing */
  const [countryName, setCountryName] = useState('');
  const [states, setStates] = useState([]);
  const [stateName, setStateName] = useState('');
  const [cities, setCities] = useState([]);
  const [cityName, setCityName] = useState('');
  const [statesCache] = useState(new Map());
  const [citiesCache] = useState(new Map());

  // Debounced state loading
  const loadStates = useCallback(async (countryName) => {
    if (!countryName) {
      setStates([]);
      setStateName('');
      setCities([]);
      setCityName('');
      setValue('country', '');
      return;
    }

    // Check cache first
    if (statesCache.has(countryName)) {
      const cachedStates = statesCache.get(countryName);
      setStates(cachedStates);
      setValue('country', countryName, { shouldDirty: true });
      if (!cachedStates.find((s) => s.name === stateName)) {
        setStateName('');
        setValue('state', '', { shouldDirty: true });
        setCities([]);
        setCityName('');
        setValue('city', '', { shouldDirty: true });
      }
      return;
    }

    try {
      const res = await fetch('https://countriesnow.space/api/v0.1/countries/states', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: countryName }),
      });
      const json = await res.json();
      const list = json?.data?.states || [];
      
      // Cache the result
      statesCache.set(countryName, list);
      
      setStates(list);
      setValue('country', countryName, { shouldDirty: true });
      if (!list.find((s) => s.name === stateName)) {
        setStateName('');
        setValue('state', '', { shouldDirty: true });
        setCities([]);
        setCityName('');
        setValue('city', '', { shouldDirty: true });
      }
    } catch (error) {
      // Silently fail - states list is optional, user can still enter manually
      console.error('Failed to load states:', error);
      setStates([]);
      setStateName('');
      setCities([]);
      setCityName('');
      setValue('state', '');
      setValue('city', '');
    }
  }, [setValue, stateName, statesCache]);

  const loadCities = useCallback(async (countryName, stateName) => {
    if (!countryName || !stateName) {
      setCities([]);
      setCityName('');
      setValue('city', '');
      return;
    }

    const cacheKey = `${countryName}-${stateName}`;
    
    // Check cache first
    if (citiesCache.has(cacheKey)) {
      const cachedCities = citiesCache.get(cacheKey);
      setCities(cachedCities);
      if (!cachedCities.includes(cityName)) {
        setCityName('');
        setValue('city', '', { shouldDirty: true });
      }
      return;
    }

    try {
      const res = await fetch('https://countriesnow.space/api/v0.1/countries/state/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: countryName, state: stateName }),
      });
      const json = await res.json();
      const list = json?.data || [];
      
      // Cache the result
      citiesCache.set(cacheKey, list);
      
      setCities(list);
      if (!list.includes(cityName)) {
        setCityName('');
        setValue('city', '', { shouldDirty: true });
      }
    } catch (error) {
      // Silently fail - cities list is optional, user can still enter manually
      console.error('Failed to load cities:', error);
      setCities([]);
      setCityName('');
      setValue('city', '');
    }
  }, [setValue, cityName, citiesCache]);

  // Debounced loading with 300ms delay
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadStates(countryName);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [countryName, loadStates]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadCities(countryName, stateName);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [countryName, stateName, loadCities]);

  /* ---------------- Avatar pick ---------------- */
  const [selectedFile, setSelectedFile] = useState(null);

  const onPickAvatar = (file) => {
    if (!file) return;
    if (!file.type.match('image.*')) {
      notifyError('Please select a valid image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      notifyError('Image size should be less than 5MB');
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result || null;
      setAvatarPreview(result);
    };
    reader.onerror = () => notifyError('Failed to read the image file');
    reader.readAsDataURL(file);
  };

  /* ---------------- Save profile (Update via API + Update Session) ---------------- */
  const onSubmit = async (data) => {
    if (!userId) { notifyError('Cannot update profile: user not identified.'); return; }

    // ====== SECURITY: Verify session before allowing update ======
    const storedSessionId = typeof window !== 'undefined' 
      ? localStorage.getItem('sessionId') || Cookies.get('sessionId')
      : null;
    
    if (!storedSessionId) {
      notifyError('Session expired. Please login again.');
      redirectToLogin();
      return;
    }

    const composedPhone = (dialSelected && phoneLocal)
      ? `${normalizeDial(dialSelected)}${onlyDigits(phoneLocal)}`
      : (data.phone || '');

    const firstName = cleanString(data.firstName ?? '');
    const lastName = cleanString(data.lastName ?? '');
    
    // Map to EspoCRM field names
    const updateData = {
      firstName,
      lastName,
      emailAddress: cleanString(data.email ?? ''),
      organizationNameRaw: cleanString(data.organisation ?? '') || null,
      phoneNumber: composedPhone ? cleanString(composedPhone) : null,
      addressStreet: cleanString(data.address ?? '') || null,
      addressCity: cleanString(cityName || data.city || user?.city || '') || null,
      addressState: cleanString(stateName || data.state || user?.state || '') || null,
      addressCountry: cleanString(countryName || data.country || user?.country || '') || null,
      addressPostalCode: cleanString(data.pincode ?? '') || null
    };
    
    // Remove null values to avoid validation errors
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === null || updateData[key] === '') {
        delete updateData[key];
      }
    });

    // Remove null values to avoid validation errors
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === null || updateData[key] === '') {
        delete updateData[key];
      }
    });

    // Check if there are any changes
    const hasChanges = Object.keys(updateData).some(key => {
      const newVal = updateData[key];
      let oldVal;
      
      // Map back to user object fields
      switch(key) {
        case 'emailAddress': oldVal = user?.email; break;
        case 'organizationNameRaw': oldVal = user?.organisation; break;
        case 'phoneNumber': oldVal = user?.phone; break;
        case 'addressStreet': oldVal = user?.address; break;
        case 'addressCity': oldVal = user?.city; break;
        case 'addressState': oldVal = user?.state; break;
        case 'addressCountry': oldVal = user?.country; break;
        case 'addressPostalCode': oldVal = user?.pincode; break;
        default: oldVal = user?.[key];
      }
      
      return cleanString(newVal) !== cleanString(oldVal);
    });

    if (!hasChanges && !selectedFile) {
      notifySuccess('Nothing to update');
      clearAllEditing();
      return;
    }

    let updatedResp = null;
    try {
      // ✅ Update via API (PUT /api/customeraccount/:id)
      const response = await fetch(`https://espobackend.vercel.app/api/customeraccount/${userId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': storedSessionId,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          notifyError('Session expired. Please login again.');
          redirectToLogin();
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update profile');
      }

      updatedResp = await response.json();
      console.log('✅ Profile updated via API:', updatedResp);
      
    } catch (error) {
      console.error('❌ Update error:', error);
      notifyError(error.message || 'Failed to update profile');
      return;
    }

    // ✅ Extract the actual user data from response
    // API returns: { data: { id, firstName, ... }, entity: "CCustomerAccount", success: true }
    const userData = updatedResp.data || updatedResp;
    console.log('✅ Extracted user data:', userData);
    
    // ✅ Map response back to our format using the mapping function
    const mappedUser = mapEspoToProfile(userData);
    
    // Merge with existing user to ensure nothing is lost
    const updatedUser = {
      ...user, // Start with current user
      ...mappedUser, // Apply mapped response
      _id: userId,
      id: userId,
      // Ensure these are never lost
      email: mappedUser.email || user?.email,
      avatar: avatarPreview || user?.avatar || null,
      userImage: avatarPreview || user?.userImage || null,
    };
    
    console.log('✅ API Response:', updatedResp);
    console.log('✅ Mapped User:', mappedUser);
    console.log('✅ Final Updated User:', updatedUser);

    setSelectedFile(null);

    // CRITICAL: Update cookies BEFORE updating local state
    try {
      Cookies.set('userInfo', JSON.stringify({ user: updatedUser }), { 
        expires: 7,
        sameSite: 'lax',
        path: '/'
      });
      Cookies.set('sessionId', storedSessionId, {
        expires: 7,
        sameSite: 'lax',
        path: '/'
      });
      
      // Also update localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('userId', userId);
      }
      
      console.log('✅ Cookies updated successfully');
      console.log('✅ Cookie content:', JSON.parse(Cookies.get('userInfo')));
    } catch (error) {
      console.error('❌ Failed to update cookies:', error);
      notifyError('Failed to save session');
      return;
    }
    
    // Update local state AFTER cookies are saved
    setLocalUser(updatedUser);
    setAvatarPreview(updatedUser.avatar || null);
    
    console.log('✅ LocalUser updated to:', updatedUser);
    console.log('✅ Current user object:', user);

    // CRITICAL: Reset form with updated values
    reset({
      firstName: updatedUser.firstName || '',
      lastName: updatedUser.lastName || '',
      email: updatedUser.email || '',
      organisation: updatedUser.organisation || '',
      phone: updatedUser.phone || '',
      address: updatedUser.address || '',
      city: updatedUser.city || '',
      state: updatedUser.state || '',
      country: updatedUser.country || '',
      pincode: updatedUser.pincode || '',
    });
    
    console.log('✅ Form reset with values:', {
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      organisation: updatedUser.organisation,
      phone: updatedUser.phone,
      address: updatedUser.address,
      city: updatedUser.city,
      state: updatedUser.state,
      country: updatedUser.country,
      pincode: updatedUser.pincode,
    });
    
    // Update location states
    setCountryName(updatedUser.country || '');
    setStateName(updatedUser.state || '');
    setCityName(updatedUser.city || '');
    
    // Update phone states
    if (updatedUser.phone) {
      const raw = String(updatedUser.phone).trim();
      if (raw.startsWith('+') && countries.length > 0) {
        const match = countries
          .filter(c => raw.startsWith(c.dial))
          .sort((a, b) => b.dial.length - a.dial.length)[0];
        if (match) {
          setDialSelected(match.dial);
          setPhoneLocal(raw.slice(match.dial.length));
        }
      }
    }

    try { 
      await refetchSession?.(); 
    } catch (error) {
      // Silently ignore session refetch errors - not critical
      console.error('Failed to refetch session:', error);
    }

    notifySuccess('Profile updated successfully');
    clearAllEditing();
    setActive('profile');
  };

  /* ---------------- Logout (Destroy Session) ---------------- */
  const handleLogout = async () => {
    try {
      // 1. Call logout mutation (clears cookies + localStorage)
      await logoutUser({ userId }).unwrap();
      
      // 2. Dispatch Redux logout action
      dispatch(userLoggedOut());
      
      // 3. Clear ALL session data (belt and suspenders approach)
      Cookies.remove('userInfo');
      Cookies.remove('sessionId');
      Cookies.remove('userId');
      
      if (typeof window !== 'undefined') {
        localStorage.clear(); // Clear ALL localStorage
        sessionStorage.clear(); // Clear ALL sessionStorage
      }
      
      console.log('✅ Session destroyed, logging out');
      notifySuccess('Logged out successfully');
      
      // 4. Force hard reload to clear all cached state
      window.location.href = '/';
    } catch (err) {
      // Even if API fails, clear local session completely
      dispatch(userLoggedOut());
      
      Cookies.remove('userInfo');
      Cookies.remove('sessionId');
      Cookies.remove('userId');
      
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      
      notifyError(err?.data?.message || 'Logout failed');
      window.location.href = '/';
    }
  };

  /* ---- Derived values for read-only display ---- */
  const derivedPrettyPhone = (() => {
    const raw = String(user?.phone || '').trim();
    if (!raw) return '—';
    if (raw.startsWith('+')) return raw;
    if (dialSelected && phoneLocal) return `${normalizeDial(dialSelected)}${onlyDigits(phoneLocal)}`;
    return raw;
  })();

  const derivedReadOnlyFlagPng = (() => {
    const raw = String(user?.phone || '').trim();
    if (!raw || !raw.startsWith('+') || !countries.length) return '';
    const match = countries
      .filter(c => raw.startsWith(c.dial))
      .sort((a, b) => b.dial.length - a.dial.length)[0];
    return match?.flagPng || '';
  })();

  /* country change handler */
  const handleCountryChange = (e) => {
    const val = e.target.value;
    setCountryName(val);
    setValue('country', val, { shouldDirty: true });
    setStateName('');
    setValue('state', '', { shouldDirty: true });
    setCityName('');
    setValue('city', '', { shouldDirty: true });
  };

  /* ---------------- UI ---------------- */
  return (
    <div className={`${styles.scope} ${styles.page}`}>
      {/* LAYOUT */}
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <div className={styles.avatarWrapper}>
                <div className={styles.bigAvatar}>
                  {avatarPreview ? (
                    <AvatarImg
                      src={avatarPreview}
                      size={70}
                      alt="Profile"
                      title="Profile"
                      priority
                      className={styles.bigAvatarImg}
                    />
                  ) : (
                    <div className={styles.bigAvatarFallback}>
                      {initials(user?.firstName || user?.name || 'U')}
                    </div>
                  )}
                </div>
                <label className={styles.avatarEditBtn} title="Edit Photo">
                  <FaEdit size={12} />
                  <input type="file" accept="image/*" onChange={(e) => onPickAvatar(e.target.files?.[0])} hidden />
                </label>
              </div>

              <div className={styles.titleBlock}>
                <h1 className={styles.h1}>
                  {user?.firstName || user?.lastName
                    ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                    : (user?.name || 'Guest User')}
                </h1>
                <div className={styles.subRow}>
                  {user?.email ? <span className={styles.email}>{user.email}</span> : null}
                </div>
              </div>
            </div>
          </div>
          
          <SideTab id="profile" label="My Profile" active={active} setActive={setActive} />
          <SideTab id="booking" label="My Orders" active={active} setActive={setActive} />
          <button type="button" className={styles.sideTab} onClick={handleLogout}>Logout</button>
        </aside>

        <main className={styles.main}>
          {/* Inline Editable Profile */}
          {active === 'profile' && (
            <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
              <h2 className={styles.sectionTitle}>Profile Details</h2>

              {/* Two Column Layout */}
              <div className={styles.row}>
                <InlineEditField
                  label="First Name"
                  fieldId="firstName"
                  value={user?.firstName || '—'}
                  isEditing={isEditing('firstName')}
                  onEdit={() => { startEditing('firstName'); loadCountries(); }}
                  onCancel={() => stopEditing('firstName')}
                  registerFn={register}
                  error={errors.firstName?.message}
                  required
                />

                <InlineEditField
                  label="Last Name"
                  fieldId="lastName"
                  value={user?.lastName || '—'}
                  isEditing={isEditing('lastName')}
                  onEdit={() => { startEditing('lastName'); loadCountries(); }}
                  onCancel={() => stopEditing('lastName')}
                  registerFn={register}
                  error={errors.lastName?.message}
                  required
                />
              </div>

              {/* Email - Read Only - Full Width */}
              <AlignedRead label="Email" value={user?.email || '—'} />

              {/* Organisation and Phone */}
              <div className={styles.row}>
                {isEditing('organisation') ? (
                  <AlignedCustom label="Organisation">
                    <div>
                      <input 
                        id="organisation" 
                        type="text" 
                        className={styles.input} 
                        {...register('organisation')} 
                        autoFocus 
                      />
                      {errors.organisation?.message && <p className={styles.err}>{errors.organisation.message}</p>}
                      <button type="button" className={styles.linkBtn} onClick={() => stopEditing('organisation')} style={{ marginTop: 8 }}>
                        Cancel
                      </button>
                    </div>
                  </AlignedCustom>
                ) : (
                  <InlineEditField
                    label="Organisation"
                    fieldId="organisation"
                    value={user?.organisation || '—'}
                    isEditing={false}
                    onEdit={() => { startEditing('organisation'); loadCountries(); }}
                    onCancel={() => stopEditing('organisation')}
                    registerFn={register}
                  />
                )}

                {/* Phone */}
                {isEditing('phone') ? (
                  <AlignedCustom label="Phone">
                    <div className={styles.row} style={{ gap: 12, width: '100%' }}>
                      <div
                        className={styles.input}
                        style={{
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          paddingRight: 36,
                          overflow: 'hidden',
                          width: '40%',
                          minWidth: 220
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            width: '100%',
                            pointerEvents: 'none'
                          }}
                        >
                          {countries.find(c => c.dial === dialSelected)?.flagPng ? (
                            <img
                              src={countries.find(c => c.dial === dialSelected)?.flagPng}
                              alt="Country flag"
                              title="Country flag"
                              width={20}
                              height={14}
                              loading="lazy"
                              decoding="async"
                              style={{ display: 'block', borderRadius: 2, objectFit: 'cover' }}
                            />
                          ) : (
                            <span style={{ width: 20, height: 14 }} />
                          )}
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {countries.find(c => c.dial === dialSelected)
                              ? `${countries.find(c => c.dial === dialSelected)?.name} (${dialSelected})`
                              : 'Select country code'}
                          </span>
                        </div>

                        <select
                          aria-label="Country dial code"
                          value={dialSelected}
                          onChange={(e) => setDialSelected(e.target.value)}
                          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                        >
                          <option value="">Select code</option>
                          {countries.map(c => (
                            <option key={`${c.cca2}-${c.dial}`} value={c.dial}>
                              {c.name} ({c.dial})
                            </option>
                          ))}
                        </select>
                      </div>

                      <input
                        className={styles.input}
                        type="tel"
                        placeholder="Local phone number"
                        value={phoneLocal}
                        onChange={(e) => setPhoneLocal(e.target.value)}
                        inputMode="numeric"
                        style={{ width: '60%' }}
                      />
                    </div>
                    <input type="hidden" {...register('phone')} />
                    {errors?.phone?.message ? <p className={styles.err}>{errors.phone.message}</p> : null}
                    <button type="button" className={styles.linkBtn} onClick={() => stopEditing('phone')} style={{ marginTop: 8 }}>
                      Cancel
                    </button>
                  </AlignedCustom>
                ) : (
                  <AlignedCustom label="Phone">
                    <div style={{ position: 'relative' }}>
                      <div className={styles.readInput} style={{ paddingRight: 40, display: 'flex', alignItems: 'center', gap: 8 }}>
                        {derivedReadOnlyFlagPng ? (
                          <img
                            src={derivedReadOnlyFlagPng}
                            alt="Country flag"
                            title="Country flag"
                            width={20}
                            height={14}
                            loading="lazy"
                            decoding="async"
                            style={{ display: 'block', borderRadius: 2, objectFit: 'cover' }}
                          />
                        ) : null}
                        <span>
                          {derivedPrettyPhone === '—' ? '—' : derivedPrettyPhone}
                        </span>
                      </div>
                      <button 
                        type="button" 
                        className={styles.editIconBtn} 
                        onClick={() => { startEditing('phone'); loadCountries(); }}
                        title="Edit Phone"
                        style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}
                      >
                        <FaEdit size={14} />
                      </button>
                    </div>
                  </AlignedCustom>
                )}
              </div>

              {/* Address - Full Width */}
              <InlineEditField
                label="Address"
                fieldId="address"
                value={user?.address || '—'}
                isEditing={isEditing('address')}
                onEdit={() => { startEditing('address'); loadCountries(); }}
                onCancel={() => stopEditing('address')}
                registerFn={register}
              />

              {/* Country/State/City */}
              {isEditing('location') ? (
                <>
                  <div className={styles.row}>
                    <AlignedCustom label="Country">
                      <select
                        className={styles.input}
                        value={countryName}
                        onChange={handleCountryChange}
                        disabled={!countriesLoaded}
                      >
                        <option value="">
                          {!countriesLoaded ? 'Loading countries...' : 'Select country'}
                        </option>
                        {countries.map(c => (
                          <option key={c.cca2} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </AlignedCustom>

                    <AlignedCustom label="State">
                      <select
                        className={styles.input}
                        value={stateName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setStateName(val);
                          setValue('state', val, { shouldDirty: true });
                          setCityName('');
                          setValue('city', '', { shouldDirty: true });
                        }}
                      >
                        <option value="">{countryName ? 'Select state' : 'Select country first'}</option>
                        {states.map((s) => (
                          <option key={s.name} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                    </AlignedCustom>
                  </div>

                  <div className={styles.row}>
                    <AlignedCustom label="City">
                      <select
                        className={styles.input}
                        value={cityName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCityName(val);
                          setValue('city', val, { shouldDirty: true });
                        }}
                      >
                        <option value="">{stateName ? 'Select city' : 'Select state first'}</option>
                        {cities.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <button type="button" className={styles.linkBtn} onClick={() => stopEditing('location')} style={{ marginTop: 8 }}>
                        Cancel
                      </button>
                    </AlignedCustom>

                    <InlineEditField
                      label="Pincode"
                      fieldId="pincode"
                      value={user?.pincode || '—'}
                      isEditing={isEditing('pincode')}
                      onEdit={() => { startEditing('pincode'); loadCountries(); }}
                      onCancel={() => stopEditing('pincode')}
                      registerFn={register}
                    />
                  </div>
                </>
              ) : (
                <div className={styles.row}>
                  <AlignedCustom label="Country">
                    <div style={{ position: 'relative' }}>
                      <div className={styles.readInput} style={{ paddingRight: 40 }}>
                        {user?.country || '—'}
                      </div>
                      <button 
                        type="button" 
                        className={styles.editIconBtn} 
                        onClick={() => { startEditing('location'); loadCountries(); }}
                        title="Edit Location"
                        style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}
                      >
                        <FaEdit size={14} />
                      </button>
                    </div>
                  </AlignedCustom>
                  <AlignedRead label="State" value={user?.state} />
                </div>
              )}

              {!isEditing('location') && (
                <div className={styles.row}>
                  <AlignedRead label="City" value={user?.city} />
                  <InlineEditField
                    label="Pincode"
                    fieldId="pincode"
                    value={user?.pincode || '—'}
                    isEditing={isEditing('pincode')}
                    onEdit={() => { startEditing('pincode'); loadCountries(); }}
                    onCancel={() => stopEditing('pincode')}
                    registerFn={register}
                  />
                </div>
              )}

              {/* Save Button - Only show when editing */}
              {(hasAnyEditing || selectedFile) && (
                <div className={styles.formCta}>
                  <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={saving || !userId}>
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                  {hasAnyEditing && (
                    <button type="button" className={styles.btn} onClick={clearAllEditing}>
                      Cancel All
                    </button>
                  )}
                </div>
              )}
            </form>
          )}

          {/* My Orders */}
          {active === 'booking' && (
            <div className={styles.bookingWrap}>
              <h2 className={styles.sectionTitle}>My Orders</h2>
              
              {/* Order Status Tabs */}
              <div className={styles.orderTabs}>
                <button 
                  className={`${styles.orderTab} ${orderStatus === 'all' ? styles.orderTabActive : ''}`}
                  onClick={() => setOrderStatus('all')}
                >
                  All Orders
                </button>
                <button 
                  className={`${styles.orderTab} ${orderStatus === 'pending' ? styles.orderTabActive : ''}`}
                  onClick={() => setOrderStatus('pending')}
                >
                  Pending to Confirm
                </button>
                <button 
                  className={`${styles.orderTab} ${orderStatus === 'active' ? styles.orderTabActive : ''}`}
                  onClick={() => setOrderStatus('active')}
                >
                  Active Orders
                </button>
                <button 
                  className={`${styles.orderTab} ${orderStatus === 'past' ? styles.orderTabActive : ''}`}
                  onClick={() => setOrderStatus('past')}
                >
                  Past Orders
                </button>
              </div>
              
              {ordersLoading && (<div className={styles.bookingEmpty}><p>Loading orders…</p></div>)}
              {ordersErr && (<div className={styles.bookingEmpty}><p style={{ color: 'red' }}>{ordersErr}</p></div>)}

              {!ordersLoading && !ordersErr && (!orders || orders.length === 0) && (
                <div className={styles.bookingEmpty}>
                  <div className={styles.bookingIcon}>🧾</div>
                  <h3 className={styles.bookingTitle}>No orders yet</h3>
                  <p className={styles.bookingText}>Go to the fabric page and start shopping.</p>
                  <a href="/fabric" className={styles.btn}>Go to Fabric</a>
                </div>
              )}

              {!ordersLoading && !ordersErr && orders && orders.length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                  <table className={styles.ordersTable}>
                    <thead>
                      <tr>
                        <th>Invoice Number</th>
                        <th>Invoice Date</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o) => (
                        <tr key={o._id}>
                          <td data-label="Invoice Number">
                            <span className={styles.orderNumber}>
                              {o._id}
                            </span>
                          </td>
                          <td data-label="Invoice Date">
                            <span className={styles.orderDate}>
                              {dayjs(o.createdAt).format('MMMM DD, YYYY')}
                            </span>
                          </td>
                          <td data-label="Status">
                            <span className={styles.orderStatus}>
                              {o.status || 'Pending'}
                            </span>
                          </td>
                          <td data-label="Action">
                            <span className={styles.orderAction}>
                              View Details
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

/* ---------------- aligned building blocks ---------------- */
function AlignedRow({ label, children }) {
  return (
    <div className={styles.field}>
      <div className={styles.fieldLabel}>{label}</div>
      <div>{children}</div>
    </div>
  );
}

function AlignedRead({ label, value }) {
  return (
    <AlignedRow label={label}>
      <div className={styles.readInput}>{value || '—'}</div>
    </AlignedRow>
  );
}

function AlignedCustom({ label, children }) {
  return (
    <AlignedRow label={label}>
      {children}
    </AlignedRow>
  );
}

function AlignedField({ id, label, type = 'text', registerFn, error, disabled, note, required }) {
  return (
    <AlignedRow label={<>{label}{required && <span className={styles.required}>*</span>}</>}>
      <div>
        <input id={id} type={type} className={styles.input} disabled={disabled} {...registerFn(id)} />
        {note && <p className={styles.note}>{note}</p>}
        {error && <p className={styles.err}>{error}</p>}
      </div>
    </AlignedRow>
  );
}

/* ---------------- inline edit field ---------------- */
function InlineEditField({ label, fieldId, value, isEditing, onEdit, onCancel, registerFn, error, required }) {
  if (isEditing) {
    return (
      <AlignedRow label={<>{label}{required && <span className={styles.required}>*</span>}</>}>
        <div>
          <input id={fieldId} type="text" className={styles.input} {...registerFn(fieldId)} autoFocus />
          {error && <p className={styles.err}>{error}</p>}
          <button type="button" className={styles.linkBtn} onClick={onCancel} style={{ marginTop: 8 }}>
            Cancel
          </button>
        </div>
      </AlignedRow>
    );
  }

  return (
    <AlignedRow label={label}>
      <div style={{ position: 'relative' }}>
        <div className={styles.readInput} style={{ paddingRight: 40 }}>
          {value}
        </div>
        <button 
          type="button" 
          className={styles.editIconBtn} 
          onClick={onEdit} 
          title={`Edit ${label}`}
          style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}
        >
          <FaEdit size={14} />
        </button>
      </div>
    </AlignedRow>
  );
}

/* ---------------- sidebar tab ---------------- */
function SideTab({ id, label, active, setActive }) {
  const is = active === id;
  return (
    <button
      type="button"
      className={`${styles.sideTab} ${is ? styles.sideTabActive : ''}`}
      onClick={() => setActive(id)}
    >
      {label}
    </button>
  );
}
