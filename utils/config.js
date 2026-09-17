const trimTrailingSlash = (value) => value.replace(/\/$/, '');

export const API_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
);

export const MEDIA_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_MEDIA_BASE_URL || 'http://127.0.0.1:9000'
);

export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:9090/ws';

export const mediaUrl = (url) => {
  if (!url || /^https?:\/\//.test(url)) return url || '';
  return MEDIA_BASE_URL + (url.startsWith('/') ? '' : '/') + url;
};

export const paymentUrl = (orderNo) =>
  `${API_BASE_URL}/api/order/alipay/pay?orderNo=${encodeURIComponent(orderNo)}`;
