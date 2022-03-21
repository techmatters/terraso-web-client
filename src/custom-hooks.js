import { useEffect, useState } from 'react';

export const useScript = url => {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    document.body.appendChild(script);

    script.addEventListener('load', () => {
      setLoading(false);
    });

    return () => {
      document.body.removeChild(script);
    };
  }, [url]);
  return loading;
};
