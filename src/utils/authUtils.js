import { useSelector } from 'react-redux';
import { getReturnToFromCurrentUrl, saveReturnTo } from '@/utils/authReturn';

const hasClientSession = () => {
  if (typeof window === 'undefined') return false;
  const sid = localStorage.getItem('sessionId');
  const uid = localStorage.getItem('userId');
  return !!(sid || uid);
};

export const useAuthAction = () => {
  const { user } = useSelector((state) => state.auth || {});

  const requireAuth = (action) => {
    return async (...args) => {
      const authed = !!user || hasClientSession();
      
      if (!authed) {
        try {
          const returnTo = getReturnToFromCurrentUrl(); // ✅ includes ?query + #hash
          saveReturnTo(returnTo);
          // ✅ use returnTo param (not redirect)
          window.location.href = `/login?returnTo=${encodeURIComponent(returnTo)}`;
        } catch {
          window.location.href = '/login';
        }
        return false;
      }

      if (typeof action === 'function') {
        return await action(...args);
      }

      return true;
    };
  };

  return {
    requireAuth,
    isAuthenticated: !!user || hasClientSession(),
  };
};

export const formatProductForCart = (product) => ({
  ...product,
  id: product._id || product.id,
  _id: product._id || product.id,
  title: product.title || product.name || 'Product',
  price: parseFloat(product.price) || 0,
  quantity: product.quantity || 1,
  orderQuantity: 1,
  image: product.image || product.imageUrl || '',
});

export const formatProductForWishlist = (product) => ({
  ...product,
  id: product._id || product.id,
  _id: product._id || product.id,
  title: product.title || product.name || 'Product',
  price: parseFloat(product.price) || 0,
  image: product.image || product.imageUrl || '',
});
