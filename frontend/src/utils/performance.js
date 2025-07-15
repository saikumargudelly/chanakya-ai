import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

const vitalsCallback = (metric) => {
  // Customize this function to send metrics to your analytics service
  console.log(metric);
  
  // Example: Send to analytics endpoint
  if (process.env.NODE_ENV === 'production') {
    try {
      const body = JSON.stringify({
        ...metric,
        timestamp: new Date().getTime(),
        environment: process.env.NODE_ENV
      });
      
      navigator.sendBeacon('/api/analytics/vitals', body);
    } catch (e) {
      console.error('Failed to send vitals:', e);
    }
  }
};

export function reportWebVitals() {
  getCLS(vitalsCallback);
  getFID(vitalsCallback);
  getFCP(vitalsCallback);
  getLCP(vitalsCallback);
  getTTFB(vitalsCallback);
}