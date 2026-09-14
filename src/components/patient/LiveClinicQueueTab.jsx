import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUsers, FiClock, FiCheckCircle, FiAlertCircle, FiRefreshCw, FiVolume2, FiActivity, FiMapPin, FiCalendar } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function LiveClinicQueueTab({ user, studentProfile }) {
  const [selectedDept, setSelectedDept] = useState('general');
  const [userToken, setUserToken] = useState(() => {
    return localStorage.getItem('medisphere_user_active_token') || null;
  });
  const [userTokenDept, setUserTokenDept] = useState(() => {
    return localStorage.getItem('medisphere_user_token_dept') || 'general';
  });
  const [servingTokens, setServingTokens] = useState({
    general: 12,
    dental: 5,
    ortho: 8,
    wellness: 4
  });
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Departments configuration
  const departments = [
    { id: 'general', name: 'General OPD & Dispensary', room: 'Room 101 - Ground Floor', doctor: 'Dr. Aditya Sharma', avgWaitPerPatient: 3, icon: '🩺', color: '#0f766e' },
    { id: 'dental', name: 'Campus Dental Clinic', room: 'Room 105 - Ground Floor', doctor: 'Dr. Neha Mittal', avgWaitPerPatient: 5, icon: '🦷', color: '#042a59' },
    { id: 'ortho', name: 'Orthopedics & Physio', room: 'Room 203 - 1st Floor', doctor: 'Dr. Rajesh Verma', avgWaitPerPatient: 4, icon: '🦴', color: '#ea580c' },
    { id: 'wellness', name: 'Mental Health & Counseling', room: 'Room 304 - 2nd Floor (Quiet Wing)', doctor: 'Dr. Ananya Sen', avgWaitPerPatient: 8, icon: '🧠', color: '#7c3aed' }
  ];

  const currentDeptObj = departments.find(d => d.id === selectedDept) || departments[0];
  const currentServing = servingTokens[selectedDept] || 1;

  // Calculate wait time & patients ahead
  const isUserInThisDept = userToken && userTokenDept === selectedDept;
  const numericUserToken = userToken ? parseInt(userToken.split('-')[1] || '0', 10) : 0;
  const patientsAhead = isUserInThisDept ? Math.max(0, numericUserToken - currentServing) : null;
  const estimatedWaitMins = patientsAhead !== null ? patientsAhead * currentDeptObj.avgWaitPerPatient : null;

  // Simulated queue movement
  useEffect(() => {
    const interval = setInterval(() => {
      setServingTokens(prev => {
        const next = { ...prev };
        const deptKeys = Object.keys(next);
        const randomDept = deptKeys[Math.floor(Math.random() * deptKeys.length)];
        next[randomDept] = next[randomDept] + 1;
        return next;
      });
    }, 45000); // Advances every 45s

    return () => clearInterval(interval);
  }, []);

  const handleGenerateToken = () => {
    const nextTokenNum = (servingTokens[selectedDept] || 10) + Math.floor(Math.random() * 5) + 3;
    const prefix = selectedDept.charAt(0).toUpperCase();
    const tokenString = `${prefix}-${nextTokenNum}`;
    
    setUserToken(tokenString);
    setUserTokenDept(selectedDept);
    localStorage.setItem('medisphere_user_active_token', tokenString);
    localStorage.setItem('medisphere_user_token_dept', selectedDept);

    toast.success(`🎫 Token ${tokenString} Issued for ${currentDeptObj.name}!`, { duration: 4000 });
  };

  const handleCancelToken = () => {
    setUserToken(null);
    localStorage.removeItem('medisphere_user_active_token');
    localStorage.removeItem('medisphere_user_token_dept');
    toast('Token cancelled successfully', { icon: 'ℹ️' });
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)',
        borderRadius: '16px',
        padding: '24px',
        color: '#ffffff',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 10px 25px rgba(15, 118, 110, 0.2)'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
            LIVE DISPENSARY TOKEN SYSTEM
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>Campus Health Centre Live Queue</h2>
          <p style={{ margin: '4px 0 0 0', opacity: 0.9, fontSize: '0.85rem' }}>Track real-time waiting times, skip long queues, and arrive just in time for your turn.</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={() => {
              setServingTokens(prev => ({ ...prev, [selectedDept]: prev[selectedDept] + 1 }));
              toast.success(`Refreshed live queue for ${currentDeptObj.name}`);
            }}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#ffffff',
              padding: '8px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              fontWeight: 600
            }}
          >
            <FiRefreshCw /> Refresh Queue
          </button>
        </div>
      </div>

      {/* Department Selector Tabs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
        marginBottom: '24px'
      }}>
        {departments.map((dept) => {
          const isSelected = selectedDept === dept.id;
          const isUserInDept = userToken && userTokenDept === dept.id;
          const serving = servingTokens[dept.id];

          return (
            <div
              key={dept.id}
              onClick={() => setSelectedDept(dept.id)}
              style={{
                background: isSelected ? '#ffffff' : '#f8fafc',
                border: isSelected ? `2px solid ${dept.color}` : '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isSelected ? '0 8px 20px rgba(0,0,0,0.06)' : 'none',
                position: 'relative'
              }}
            >
              {isUserInDept && (
                <span style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: '#7c3aed',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}>
                  YOUR TOKEN: {userToken}
                </span>
              )}
              <div style={{ fontSize: '1.6rem', marginBottom: '6px' }}>{dept.icon}</div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a', marginBottom: '2px' }}>{dept.name}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '10px' }}>{dept.room}</div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '8px',
                borderTop: '1px solid #f1f5f9',
                fontSize: '0.78rem'
              }}>
                <span style={{ color: '#64748b' }}>Now Calling:</span>
                <span style={{ fontWeight: 800, color: dept.color, fontSize: '0.95rem' }}>#{dept.id.charAt(0).toUpperCase()}-{serving}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Active Live Token Display Card */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isUserInThisDept ? '1.2fr 1fr' : '1fr',
        gap: '20px',
        alignItems: 'stretch'
      }}>
        {/* Left: Department Status Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.8rem' }}>{currentDeptObj.icon}</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{currentDeptObj.name}</h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{currentDeptObj.doctor} • {currentDeptObj.room}</span>
              </div>
            </div>
            <span style={{
              background: '#ecfdf5',
              color: '#059669',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '20px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              🟢 OPD Active
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '14px',
            background: '#f8fafc',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center',
            marginBottom: '20px'
          }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Current Serving Token</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: currentDeptObj.color, lineHeight: 1.1, marginTop: '6px' }}>
                #{currentDeptObj.id.charAt(0).toUpperCase()}-{currentServing}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#10b981', fontWeight: 600, marginTop: '4px' }}>Inside Consultation Room</div>
            </div>

            <div style={{ borderLeft: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Avg Wait Time</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.1, marginTop: '6px' }}>
                ~{currentDeptObj.avgWaitPerPatient * 4} <span style={{ fontSize: '1rem', fontWeight: 600 }}>min</span>
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px' }}>Per patient ~{currentDeptObj.avgWaitPerPatient} mins</div>
            </div>
          </div>

          {/* Action to Generate / View Token */}
          {!isUserInThisDept ? (
            <button
              type="button"
              onClick={handleGenerateToken}
              style={{
                width: '100%',
                background: currentDeptObj.color,
                color: '#ffffff',
                border: 'none',
                padding: '14px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: `0 6px 18px ${currentDeptObj.color}33`,
                transition: 'all 0.2s ease'
              }}
            >
              <span>🎫 Get Live Queue Token for {currentDeptObj.name}</span>
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={handleCancelToken}
                style={{
                  flex: 1,
                  background: '#fef2f2',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  padding: '12px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                Cancel Token
              </button>
            </div>
          )}
        </div>

        {/* Right: User's Personalized Live Status Card */}
        {isUserInThisDept && (
          <div style={{
            background: patientsAhead === 0 ? 'linear-gradient(135deg, #ecfdf5, #d1fae5)' : 'linear-gradient(135deg, #f0fdfa, #e6fffa)',
            border: patientsAhead === 0 ? '2px solid #10b981' : '2px solid #00b4b6',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 8px 24px rgba(0, 180, 182, 0.12)'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f766e', textTransform: 'uppercase' }}>
                  {patientsAhead === 0 ? '🎉 YOUR TURN NOW!' : 'YOUR QUEUE STATUS'}
                </span>
                <span style={{
                  background: '#0f766e',
                  color: '#ffffff',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '12px'
                }}>
                  {user?.name || studentProfile?.name || 'Student'}
                </span>
              </div>

              <div style={{ textAlign: 'center', margin: '14px 0' }}>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Your Token Number</div>
                <div style={{ fontSize: '3.2rem', fontWeight: 900, color: '#0f766e', letterSpacing: '1px' }}>
                  {userToken}
                </div>
              </div>

              <div style={{
                background: '#ffffff',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                justifyContent: 'space-around',
                border: '1px solid rgba(15, 118, 110, 0.15)',
                marginBottom: '16px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>PATIENTS AHEAD</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: patientsAhead === 0 ? '#10b981' : '#ea580c' }}>
                    {patientsAhead}
                  </div>
                </div>
                <div style={{ width: '1px', background: '#e2e8f0' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>ESTIMATED WAIT</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
                    ~{estimatedWaitMins} min
                  </div>
                </div>
              </div>

              <div style={{
                fontSize: '0.82rem',
                color: '#334155',
                lineHeight: 1.4,
                textAlign: 'center',
                background: 'rgba(255,255,255,0.7)',
                padding: '10px',
                borderRadius: '8px'
              }}>
                {patientsAhead === 0 ? (
                  <strong style={{ color: '#15803d' }}>🔔 Please walk directly into {currentDeptObj.room}. The doctor is ready for you!</strong>
                ) : patientsAhead <= 2 ? (
                  <strong style={{ color: '#d97706' }}>⚡ You are next in line! Please wait outside {currentDeptObj.room}.</strong>
                ) : (
                  <span>You can relax in campus or library. We will notify you when 2 patients are left.</span>
                )}
              </div>
            </div>

            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  toast.success(`🔔 Chime alert tested for token ${userToken}!`);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#0f766e',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <FiVolume2 /> Test Audio Notification Chime
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
