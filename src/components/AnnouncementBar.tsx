import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const KEY = 'sos-announce-dismissed';

const AnnouncementBar = () => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem(KEY) === '1') setShow(false);
  }, []);

  if (!show) return null;

  return (
    <div className="bg-primary text-primary-foreground text-xs md:text-sm">
      <div className="container mx-auto px-4 h-9 flex items-center justify-center relative">
        <p className="text-center font-medium">
          Free delivery within Nyeri on orders over KES 5,000 · Pay via M-Pesa
        </p>
        <button
          aria-label="Dismiss announcement"
          onClick={() => {
            sessionStorage.setItem(KEY, '1');
            setShow(false);
          }}
          className="absolute right-3 p-1 hover:bg-primary-dark rounded"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default AnnouncementBar;