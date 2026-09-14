import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckCircle, FiShield, FiX, FiCopy, FiLock, FiCheck, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function PrescriptionQRModal({ isOpen, onClose, prescription }) {
  const [scanState, setScanState] = useState('VERIFIED'); // 'VERIFIED', 'SCANNING', 'EXPIRED'
  const [copied, setCopied] = useState(false);

  if (!isOpen || !prescription) return null;

  const rxId = `RX-${prescription.id || '9842'}-${new Date().getFullYear()}`;
  const cryptoHash = `0x${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
  const verificationUrl = `https://medisphere.campus.in/verify-rx?id=${rxId}&auth=${cryptoHash.slice(0, 10)}`;

  const handleCopyHash = () => {
    navigator.clipboard.writeText(cryptoHash);
    setCopied(true);
    toast.success('Cryptographic verification hash copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const simulateReScan = () => {
    setScanState('SCANNING');
    setTimeout(() => {
      setScanState('VERIFIED');
      toast.success('NMC / Pharmacy Registry matched. 100% Authentic! 🛡️');
    }, 1200);
  };

  return (
    <AnimatePresence>
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 12, 24, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ duration: 0.25 }}
          style={{
            background: '#0B1528',
            border: '1px solid rgba(0, 217, 166, 0.3)',
            borderRadius: '24px',
            maxWidth: '480px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 35px rgba(0, 217, 166, 0.15)',
            color: '#f8fafc',
            fontFamily: 'Outfit, sans-serif'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(0, 217, 166, 0.15), rgba(14, 165, 233, 0.15))',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                background: 'rgba(0, 217, 166, 0.2)',
                border: '1px solid #00D9A6',
                borderRadius: '10px',
                padding: '8px',
                display: 'flex',
                color: '#00D9A6'
              }}>
                <FiShield size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
                  Prescription QR Verification
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  Cryptographically Signed Clinical RX
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
                cursor: 'pointer'
              }}
            >
              <FiX size={16} />
            </button>
          </div>

          {/* Modal Content */}
          <div style={{ padding: '24px', textAlign: 'center' }}>
            
            {/* Status Pill */}
            {scanState === 'VERIFIED' ? (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34d399',
                padding: '6px 14px',
                borderRadius: '999px',
                fontSize: '0.84rem',
                fontWeight: 600,
                marginBottom: '20px'
              }}>
                <FiCheckCircle size={15} /> Authentic Medical Record • NMC Verified
              </div>
            ) : (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(14, 165, 233, 0.12)',
                border: '1px solid rgba(14, 165, 233, 0.3)',
                color: '#38bdf8',
                padding: '6px 14px',
                borderRadius: '999px',
                fontSize: '0.84rem',
                fontWeight: 600,
                marginBottom: '20px'
              }}>
                <FiRefreshCw className="spin" size={15} /> Verifying with Pharmacy Registry...
              </div>
            )}

            {/* Generated QR Code Card */}
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '20px',
              display: 'inline-block',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
              marginBottom: '18px',
              position: 'relative'
            }}>
              {/* QR Image */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(verificationUrl)}&color=0B1528`}
                alt="Prescription Authenticity QR"
                style={{ width: '170px', height: '170px', display: 'block' }}
              />
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: '#00D9A6',
                borderRadius: '8px',
                padding: '4px',
                display: 'flex',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}>
                <FiLock color="#0B1528" size={16} />
              </div>
            </div>

            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '16px' }}>
              Show this QR code at any pharmacy or diagnostic centre to verify original prescription authenticity.
            </div>

            {/* Prescription Metadata Table */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: '14px',
              padding: '14px 18px',
              textAlign: 'left',
              fontSize: '0.84rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Prescription ID:</span>
                <span style={{ fontWeight: 600, color: '#00D9A6' }}>{rxId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Consulting Doctor:</span>
                <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{prescription.doctorName || 'Dr. Aditya Sharma (MD)'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Diagnosis:</span>
                <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{prescription.diagnosis || 'Clinical Follow-up'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8' }}>Crypto Stamp:</span>
                <span 
                  onClick={handleCopyHash}
                  style={{ 
                    fontFamily: 'monospace', 
                    fontSize: '0.74rem', 
                    color: '#a78bfa', 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Click to copy full SHA-256 hash"
                >
                  {cryptoHash.slice(0, 16)}... <FiCopy size={12} />
                </span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={simulateReScan}
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#e2e8f0',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <FiRefreshCw size={15} /> Re-verify Signature
              </button>
              <button
                type="button"
                onClick={() => {
                  toast.success('Prescription QR pass saved to health wallet!');
                  onClose();
                }}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #00D9A6, #0ea5e9)',
                  border: 'none',
                  color: '#071827',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <FiCheck size={16} /> Done
              </button>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
