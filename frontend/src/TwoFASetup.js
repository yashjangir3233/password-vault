import { useEffect, useState } from 'react';
import API from './api';

export default function TwoFASetup({ userId }) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    async function fetchQR() {
      const res = await API.get(`/auth/2fa/setup?userId=${userId}`);
      setQrCodeUrl(res.data.qrCodeUrl);
    }
    fetchQR();
  }, [userId]);

  const handleVerify = async () => {
    try {
      await API.post('/auth/2fa/verify', { userId, token });
      alert('2FA Enabled!');
    } catch {
      alert('Invalid token');
    }
  };

  return (
    <div>
      <h2>Setup 2FA</h2>
      <img src={qrCodeUrl} alt="Scan QR" />
      <input placeholder="Enter code" value={token} onChange={(e) => setToken(e.target.value)} />
      <button onClick={handleVerify}>Verify</button>
    </div>
  );
}
