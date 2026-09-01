import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// ⚠️ ACTUALIZA CON LA URL DE CLOUDFLARE PARA BORISOCIAL ⚠️
const API_URL = "https://cent-eye-richard-affects.trycloudflare.com";

function App() {
  const [isOnline, setIsOnline] = useState(false);

  // Estados de Wallet
  const [walletAddress, setWalletAddress] = useState(null);
  const [walletNetwork, setWalletNetwork] = useState(null);
  const [mostrarModalWallet, setMostrarModalWallet] = useState(false);

  // Estados del Perfil
  const [perfil, setPerfil] = useState({ username: '', bio: '', avatar_url: '' });
  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [formPerfil, setFormPerfil] = useState({ username: '', bio: '', avatar_url: '' });

  // Estados de Mensajería
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const chatBottomRef = useRef(null);

  // Verificar backend
  const verificarEstado = async () => {
    try {
      const res = await fetch(`${API_URL}/api/health`);
      if (res.ok) {
        setIsOnline(true);
        cargarMensajes();
      } else {
        setIsOnline(false);
      }
    } catch {
      setIsOnline(false);
    }
  };

  const cargarMensajes = async () => {
    try {
      const res = await fetch(`${API_URL}/api/mensajes`);
      if (res.ok) {
        const data = await res.json();
        setMensajes(data);
      }
    } catch (err) {
      console.error("Error al cargar mensajes:", err);
    }
  };

  const cargarPerfil = async (address) => {
    try {
      const res = await fetch(`${API_URL}/api/perfil/${address}`);
      if (res.ok) {
        const data = await res.json();
        setPerfil(data);
        setFormPerfil({ username: data.username, bio: data.bio || '', avatar_url: data.avatar_url || '' });
      }
    } catch (err) {
      console.error("Error al cargar perfil:", err);
    }
  };

  useEffect(() => {
    verificarEstado();
    const interval = setInterval(verificarEstado, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  // Conexiones Web3
  const conectarPhantom = async () => {
    if (window.solana && window.solana.isPhantom) {
      try {
        const resp = await window.solana.connect();
        const addr = resp.publicKey.toString();
        setWalletAddress(addr);
        setWalletNetwork("Solana (Phantom)");
        cargarPerfil(addr);
        setMostrarModalWallet(false);
      } catch (err) {
        alert("Error Phantom: " + err.message);
      }
    } else {
      window.open("https://phantom.app/", "_blank");
    }
  };

  const conectarSolflare = async () => {
    if (window.solflare && window.solflare.isSolflare) {
      try {
        await window.solflare.connect();
        const addr = window.solflare.publicKey.toString();
        setWalletAddress(addr);
        setWalletNetwork("Solana (Solflare)");
        cargarPerfil(addr);
        setMostrarModalWallet(false);
      } catch (err) {
        alert("Error Solflare: " + err.message);
      }
    } else {
      window.open("https://solflare.com/", "_blank");
    }
  };

  const conectarCoinbase = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
          const addr = accounts[0];
          setWalletAddress(addr);
          setWalletNetwork("Base / EVM");
          cargarPerfil(addr);
          setMostrarModalWallet(false);
        }
      } catch (err) {
        alert("Error Coinbase/EVM: " + err.message);
      }
    } else {
      window.open("https://www.coinbase.com/wallet", "_blank");
    }
  };

  const guardarPerfilHandler = async (e) => {
    e.preventDefault();
    if (!walletAddress) return;

    try {
      const res = await fetch(`${API_URL}/api/perfil`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: walletAddress,
          username: formPerfil.username,
          bio: formPerfil.bio,
          avatar_url: formPerfil.avatar_url,
          red: walletNetwork
        })
      });

      if (res.ok) {
        const data = await res.json();
        setPerfil(data.perfil);
        setEditandoPerfil(false);
        cargarMensajes();
      }
    } catch (err) {
      console.error("Error al guardar perfil:", err);
    }
  };

  const enviarMensajeHandler = async (e) => {
    e.preventDefault();
    if (!nuevoMensaje.trim() || !walletAddress) return;

    try {
      await fetch(`${API_URL}/api/mensajes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: walletAddress,
          mensaje: nuevoMensaje
        })
      });
      setNuevoMensaje("");
      cargarMensajes();
    } catch (err) {
      console.error("Error enviando mensaje:", err);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '15px', fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif' }}>
      
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0088cc', color: '#fff', padding: '15px 20px', borderRadius: '10px' }}>
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>✈️ BoriSocial</h2>
        <div>
          {walletAddress ? (
            <button onClick={() => setEditandoPerfil(!editandoPerfil)} style={{ backgroundColor: '#fff', color: '#0088cc', border: 'none', padding: '8px 14px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}>
              👤 {perfil.username || walletAddress.slice(0, 6)}
            </button>
          ) : (
            <button onClick={() => setMostrarModalWallet(true)} style={{ backgroundColor: '#00b0ff', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}>
              🔗 Conectar Wallet
            </button>
          )}
        </div>
      </header>

      {/* Panel de Edición de Perfil */}
      {editandoPerfil && (
        <div style={{ backgroundColor: '#f0f4f8', padding: '20px', borderRadius: '10px', marginTop: '15px', border: '1px solid #bce0fd' }}>
          <h3>Editar Perfil Web3</h3>
          <p style={{ fontSize: '12px', color: '#666' }}>Billetera vinculada: <strong>{walletAddress}</strong></p>
          <form onSubmit={guardarPerfilHandler} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input 
              type="text" 
              placeholder="Nombre de Usuario / Apodo" 
              value={formPerfil.username} 
              onChange={e => setFormPerfil({ ...formPerfil, username: e.target.value })} 
              required 
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
            />
            <input 
              type="text" 
              placeholder="URL Foto de Perfil (Opcional)" 
              value={formPerfil.avatar_url} 
              onChange={e => setFormPerfil({ ...formPerfil, avatar_url: e.target.value })} 
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
            />
            <textarea 
              placeholder="Biografía..." 
              value={formPerfil.bio} 
              onChange={e => setFormPerfil({ ...formPerfil, bio: e.target.value })} 
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', height: '60px' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" style={{ backgroundColor: '#28a745', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', flex: 1, fontWeight: 'bold' }}>Guardar Perfil</button>
              <button type="button" onClick={() => setEditandoPerfil(false)} style={{ backgroundColor: '#dc3545', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer' }}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Canal de Chat Estilo Telegram */}
      <main style={{ marginTop: '20px', border: '1px solid #e0e0e0', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#e6ebeef0' }}>
        <div style={{ backgroundColor: '#fff', padding: '12px 20px', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>💬 Canal Global</strong>
          <small style={{ color: isOnline ? '#28a745' : '#dc3545', fontWeight: 'bold' }}>{isOnline ? "🟢 Servidor Conectado" : "🔴 Fuera de Línea"}</small>
        </div>

        <div style={{ height: '400px', overflowY: 'auto', padding: '15px' }}>
          {mensajes.map((m) => {
            const esMio = m.wallet === walletAddress;
            return (
              <div key={m.id} style={{ display: 'flex', justifyContent: esMio ? 'flex-end' : 'flex-start', marginBottom: '12px' }}>
                <div style={{ maxWidth: '70%', backgroundColor: esMio ? '#e1ffc7' : '#ffffff', padding: '10px 14px', borderRadius: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    {m.avatar_url && (
                      <img src={m.avatar_url} alt="avatar" style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover' }} />
                    )}
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: esMio ? '#2b7813' : '#0088cc' }}>{m.username}</span>
                    <span style={{ fontSize: '9px', color: '#888' }}>({m.wallet.slice(0, 4)}...{m.wallet.slice(-4)})</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '14px', wordBreak: 'break-word' }}>{m.mensaje}</p>
                  <div style={{ textAlign: 'right', fontSize: '9px', color: '#888', marginTop: '4px' }}>{m.timestamp}</div>
                </div>
              </div>
            );
          })}
          <div ref={chatBottomRef} />
        </div>

        {/* Input para enviar mensaje */}
        <div style={{ padding: '12px', backgroundColor: '#fff', borderTop: '1px solid #ddd' }}>
          {walletAddress ? (
            <form onSubmit={enviarMensajeHandler} style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                placeholder={`Escribe como ${perfil.username || 'Usuario'}...`} 
                value={nuevoMensaje} 
                onChange={e => setNuevoMensaje(e.target.value)} 
                style={{ flex: 1, padding: '12px', borderRadius: '20px', border: '1px solid #ccc' }}
              />
              <button type="submit" style={{ backgroundColor: '#0088cc', color: '#fff', border: 'none', padding: '0 20px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>Enviar</button>
            </form>
          ) : (
            <div style={{ textAlign: 'center', color: '#666', padding: '8px' }}>
              Conecta tu billetera arriba para publicar mensajes en el canal.
            </div>
          )}
        </div>
      </main>

      {/* Modal Conexión Wallet */}
      {mostrarModalWallet && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '12px', width: '300px', textAlign: 'center' }}>
            <h3>Inicia Sesión con Web3</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
              <button onClick={conectarPhantom} style={{ padding: '10px', backgroundColor: '#ab9ff2', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>👻 Phantom (Solana)</button>
              <button onClick={conectarSolflare} style={{ padding: '10px', backgroundColor: '#fc7227', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>☀️ Solflare (Solana)</button>
              <button onClick={conectarCoinbase} style={{ padding: '10px', backgroundColor: '#0052ff', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>🔵 Coinbase / Base</button>
              <button onClick={() => setMostrarModalWallet(false)} style={{ padding: '8px', backgroundColor: '#e0e0e0', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '10px' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;

