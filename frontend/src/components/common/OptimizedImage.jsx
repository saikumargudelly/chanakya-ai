import React, { useState, useEffect } from 'react';

const OptimizedImage = ({ 
  src, 
  alt, 
  className = '', 
  width, 
  height,
  loading = 'lazy',
  placeholder = 'blur'
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => setLoaded(true);
    img.onerror = () => setError(true);
  }, [src]);

  const placeholderStyles = {
    filter: 'blur(10px)',
    transition: 'filter 0.3s ease-out'
  };

  if (error) {
    return <div className={`bg-gray-200 ${className}`} style={{ width, height }} />;
  }

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      className={`${className} ${!loaded && placeholder === 'blur' ? 'blur-sm' : ''}`}
      style={loaded ? {} : placeholderStyles}
      onLoad={() => setLoaded(true)}
      onError={() => setError(true)}
    />
  );
};

export default React.memo(OptimizedImage);