import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface TicketQrCodeProps {
  payload: string;
}

export default function TicketQrCode({ payload }: TicketQrCodeProps) {
  const [src, setSrc] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setSrc('');
    setError('');

    QRCode.toDataURL(payload, {
      margin: 1,
      width: 240,
      color: {
        dark: '#111827',
        light: '#FFFFFF',
      },
    }).then((value) => {
      if (active) {
        setSrc(value);
      }
    }).catch(() => {
      if (active) {
        setError('QR indisponible');
      }
    });

    return () => {
      active = false;
    };
  }, [payload]);

  return (
    <div className="rounded-[1.75rem] bg-white p-4 shadow-inner">
      {src ? (
        <img alt="QR Ticket Volta" className="h-44 w-44 rounded-xl" src={src} />
      ) : (
        <div className="flex h-44 w-44 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
          {error || 'QR...'}
        </div>
      )}
    </div>
  );
}
