import { useEffect, useState } from 'react';
import API from './api';

export default function Vault() {
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({ site: '', username: '', password: '', masterPassword: '' });
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [revealed, setRevealed] = useState({}); // Map of entry ID → decrypted password
  const [errorMessage, setErrorMessage] = useState('');
  const [showRevealMasterPasswordInput, setShowRevealMasterPasswordInput] = useState(false);
  const [currentRevealId, setCurrentRevealId] = useState(null);
  const [revealMasterPasswordInput, setRevealMasterPasswordInput] = useState('');
  const [copiedEntryId, setCopiedEntryId] = useState(null);
  const [actionAfterReveal, setActionAfterReveal] = useState(null);

  const [showEditMasterPasswordModal, setShowEditMasterPasswordModal] = useState(false);
  const [currentEntryToEdit, setCurrentEntryToEdit] = useState(null);
  const [editMasterPasswordAttempt, setEditMasterPasswordAttempt] = useState('');
  const [editPasswordError, setEditPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showMasterPassword, setShowMasterPassword] = useState(false);
  const [isPasswordCopied, setIsPasswordCopied] = useState(false);
  const [showRevealPassword, setShowRevealPassword] = useState(false);

  useEffect(() => {
    fetchVault();
  }, []);

  function handleLogout() {
    localStorage.removeItem('token');
    window.location.reload();
    // onLogout();
  }

  function generatePassword() {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';
    let password = '';
    for (let i = 0, n = charset.length; i < 16; ++i) {
      password += charset.charAt(Math.floor(Math.random() * n));
    }
    setForm({ ...form, password });
    setShowPassword(true)
  }

  async function copyGeneratedPassword() {
    if (!form.password) return;
    try {
      await navigator.clipboard.writeText(form.password);
      setIsPasswordCopied(true);
      setTimeout(() => setIsPasswordCopied(false), 2000); // Reset after 2 seconds
    } catch (error) {
      setErrorMessage("Failed to copy password.");
    }
  }

  async function fetchVault() {
    try {
      const res = await API.get('/vault');
      setEntries(res.data);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage('Failed to fetch vault entries.');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.site || !form.username || !form.password || !form.masterPassword) {
      setErrorMessage('All fields are required.');
      return;
    }

    try {
      if (editId) {
        await API.put(`/vault/${editId}`, form);
      } else {
        await API.post('/vault/add', form);
      }
      setForm({ site: '', username: '', password: '', masterPassword: '' });
      setEditId(null);
      fetchVault();
      setErrorMessage('');
    } catch (error) {
      setErrorMessage('Failed to save entry. Check your master password.');
    }
  }

  function startEdit(entry) {
    setCurrentEntryToEdit(entry);
    setShowEditMasterPasswordModal(true);
    setEditMasterPasswordAttempt('');
    setEditPasswordError(''); // Clear previous error
    setErrorMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleEditMasterPasswordVerification() {
    if (!editMasterPasswordAttempt) {
      setEditPasswordError('Master password cannot be empty.');
      return;
    }
    try {
      // Attempt to decrypt to verify master password
      const res = await API.post(`/vault/decrypt/${currentEntryToEdit._id}`, { masterPassword: editMasterPasswordAttempt });
      setForm({
        site: currentEntryToEdit.site,
        username: currentEntryToEdit.username,
        password: res.data.password, // Populate with decrypted password
        masterPassword: '', // Keep master password field empty for security
      });
      setEditId(currentEntryToEdit._id);
      setShowEditMasterPasswordModal(false);
      setCurrentEntryToEdit(null);
      setEditMasterPasswordAttempt('');
      setEditPasswordError(''); // Clear edit specific error
      setErrorMessage(''); // Clear general error
    } catch (error) {
      setEditPasswordError('Incorrect master password for editing.'); // Set edit specific error
    }
  }

  async function deleteEntry(id) {
    try {
      await API.delete(`/vault/${id}`);
      fetchVault();
      setErrorMessage('');
    } catch (error) {
      setErrorMessage('Failed to delete entry.');
    }
  }

  function revealPassword(id) {
    setCurrentRevealId(id);
    setShowRevealMasterPasswordInput(true);
    setRevealMasterPasswordInput('');
    setErrorMessage('');
  }

  async function handleRevealMasterPasswordSubmit() {
    if (!revealMasterPasswordInput) {
      setErrorMessage('Master password cannot be empty.');
      return;
    }
    try {
      const res = await API.post(`/vault/decrypt/${currentRevealId}`, { masterPassword: revealMasterPasswordInput });
      const password = res.data.password;
      setRevealed({ ...revealed, [currentRevealId]: password });
      setShowRevealMasterPasswordInput(false);
      setRevealMasterPasswordInput('');
      setErrorMessage('');

      if (actionAfterReveal && actionAfterReveal.type === 'copy' && actionAfterReveal.entryId === currentRevealId) {
        await navigator.clipboard.writeText(password);
        setCopiedEntryId(currentRevealId);
        setTimeout(() => setCopiedEntryId(null), 2000);
        setActionAfterReveal(null);
      }
    } catch (error) {
      setErrorMessage('Incorrect master password.');
      setActionAfterReveal(null);
    }
  }

  async function copyToClipboard(id) {
    if (revealed[id]) {
      try {
        await navigator.clipboard.writeText(revealed[id]);
        setCopiedEntryId(id);
        setTimeout(() => setCopiedEntryId(null), 2000);
        setErrorMessage('');
      } catch (error) {
        setErrorMessage("Failed to copy password.");
      }
    } else {
      // Set up the action and open the modal
      setActionAfterReveal({ type: 'copy', entryId: id });
      setCurrentRevealId(id);
      setShowRevealMasterPasswordInput(true);
      setRevealMasterPasswordInput('');
      setErrorMessage('');
    }
  }

  const filtered = entries.filter((e) =>
    e.site.toLowerCase().includes(search.toLowerCase()) ||
    e.username.toLowerCase().includes(search.toLowerCase())
  );

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
    }}>
      <h2 style={{ color: '#ffffff', marginBottom: '30px', fontSize: '2em' }}>Your Vault</h2>
      <button
        onClick={handleLogout}
        style={{
          padding: '10px 20px',
          borderRadius: '5px',
          border: 'none',
          backgroundColor: '#880000',
          color: '#ffffff',
          fontSize: '1em',
          cursor: 'pointer',
          transition: 'background-color 0.3s ease',
          position: 'absolute',
          top: '20px',
          right: '20px',
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#aa0000'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#880000'}
      >
        Logout
      </button>

      {errorMessage && (
        <div style={{
          backgroundColor: '#880000',
          color: '#ffffff',
          padding: '10px',
          borderRadius: '5px',
          marginBottom: '20px',
          width: '100%',
          maxWidth: '500px',
          textAlign: 'center',
        }}>
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        width: '100%',
        maxWidth: '500px',
        padding: '25px',
        backgroundColor: '#2a2a2a',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
        marginBottom: '30px',
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
          placeholder="Site"
          value={form.site}
          onChange={(e) => setForm({ ...form, site: e.target.value })}
        />
        <input
          style={{
            padding: '12px',
            borderRadius: '5px',
            border: '1px solid #444444',
            backgroundColor: '#3a3a3a',
            color: '#e0e0e0',
            fontSize: '1em',
          }}
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flexGrow: 1 }}>
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
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
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
          <button
            type="button"
            onClick={generatePassword}
            style={{
              padding: '12px 20px',
              borderRadius: '5px',
              border: 'none',
              backgroundColor: '#005500',
              color: '#ffffff',
              fontSize: '1em',
              cursor: 'pointer',
              transition: 'background-color 0.3s ease',
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#007700'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#005500'}
          >
            Generate
          </button>
          <button
            type="button"
            onClick={copyGeneratedPassword}
            disabled={!form.password}
            style={{
              padding: '12px',
              borderRadius: '5px',
              border: 'none',
              backgroundColor: form.password ? '#000088' : '#555555',
              color: '#ffffff',
              cursor: form.password ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseOver={(e) => { if (form.password) e.currentTarget.style.backgroundColor = '#0000aa'; }}
            onMouseOut={(e) => { if (form.password) e.currentTarget.style.backgroundColor = '#000088'; }}
            title="Copy Password"
          >
            {isPasswordCopied ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            )}
          </button>
        </div>
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
            type={showMasterPassword ? 'text' : 'password'}
            placeholder="Master Password"
            value={form.masterPassword}
            onChange={(e) => setForm({ ...form, masterPassword: e.target.value })}
          />
          <button
            type="button"
            onClick={() => setShowMasterPassword(!showMasterPassword)}
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
            {showMasterPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.54 18.54 0 0 1 2.21-2.94m5.13-5.13A10.07 10.07 0 0 1 12 4c7 0 11 8 11 8a18.54 18.54 0 0 1-2.21 2.94m-5.13 5.13L2 22l2-2"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
            )}
          </button>
        </div>
        <button
          type="submit"
          style={{
            padding: '12px 20px',
            borderRadius: '5px',
            border: 'none',
            backgroundColor: '#666666',
            color: '#ffffff',
            fontSize: '1.1em',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#777777'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#666666'}
        >
          {editId ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              Update
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add
            </>
          )}
        </button>
      </form>

      <div style={{ position: 'relative', width: '100%', maxWidth: '500px', marginBottom: '20px' }}>
        <input
          style={{
            padding: '12px 12px 12px 40px', /* Increased left padding for icon */
            borderRadius: '5px',
            border: '1px solid #444444',
            backgroundColor: '#3a3a3a',
            color: '#e0e0e0',
            fontSize: '1em',
            width: '100%',
            boxSizing: 'border-box', /* Include padding in width */
          }}
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888888' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      </div>

      <ul style={{
        listStyle: 'none',
        padding: '0',
        width: '100%',
        maxWidth: '700px',
      }}>
        {filtered.map((entry) => (
          <li key={entry._id} style={{
            backgroundColor: '#2a2a2a',
            padding: '15px 20px',
            marginBottom: '10px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            alignItems: 'flex-start',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              width: '100%',
              flexWrap: 'wrap',
              gap: '10px',
            }}>
              <strong style={{ color: '#ffffff', fontSize: '1.1em' }}>{entry.site}</strong>
              <span style={{ color: '#cccccc' }}>{entry.username}</span>
            </div>
            <div style={{
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap',
            }}>
              <button
                onClick={() => startEdit(entry)}
                style={{
                  padding: '8px 15px',
                  borderRadius: '5px',
                  border: 'none',
                  backgroundColor: '#555555',
                  color: '#ffffff',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#666666'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#555555'}
                title="Edit"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </button>
              <button
                onClick={() => deleteEntry(entry._id)}
                style={{
                  padding: '8px 15px',
                  borderRadius: '5px',
                  border: 'none',
                  backgroundColor: '#880000',
                  color: '#ffffff',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#aa0000'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#880000'}
                title="Delete"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
              <button
                onClick={() => revealPassword(entry._id)}
                style={{
                  padding: '8px 15px',
                  borderRadius: '5px',
                  border: 'none',
                  backgroundColor: '#005500',
                  color: '#ffffff',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#007700'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#005500'}
                title="Reveal Password"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
              <button
                onClick={() => copyToClipboard(entry._id)}
                style={{
                  padding: '8px 15px',
                  borderRadius: '5px',
                  border: 'none',
                  backgroundColor: '#000088',
                  color: '#ffffff',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0000aa'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#000088'}
                title="Copy Password"
              >
                {copiedEntryId === entry._id ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                )}
              </button>
            </div>
            {revealed[entry._id] && (
              <div style={{
                marginTop: '10px',
                padding: '8px',
                backgroundColor: '#3a3a3a',
                borderRadius: '5px',
                width: '100%',
                wordBreak: 'break-all',
              }}>
                Password: <code style={{ color: '#e0e0e0' }}>{revealed[entry._id]}</code>
              </div>
            )}
          </li>
        ))}
      </ul>


      {showRevealMasterPasswordInput && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: '1000',
        }}>
          <div style={{
            backgroundColor: '#2a2a2a',
            padding: '30px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            width: '90%',
            maxWidth: '400px',
          }}>
            <h3 style={{ color: '#ffffff', marginBottom: '10px' }}>Enter Master Password to Reveal</h3>
            {errorMessage && (
              <div style={{
                backgroundColor: '#880000',
                color: '#ffffff',
                padding: '8px',
                borderRadius: '5px',
                marginBottom: '10px',
                textAlign: 'center',
              }}>
                {errorMessage}
              </div>
            )}
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type={showRevealPassword ? 'text' : 'password'}
                placeholder="Master Password"
                value={revealMasterPasswordInput}
                onChange={(e) => setRevealMasterPasswordInput(e.target.value)}
                style={{
                  padding: '12px',
                  borderRadius: '5px',
                  border: '1px solid #444444',
                  backgroundColor: '#3a3a3a',
                  color: '#e0e0e0',
                  fontSize: '1em',
                  width: '100%',
                  boxSizing: 'border-box',
                  paddingRight: '40px',
                }}
              />
              <button
                type="button"
                onClick={() => setShowRevealPassword(!showRevealPassword)}
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
                {showRevealPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.54 18.54 0 0 1 2.21-2.94m5.13-5.13A10.07 10.07 0 0 1 12 4c7 0 11 8 11 8a18.54 18.54 0 0 1-2.21 2.94m-5.13 5.13L2 22l2-2"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleRevealMasterPasswordSubmit}
                style={{
                  padding: '10px 20px',
                  borderRadius: '5px',
                  border: 'none',
                  backgroundColor: '#005500',
                  color: '#ffffff',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s ease',
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#007700'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#005500'}
              >
                Submit
              </button>
              <button
                onClick={() => {
                  setShowRevealMasterPasswordInput(false);
                  setActionAfterReveal(null);
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '5px',
                  border: 'none',
                  backgroundColor: '#555555',
                  color: '#ffffff',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s ease',
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#666666'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#555555'}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditMasterPasswordModal && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: '1000',
        }}>
          <div style={{
            backgroundColor: '#2a2a2a',
            padding: '30px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            width: '90%',
            maxWidth: '400px',
          }}>
            <h3 style={{ color: '#ffffff', marginBottom: '10px' }}>Enter Master Password to Edit</h3>
            {editPasswordError && (
              <div style={{
                backgroundColor: '#880000',
                color: '#ffffff',
                padding: '8px',
                borderRadius: '5px',
                marginBottom: '10px',
                textAlign: 'center',
              }}>
                {editPasswordError}
              </div>
            )}
            <input
              type="password"
              placeholder="Master Password"
              value={editMasterPasswordAttempt}
              onChange={(e) => setEditMasterPasswordAttempt(e.target.value)}
              style={{
                padding: '12px',
                borderRadius: '5px',
                border: '1px solid #444444',
                backgroundColor: '#3a3a3a',
                color: '#e0e0e0',
                fontSize: '1em',
              }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleEditMasterPasswordVerification}
                style={{
                  padding: '10px 20px',
                  borderRadius: '5px',
                  border: 'none',
                  backgroundColor: '#005500',
                  color: '#ffffff',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s ease',
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#007700'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#005500'}
              >
                Submit
              </button>
              <button
                onClick={() => setShowEditMasterPasswordModal(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '5px',
                  border: 'none',
                  backgroundColor: '#555555',
                  color: '#ffffff',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s ease',
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#666666'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#555555'}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
