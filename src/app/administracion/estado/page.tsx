'use client'
import { useState, useEffect } from 'react';

const LoadBalancerTestPage: React.FC = () => {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [htmlContent, setHtmlContent] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    const fetchHtml = async () => {
      try {
        const res = await fetch(`/proxy?nocache=${Date.now()}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        });
        if (isMounted && res.ok) {
          const text = await res.text();
          setHtmlContent(text);
          setLastUpdated(new Date());
        }
      } catch (e) {
        console.error('Error fetching HTML:', e);
      }
    };

    fetchHtml();
    const interval = setInterval(fetchHtml, 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <section>
      <div
        style={{
          textAlign: 'center',
          marginTop: '20px',
        }}
        suppressHydrationWarning
      >
        Última actualización: {lastUpdated.toLocaleTimeString()}
      </div>
      <div
        style={{ width: '100%', minHeight: '500px', border: '1px solid #ccc', marginTop: '10px' }}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        suppressHydrationWarning
      />
    </section>
  );
};

export default LoadBalancerTestPage;
