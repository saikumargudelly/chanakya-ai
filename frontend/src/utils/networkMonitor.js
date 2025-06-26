class NetworkMonitor {
  static instance;
  metrics = new Map();
  
  static getInstance() {
    if (!NetworkMonitor.instance) {
      NetworkMonitor.instance = new NetworkMonitor();
    }
    return NetworkMonitor.instance;
  }

  startRequest(url, method = 'GET') {
    const key = `${method}:${url}`;
    this.metrics.set(key, {
      startTime: performance.now(),
      url,
      method
    });
    return key;
  }

  endRequest(key, status) {
    const metric = this.metrics.get(key);
    if (metric) {
      metric.endTime = performance.now();
      metric.duration = metric.endTime - metric.startTime;
      metric.status = status;
      
      // Log slow requests in development
      if (process.env.NODE_ENV === 'development' && metric.duration > 1000) {
        console.warn(`Slow request detected: ${metric.method} ${metric.url} took ${metric.duration.toFixed(2)}ms`);
      }

      // Send metrics in production
      if (process.env.NODE_ENV === 'production') {
        this.sendMetrics(metric);
      }
    }
  }

  private async sendMetrics(metric) {
    try {
      await fetch('/api/metrics/network', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: metric.url,
          method: metric.method,
          duration: metric.duration,
          status: metric.status,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      // Silently fail for metrics
      console.error('Failed to send network metrics:', error);
    }
  }
}

export const networkMonitor = NetworkMonitor.getInstance();