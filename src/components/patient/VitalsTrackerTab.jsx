import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiActivity, FiPlus, FiTrendingUp, FiCalendar, FiCheck, FiAlertTriangle, FiDownload, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function VitalsTrackerTab({ user, studentProfile }) {
  const [vitalsHistory, setVitalsHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('medisphere_vitals_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    // Default baseline 7-day vitals mock data
    return [
      { id: 'v-1', date: '2026-09-08', time: '08:30 AM', systolic: 118, diastolic: 78, sugar: 92, temp: 98.4, weight: 58.2, spo2: 99, notes: 'Normal fasting check' },
      { id: 'v-2', date: '2026-09-09', time: '09:00 AM', systolic: 120, diastolic: 80, sugar: 95, temp: 98.6, weight: 58.1, spo2: 98, notes: 'Post gym workout' },
      { id: 'v-3', date: '2026-09-10', time: '08:15 AM', systolic: 122, diastolic: 82, sugar: 99, temp: 98.6, weight: 58.0, spo2: 99, notes: 'Exam morning' },
      { id: 'v-4', date: '2026-09-11', time: '08:45 AM', systolic: 119, diastolic: 79, sugar: 94, temp: 98.2, weight: 57.9, spo2: 98, notes: 'Normal' },
      { id: 'v-5', date: '2026-09-12', time: '09:10 AM', systolic: 121, diastolic: 80, sugar: 96, temp: 98.5, weight: 58.0, spo2: 99, notes: 'Routine check' },
      { id: 'v-6', date: '2026-09-13', time: '08:30 AM', systolic: 118, diastolic: 78, sugar: 93, temp: 98.6, weight: 57.8, spo2: 99, notes: 'Good recovery' },
      { id: 'v-7', date: '2026-09-14', time: '08:00 AM', systolic: 117, diastolic: 77, sugar: 91, temp: 98.4, weight: 57.8, spo2: 100, notes: 'All vitals optimal' }
    ];
  });

  const [activeMetric, setActiveMetric] = useState('bp'); // 'bp', 'sugar', 'temp', 'weight', 'spo2'
  const [showLogModal, setShowLogModal] = useState(false);

  const [newLog, setNewLog] = useState({
    systolic: '',
    diastolic: '',
    sugar: '',
    temp: '98.6',
    weight: studentProfile?.weight ? parseInt(studentProfile.weight, 10) || '' : '',
    spo2: '99',
    notes: ''
  });

  useEffect(() => {
    localStorage.setItem('medisphere_vitals_history', JSON.stringify(vitalsHistory));
  }, [vitalsHistory]);

  const latest = vitalsHistory[vitalsHistory.length - 1] || {
    systolic: 120, diastolic: 80, sugar: 95, temp: 98.6, weight: 58, spo2: 99
  };

  const handleSaveVitals = (e) => {
    e.preventDefault();
    if (!newLog.systolic || !newLog.diastolic) {
      toast.error('Please enter Systolic and Diastolic Blood Pressure');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const entry = {
      id: 'v-' + Date.now(),
      date: todayStr,
      time: timeStr,
      systolic: parseInt(newLog.systolic, 10),
      diastolic: parseInt(newLog.diastolic, 10),
      sugar: newLog.sugar ? parseInt(newLog.sugar, 10) : 95,
      temp: parseFloat(newLog.temp) || 98.6,
      weight: parseFloat(newLog.weight) || 58.0,
      spo2: parseInt(newLog.spo2, 10) || 99,
      notes: newLog.notes || 'Daily log'
    };

    setVitalsHistory(prev => [...prev, entry]);
    setShowLogModal(false);
    setNewLog({ systolic: '', diastolic: '', sugar: '', temp: '98.6', weight: '', spo2: '99', notes: '' });
    toast.success('📊 Vitals logged successfully!');
  };

  // Helper evaluation
  const getBpStatus = (sys, dia) => {
    if (sys < 120 && dia < 80) return { label: 'Optimal Normal', color: '#10b981', bg: '#ecfdf5' };
    if (sys <= 129 && dia < 80) return { label: 'Elevated', color: '#f59e0b', bg: '#fffbeb' };
    return { label: 'High Stage 1', color: '#ef4444', bg: '#fef2f2' };
  };

  const getSugarStatus = (val) => {
    if (val < 100) return { label: 'Normal Fasting', color: '#10b981', bg: '#ecfdf5' };
    if (val <= 125) return { label: 'Pre-Diabetic Range', color: '#f59e0b', bg: '#fffbeb' };
    return { label: 'Elevated Glucose', color: '#ef4444', bg: '#fef2f2' };
  };

  const bpEval = getBpStatus(latest.systolic, latest.diastolic);
  const sugarEval = getSugarStatus(latest.sugar);

  // SVG Chart points generator
  const renderChart = () => {
    const W = 650, H = 180, pad = 40;
    const dataSlice = vitalsHistory.slice(-10);
    const count = dataSlice.length;
    if (count < 2) return null;

    let values = [];
    let minVal = 0, maxVal = 100, unit = '';

    if (activeMetric === 'bp') {
      values = dataSlice.map(d => d.systolic);
      minVal = 90; maxVal = 150; unit = 'mmHg';
    } else if (activeMetric === 'sugar') {
      values = dataSlice.map(d => d.sugar);
      minVal = 60; maxVal = 160; unit = 'mg/dL';
    } else if (activeMetric === 'temp') {
      values = dataSlice.map(d => d.temp);
      minVal = 96.0; maxVal = 103.0; unit = '°F';
    } else if (activeMetric === 'weight') {
      values = dataSlice.map(d => d.weight);
      minVal = 45; maxVal = 85; unit = 'kg';
    } else if (activeMetric === 'spo2') {
      values = dataSlice.map(d => d.spo2);
      minVal = 90; maxVal = 100; unit = '%';
    }

    const stepX = (W - pad * 2) / (count - 1);
    const points = values.map((v, i) => {
      const x = pad + i * stepX;
      const normY = (v - minVal) / (maxVal - minVal);
      const y = H - pad - normY * (H - pad * 2);
      return { x, y, val: v, date: dataSlice[i].date };
    });

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaD = `${pathD} L ${points[points.length - 1].x} ${H - pad} L ${points[0].x} ${H - pad} Z`;

    return (
      <svg width="100%" height="200" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="vitalGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0f766e" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0f766e" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        <line x1={pad} y1={pad} x2={W - pad} y2={pad} stroke="#f1f5f9" strokeDasharray="4 4" />
        <line x1={pad} y1={H / 2} x2={W - pad} y2={H / 2} stroke="#f1f5f9" strokeDasharray="4 4" />
        <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="#e2e8f0" strokeWidth="1.5" />

        {/* Area fill & Path */}
        <path d={areaD} fill="url(#vitalGrad)" />
        <path d={pathD} fill="none" stroke="#0f766e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots & Labels */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="5" fill="#ffffff" stroke="#0f766e" strokeWidth="2.5" />
            <text x={p.x} y={p.y - 10} fill="#0f766e" fontSize="11" fontWeight="700" textAnchor="middle">
              {p.val}
            </text>
            <text x={p.x} y={H - pad + 18} fill="#64748b" fontSize="10" textAnchor="middle">
              {p.date.slice(5)}
            </text>
          </g>
        ))}
      </svg>
    );
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #042a59 0%, #1d467c 100%)',
        borderRadius: '16px',
        padding: '24px',
        color: '#ffffff',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 10px 25px rgba(4, 42, 89, 0.2)'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '8px' }}>
            <span>📈 BIOMETRIC TELEMETRY & CLINICAL LOGS</span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>Daily Vitals & Health Trends</h2>
          <p style={{ margin: '4px 0 0 0', opacity: 0.9, fontSize: '0.85rem' }}>Track blood pressure, blood glucose, weight & temperature history for predictive AI care.</p>
        </div>

        <button
          type="button"
          onClick={() => setShowLogModal(true)}
          style={{
            background: '#00d9a6',
            color: '#042a59',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '10px',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(0, 217, 166, 0.35)'
          }}
        >
          <FiPlus size={18} /> Log Today's Vitals
        </button>
      </div>

      {/* 4 Summary Vitals Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Blood Pressure */}
        <div style={{
          background: '#ffffff',
          borderRadius: '14px',
          padding: '18px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>BLOOD PRESSURE</span>
            <span style={{ fontSize: '1.2rem' }}>🫀</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a' }}>
            {latest.systolic}/{latest.diastolic} <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>mmHg</span>
          </div>
          <div style={{ marginTop: '8px' }}>
            <span style={{ background: bpEval.bg, color: bpEval.color, fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: '12px' }}>
              ● {bpEval.label}
            </span>
          </div>
        </div>

        {/* Blood Glucose */}
        <div style={{
          background: '#ffffff',
          borderRadius: '14px',
          padding: '18px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>FASTING GLUCOSE</span>
            <span style={{ fontSize: '1.2rem' }}>🩸</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a' }}>
            {latest.sugar} <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>mg/dL</span>
          </div>
          <div style={{ marginTop: '8px' }}>
            <span style={{ background: sugarEval.bg, color: sugarEval.color, fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: '12px' }}>
              ● {sugarEval.label}
            </span>
          </div>
        </div>

        {/* Temperature */}
        <div style={{
          background: '#ffffff',
          borderRadius: '14px',
          padding: '18px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>TEMPERATURE</span>
            <span style={{ fontSize: '1.2rem' }}>🌡️</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a' }}>
            {latest.temp} <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>°F</span>
          </div>
          <div style={{ marginTop: '8px' }}>
            <span style={{ background: latest.temp <= 99.0 ? '#ecfdf5' : '#fef2f2', color: latest.temp <= 99.0 ? '#10b981' : '#ef4444', fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: '12px' }}>
              ● {latest.temp <= 99.0 ? 'Normal Afebrile' : 'Fever Detected'}
            </span>
          </div>
        </div>

        {/* Weight & SpO2 */}
        <div style={{
          background: '#ffffff',
          borderRadius: '14px',
          padding: '18px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>WEIGHT & SPO2</span>
            <span style={{ fontSize: '1.2rem' }}>⚖️</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a' }}>
            {latest.weight} <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>kg</span> <span style={{ fontSize: '1.2rem', color: '#94a3b8' }}>|</span> {latest.spo2}%
          </div>
          <div style={{ marginTop: '8px' }}>
            <span style={{ background: '#ecfdf5', color: '#10b981', fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: '12px' }}>
              ● Optimal Oxygenation
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Trend Chart Card */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #e2e8f0',
        marginBottom: '24px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Biometric Trend Analytics</h3>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Visual trajectory over the past recorded entries</span>
          </div>

          {/* Metric Selector Tabs */}
          <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
            {[
              { id: 'bp', label: 'Blood Pressure' },
              { id: 'sugar', label: 'Glucose' },
              { id: 'temp', label: 'Temperature' },
              { id: 'weight', label: 'Weight' },
              { id: 'spo2', label: 'SpO2' }
            ].map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setActiveMetric(m.id)}
                style={{
                  border: 'none',
                  background: activeMetric === m.id ? '#0f766e' : 'transparent',
                  color: activeMetric === m.id ? '#ffffff' : '#64748b',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Rendering */}
        <div style={{ padding: '10px 0' }}>
          {renderChart()}
        </div>
      </div>

      {/* Historical Vitals Table */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Logged Records History</h3>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                <th style={{ padding: '12px' }}>Date & Time</th>
                <th style={{ padding: '12px' }}>Blood Pressure</th>
                <th style={{ padding: '12px' }}>Blood Glucose</th>
                <th style={{ padding: '12px' }}>Temp</th>
                <th style={{ padding: '12px' }}>Weight</th>
                <th style={{ padding: '12px' }}>SpO2</th>
                <th style={{ padding: '12px' }}>Doctor's Assessment</th>
              </tr>
            </thead>
            <tbody>
              {vitalsHistory.slice().reverse().map((entry) => (
                <tr key={entry.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', fontWeight: 600, color: '#1e293b' }}>
                    {entry.date} <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>({entry.time})</span>
                  </td>
                  <td style={{ padding: '12px', fontWeight: 700, color: '#0f766e' }}>
                    {entry.systolic}/{entry.diastolic} mmHg
                  </td>
                  <td style={{ padding: '12px' }}>{entry.sugar} mg/dL</td>
                  <td style={{ padding: '12px' }}>{entry.temp}°F</td>
                  <td style={{ padding: '12px' }}>{entry.weight} kg</td>
                  <td style={{ padding: '12px', color: '#10b981', fontWeight: 700 }}>{entry.spo2}%</td>
                  <td style={{ padding: '12px', color: '#64748b' }}>{entry.notes || 'Normal Vitals'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal to Log New Vitals */}
      {showLogModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            maxWidth: '480px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Log Today's Health Vitals</h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '0.8rem', color: '#64748b' }}>Enter your biometric readings from clinic or smart health monitor.</p>

            <form onSubmit={handleSaveVitals} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Systolic BP (mmHg) *</label>
                  <input
                    type="number"
                    placeholder="e.g. 120"
                    value={newLog.systolic}
                    onChange={(e) => setNewLog({ ...newLog, systolic: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Diastolic BP (mmHg) *</label>
                  <input
                    type="number"
                    placeholder="e.g. 80"
                    value={newLog.diastolic}
                    onChange={(e) => setNewLog({ ...newLog, diastolic: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Fasting Glucose (mg/dL)</label>
                  <input
                    type="number"
                    placeholder="e.g. 95"
                    value={newLog.sugar}
                    onChange={(e) => setNewLog({ ...newLog, sugar: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Temperature (°F)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 98.6"
                    value={newLog.temp}
                    onChange={(e) => setNewLog({ ...newLog, temp: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Body Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 58.5"
                    value={newLog.weight}
                    onChange={(e) => setNewLog({ ...newLog, weight: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>SpO2 Level (%)</label>
                  <input
                    type="number"
                    placeholder="e.g. 99"
                    value={newLog.spo2}
                    onChange={(e) => setNewLog({ ...newLog, spo2: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Context Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Post breakfast, slight fatigue"
                  value={newLog.notes}
                  onChange={(e) => setNewLog({ ...newLog, notes: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#64748b', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#0f766e', color: '#ffffff', fontWeight: 800, cursor: 'pointer' }}
                >
                  Save Vitals
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
