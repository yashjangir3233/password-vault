import { useState } from 'react';
import API from './api';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [show2FA, setShow2FA] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    setErrorMessage(''); // Clear previous errors
    try {
      const res = await API.post('/auth/login', { email, password, token });
      console.log('this is from local',res)
      localStorage.setItem('token', res.data.token);
      onLogin(); // navigate to dashboard
    } catch (err) {
      console.log('this is error',err)
      if (err.response?.data?.msg === '2FA token invalid') {
        setErrorMessage('Invalid 2FA code.');
      } else if (err.response?.status === 401 && !token) {
        // This block is for initial 2FA request, not an error per se
        try {
          const res = await API.post('/auth/login', { email, password, token: '000000' });
          if (res.data?.msg === '2FA token invalid') {
            setShow2FA(true);
            // setUserId(res.data.userId); // userId is not used in this component
          }
        } catch (innerErr) {
          setErrorMessage('Login failed. Please check your credentials.');
        }
      } else {
        setErrorMessage('Login failed. Please check your credentials.');
      }
    }
  };

  return (
    <div style={{
      backgroundColor: '#1a1a1a',
      color: '#e0e0e0',
      minHeight: '100vh',
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <h2 style={{ color: '#ffffff', marginBottom: '30px', fontSize: '2em' }}>Login</h2>

      {errorMessage && (
        <div style={{
          backgroundColor: '#880000',
          color: '#ffffff',
          padding: '10px',
          borderRadius: '5px',
          marginBottom: '20px',
          width: '100%',
          maxWidth: '400px',
          textAlign: 'center',
        }}>
          {errorMessage}
        </div>
      )}

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        width: '100%',
        maxWidth: '400px',
        padding: '25px',
        backgroundColor: '#2a2a2a',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
      }}>
        <input
          style={{
            padding: '12px',
            borderRadius: '5px',
            border: '1px solid #444444',
            backgroundColor: '#3a3a3a',
            color: '#e0e0e0',
            fontSize: '1em',
          }}
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div style={{ position: 'relative' }}>
          <input
            style={{
              padding: '12px',
              borderRadius: '5px',
              border: '1px solid #444444',
              backgroundColor: '#3a3a3a',
              color: '#e0e0e0',
              fontSize: '1em',
              width: '100%',
              boxSizing: 'border-box',
              paddingRight: '40px', // Space for the icon
            }}
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#888888',
              padding: '5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.54 18.54 0 0 1 2.21-2.94m5.13-5.13A10.07 10.07 0 0 1 12 4c7 0 11 8 11 8a18.54 18.54 0 0 1-2.21 2.94m-5.13 5.13L2 22l2-2"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
            )}
          </button>
        </div>

        {show2FA && (
          <input
            style={{
              padding: '12px',
              borderRadius: '5px',
              border: '1px solid #444444',
              backgroundColor: '#3a3a3a',
              color: '#e0e0e0',
              fontSize: '1em',
            }}
            placeholder="2FA Code"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        )}
        <button
          onClick={handleLogin}
          style={{
            padding: '12px 20px',
            borderRadius: '5px',
            border: 'none',
            backgroundColor: '#666666',
            color: '#ffffff',
            fontSize: '1.1em',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease',
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#777777'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#666666'}
        >
          Login
        </button>
      </div>
    </div>
  );
}
