import { useState, useEffect, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiMessageSquare, 
  FiX, 
  FiSend, 
  FiMic, 
  FiMicOff, 
  FiCpu, 
  FiRefreshCw, 
  FiHelpCircle 
} from 'react-icons/fi';
import { aiAPI } from '../../services/api';
import { getOfflineAiResponse } from '../../services/offlineAi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import aiBotIcon from '../../assets/ai-bot-icon.png';
import './GlobalQueryBot.css';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export default function GlobalQueryBot() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, logout } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatSessionId, setChatSessionId] = useState(null);
  const [chatHistory, setChatHistory] = useState([
    {
      sender: 'ai',
      text: '👋 **Welcome to MediSphere!** I am your 24/7 Platform Assistant.\n\nI can help you with:\n- 📅 [Booking an appointment](/dashboard) with a doctor\n- 📝 [Creating an account](/signup) or [logging in](/login)\n- 💊 [Buying & ordering medicines](/my-prescriptions)\n- 🎙️ Using AI clinical tools or diagnostic bookings\n- 🩺 General health and wellness questions\n\n*How can I help you today? You can type your query or click the microphone button next to me to ask with your voice!*'
    }
  ]);
  const [sendingChat, setSendingChat] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [liveSpeechText, setLiveSpeechText] = useState('');
  const recognitionRef = useRef(null);
  const chatBodyRef = useRef(null);

  const isPatientDashboard = location.pathname === '/dashboard' || 
                             location.pathname.startsWith('/dashboard?');

  const quickTags = [
    { label: '📅 Book Appointment', query: 'How do I book a doctor appointment on the platform?' },
    { label: '📝 Sign Up Guide', query: 'How can I register an account as a student, teacher or doctor?' },
    { label: '💊 Buy Medicines', query: 'How can I order medicines online using my prescriptions?' },
    { label: '🏆 Earn Rewards', query: 'How does the EXP checklist and streak rewards program work?' }
  ];

  useEffect(() => {
    const SpeechClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechClass) return;

    try {
      const rec = new SpeechClass();
      rec.continuous = false;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.lang = navigator.language && navigator.language.startsWith('en') ? navigator.language : 'en-IN';

      rec.onstart = () => {
        setIsListening(true);
        setLiveSpeechText('');
        toast.success('🎙️ Voice assistant listening... Please speak now!', { id: 'voice-active', duration: 4000 });
      };

      rec.onresult = (event) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcriptPiece;
          } else {
            interim += transcriptPiece;
          }
        }

        const currentText = final || interim;
        if (currentText) {
          setLiveSpeechText(currentText);
        }

        if (final && final.trim()) {
          handleSendVoiceQuery(final.trim());
        }
      };

      rec.onerror = (event) => {
        console.warn('Speech recognition status/error:', event.error);
        if (event.error === 'no-speech') {
          toast('No voice detected. Please speak clearly into your mic.', { icon: '🎙️', id: 'voice-active' });
        } else if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          toast.error('Microphone permission denied! Please click the lock icon in your browser URL bar to allow microphone.', { id: 'voice-active', duration: 5000 });
        } else if (event.error !== 'aborted') {
          toast.error('Could not capture audio clearly. Please try again.', { id: 'voice-active' });
        }
        setIsListening(false);
        setLiveSpeechText('');
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    } catch (e) {
      console.error('Error initializing speech recognition:', e);
    }
  }, []);

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [chatHistory, sendingChat, chatOpen]);

  const handleToggleListening = () => {
    const SpeechClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechClass) {
      toast.error('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsListening(false);
      setLiveSpeechText('');
    } else {
      if (recognitionRef.current) {
        try {
          setLiveSpeechText('');
          recognitionRef.current.start();
        } catch (err) {
          console.warn('Recognition start warning:', err);
          // If already started or in transition, restart safely
          try {
            recognitionRef.current.stop();
            setTimeout(() => {
              recognitionRef.current?.start();
            }, 200);
          } catch (e) {}
        }
      }
    }
  };

  const handleSendVoiceQuery = (text) => {
    setLiveSpeechText('');
    toast.success(`Voice heard: "${text}"`, { icon: '🎙️', id: 'voice-captured' });
    setChatOpen(true);
    handleSendChat(text);
  };

  const handleSendChat = async (textToSend) => {
    const msg = textToSend || chatMessage;
    if (!msg.trim() || sendingChat) return;

    setChatHistory(prev => [...prev, { sender: 'user', text: msg }]);
    if (!textToSend) setChatMessage('');
    setSendingChat(true);

    const lowerMsg = msg.toLowerCase();

    const isLoginCommand = lowerMsg.includes('login') || lowerMsg.includes('log in') || lowerMsg.includes('sign in');
    if (isLoginCommand) {
      const roleMap = {
        'doctor': { role: 'DOCTOR', path: '/doctor/dashboard', name: 'Dr. Smith' },
        'admin': { role: 'ADMIN', path: '/admin/dashboard', name: 'Admin User' },
        'hospital': { role: 'HOSPITAL', path: '/hospital/dashboard', name: 'City Hospital' },
        'pharmacy': { role: 'PHARMACY', path: '/pharmacy/dashboard', name: 'Health Pharmacy' },
        'lab': { role: 'LAB', path: '/lab/dashboard', name: 'Central Lab' },
        'student': { role: 'PATIENT', path: '/dashboard', name: 'RASHIKA POONIA' },
        'patient': { role: 'PATIENT', path: '/dashboard', name: 'RASHIKA POONIA' }
      };

      let matchedRole = null;
      for (const [key, data] of Object.entries(roleMap)) {
        if (lowerMsg.includes(key)) {
          matchedRole = data;
          break;
        }
      }

      if (matchedRole) {
        setChatHistory(prev => [...prev, { 
          sender: 'ai', 
          text: `🔐 Logging into ${matchedRole.role} Dashboard...` 
        }]);
        logout(); // Always clear previous session
        
        setTimeout(() => {
          login({
            token: 'voice-mock-jwt-token',
            id: '24BCF10024',
            name: matchedRole.name,
            email: 'test@example.com',
            role: matchedRole.role,
            phone: '9999999999'
          });
          localStorage.setItem('user_type', matchedRole.role);
          setChatOpen(false);
          setSendingChat(false);
          navigate(matchedRole.path);
        }, 1500);
        return;
      }
    }

    if (lowerMsg.includes('logout') || lowerMsg.includes('log out') || lowerMsg.includes('sign out')) {
      setChatHistory(prev => [...prev, { 
        sender: 'ai', 
        text: '👋 Logging out of your account...' 
      }]);
      setTimeout(() => {
        logout();
        setChatOpen(false);
        setSendingChat(false);
        navigate('/');
      }, 1500);
      return;
    }
    
    const isDirectNavigation = 
      lowerMsg.includes('redirect') ||
      lowerMsg.includes('open') || 
      lowerMsg.includes('go to') || 
      lowerMsg.includes('take me to') || 
      lowerMsg.includes('navigate to') ||
      lowerMsg.includes('show me') ||
      lowerMsg.includes('where is') ||
      lowerMsg.includes('apply') ||
      lowerMsg.includes('emergency') ||
      lowerMsg.includes('sos') ||
      lowerMsg.includes('leave') ||
      lowerMsg.includes('ambulance') ||
      lowerMsg.includes('book doctor') ||
      lowerMsg.includes('appointment') ||
      lowerMsg.includes('prescription') ||
      lowerMsg.includes('medicine') ||
      lowerMsg.includes('mood tracker') ||
      lowerMsg.includes('stress assessment') ||
      lowerMsg.includes('symptom checker');

    if (isDirectNavigation) {
      const routeIntents = [
        { keywords: ['emergency', 'sos', 'ambulance', 'accident', 'urgent', 'trauma', 'critical', 'khatra', 'madad', 'help'], route: '/emergency', message: '🚨 **Redirecting immediately to Emergency SOS & Ambulance Dispatch...**' },
        { keywords: ['doctor', 'book doctor', 'appointment', 'book appointment', 'consultation', 'specialist', 'clinic', 'opd', 'physician', 'hospital', 'campus doctor', 'daktar', 'checkup'], route: '/book/HOS101', message: '🩺 **Navigating directly to Campus Doctors & Booking portal...**' },
        { keywords: ['prescription', 'prescriptions', 'medicine', 'medicines', 'meds', 'pharmacy', 'pill', 'pills', 'dawai', 'dawa', 'dawaii', 'order med', 'drug', 'drugs', 'rx', 'dosage'], route: '/my-prescriptions', message: '💊 **Opening your Prescriptions & Medicine Orders...**' },
        { keywords: ['leave', 'medical leave', 'sick leave', 'attendance', 'certificate', 'medical certificate', 'chutti', 'leave application', 'apply leave'], route: '/medical-leave', message: '📝 **Taking you directly to the Medical Leave Application portal...**' },
        { keywords: ['mood tracker', 'mood journal', 'mood', 'feelings', 'emotional'], route: '/wellness-center', message: '🧠 **Taking you directly to the Mood Tracker & Journal...**' },
        { keywords: ['stress assessment', 'stress level', 'stress test', 'stress', 'anxiety', 'tension'], route: '/wellness-center', message: '📊 **Opening Stress Level Assessment...**' },
        { keywords: ['psychologist', 'counselor', 'counseling', 'counselling', 'mental health', 'wellness center', 'wellness', 'therapist', 'therapy', 'mental wellness'], route: '/wellness-center', message: '👥 **Opening Campus Psychologist & Wellness Center...**' },
        { keywords: ['symptom', 'symptoms', 'symptom checker', 'body map', '2d body map', '2d map', 'diagnosis', 'diagnose', 'check symptom', 'bimari', 'body check'], route: '/symptom-checker', message: '🤖 **Opening AI 2D Body Symptom Checker...**' },
        { keywords: ['care plan', 'care', 'diet plan', 'diet', 'recovery plan', 'nutrition', 'health plan', 'meal plan', 'workout plan'], route: '/care-plan', message: '🥗 **Opening Personalized AI Health Care Plan...**' },
        { keywords: ['vaccination', 'vaccine', 'vaccines', 'vaccinations', 'immunization', 'injection', 'dose', 'tika', 'flu shot', 'booster'], route: '/vaccinations', message: '💉 **Opening Campus Vaccination Records...**' },
        { keywords: ['health map', 'campus map', 'map', 'nearby', 'location', 'dispensary', 'first aid', 'route', 'rasta'], route: '/health-map', message: '🗺️ **Opening Campus Health Map...**' },
        { keywords: ['my bookings', 'my booking', 'my appointment', 'my appointments', 'scheduled visit', 'past bookings', 'upcoming appointment'], route: '/my-bookings', message: '📅 **Opening My Bookings...**' },
        { keywords: ['reward', 'rewards', 'leaderboard', 'points', 'point', 'badge', 'badges', 'rank', 'ranking', 'coin', 'coins', 'streak'], route: '/dashboard?tab=rewards', message: '🏆 **Opening Rewards & Health Leaderboard...**' },
        { keywords: ['student health portal', 'student portal', 'student health', 'health portal', 'blood group', 'medical record', 'health card'], route: '/student-health-portal', message: '🎓 **Opening Student Health Portal...**' },
        { keywords: ['complementary checkup', 'free checkup', 'body checkup', 'complementary', 'full body', 'full body checkup'], route: '/dashboard?tab=full-body-checkup', message: '🩺 **Opening Complementary Checkup...**' },
        { keywords: ['analytics', 'health analytics', 'stats', 'statistics', 'graph', 'health report', 'chart', 'vitals'], route: '/analytics', message: '📊 **Opening Health Analytics...**' },
        { keywords: ['medicine trends', 'medicine trend', 'disease trend', 'illness trend', 'trends', 'trend', 'outbreak'], route: '/medicine-trends', message: '📈 **Opening Medicine & Illness Trends...**' },
        { keywords: ['wellness score', 'health score', 'wellbeing score', 'fitness score'], route: '/wellness-score', message: '💯 **Opening Wellness Score...**' },
        { keywords: ['refer', 'referral', 'refer a student', 'invite', 'invite friend', 'dost'], route: '/refer-a-student', message: '🤝 **Opening Student Referral...**' },
        { keywords: ['faculty portal', 'faculty', 'teacher', 'prof', 'professor'], route: '/faculty-portal', message: '🎓 **Opening Faculty Portal...**' },
        { keywords: ['dashboard', 'home', 'profile', 'main', 'homepage', 'overview'], route: '/dashboard', message: '🏠 **Taking you to your Dashboard...**' }
      ];

      let matchedIntent = null;
      for (const intent of routeIntents) {
        if (intent.keywords.some(keyword => lowerMsg.includes(keyword))) {
          matchedIntent = intent;
          break;
        }
      }

      if (matchedIntent) {
        setChatHistory(prev => [...prev, { 
          sender: 'ai', 
          text: matchedIntent.message 
        }]);
        toast.success(matchedIntent.message.replace(/\*\*/g, ''), { duration: 2500 });
        setTimeout(() => {
          setChatOpen(false);
          setSendingChat(false);
          navigate(matchedIntent.route);
        }, 900);
        return;
      }
    }

    if (!navigator.onLine) {
      setTimeout(async () => {
        try {
          const reply = await getOfflineAiResponse(msg);
          setChatHistory(prev => [...prev, { sender: 'ai', text: reply }]);
        } catch (err) {
          console.error(err);
          setChatHistory(prev => [...prev, { sender: 'ai', text: '⚠️ **Error:** Failed to compute offline reply.' }]);
        } finally {
          setSendingChat(false);
        }
      }, 500);
      return;
    }

    try {
      const res = await aiAPI.queryChat(msg, chatSessionId);
      const reply = res.data.reply || 'Sorry, I couldn\'t formulate a reply. Please try again.';
      if (res.data.sessionId) {
        setChatSessionId(res.data.sessionId);
      }
      setChatHistory(prev => [...prev, { sender: 'ai', text: reply }]);
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, { sender: 'ai', text: '⚠️ **Connection Error:** Could not connect to Astra. Please make sure the backend server is running and try again.' }]);
    } finally {
      setSendingChat(false);
    }
  };

  const handleResetChat = async () => {
    try {
      const res = await aiAPI.resetQueryChat(chatSessionId);
      if (res.data.sessionId) {
        setChatSessionId(res.data.sessionId);
      }
      toast.success('Chat history cleared! Fresh session started.');
    } catch (err) {
      console.error('Reset failed', err);
    }
    setChatHistory([
      {
        sender: 'ai',
        text: '👋 **Session reset!** How can I assist you with MediSphere platform queries or wellness support?'
      }
    ]);
  };

  const parseMarkdown = (text) => {
    if (!text) return '';
    const lines = text.split('\n');
    return lines.map((line, index) => {
      let trimmed = line.trim();
      let content = line
        .replace(/^#{1,6}\s*/g, '')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\*/g, '');

      // Headings without raw '#'
      if (/^#{1,6}\s*/.test(trimmed)) {
        const cleanHeading = trimmed.replace(/^#{1,6}\s*/, '').replace(/\*\*/g, '').replace(/\*/g, '').trim();
        return (
          <h4 key={index} style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f766e', marginTop: '10px', marginBottom: '4px' }}>
            {cleanHeading}
          </h4>
        );
      }

      const linkRegex = /\[(.*?)\]\((.*?)\)/g;
      let match;
      let lastIndex = 0;
      const parts = [];

      while ((match = linkRegex.exec(content)) !== null) {
        const [fullMatch, linkText, linkUrl] = match;
        const matchIndex = match.index;

        if (matchIndex > lastIndex) {
          parts.push(
            <span 
              key={`text-${lastIndex}`} 
              dangerouslySetInnerHTML={{ __html: content.substring(lastIndex, matchIndex) }} 
            />
          );
        }

        if (linkUrl.startsWith('/')) {
          parts.push(
            <Link 
              key={`link-${matchIndex}`} 
              to={linkUrl} 
              onClick={() => setChatOpen(false)} // Close bot panel on link click for seamless flow
              className="chat-embedded-link"
            >
              {linkText}
            </Link>
          );
        } else {
          parts.push(
            <a 
              key={`extlink-${matchIndex}`} 
              href={linkUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="chat-embedded-link"
            >
              {linkText}
            </a>
          );
        }
        lastIndex = linkRegex.lastIndex;
      }

      if (lastIndex < content.length) {
        parts.push(
          <span 
            key={`text-${lastIndex}`} 
            dangerouslySetInnerHTML={{ __html: content.substring(lastIndex) }} 
          />
        );
      }

      // Clean bullet items without double dashes
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
        const cleanItem = trimmed.replace(/^[-*•]\s*/, '').replace(/^[-*•]\s*/, '').trim();
        return (
          <li key={index} className="chat-li">
            {parts.length > 0 ? parts : <span dangerouslySetInnerHTML={{ __html: cleanItem.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/\*/g, '') }} />}
          </li>
        );
      }

      if (/^\d+\.\s/.test(trimmed)) {
        const cleanItem = trimmed.replace(/^\d+\.\s/, '').trim();
        return (
          <li key={index} className="chat-li-decimal">
            {parts.length > 0 ? parts : <span dangerouslySetInnerHTML={{ __html: cleanItem.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/\*/g, '') }} />}
          </li>
        );
      }

      if (trimmed === '') {
        return <div key={index} style={{ height: '6px' }} />;
      }

      return (
        <p key={index} className="chat-p">
          {parts.length > 0 ? parts : <span dangerouslySetInnerHTML={{ __html: content }} />}
        </p>
      );
    });
  };

  return (
    <div className={`global-query-bot-container ${isPatientDashboard ? 'dashboard-shifted' : ''}`}>
      
      {/* Voice Status Alert */}
      {isListening && (
        <div className="voice-listening-toast">
          <div className="mic-pulse-ring"></div>
          <span>{liveSpeechText ? `🎙️ "${liveSpeechText}"` : '🎙️ Listening... Speak your question!'}</span>
        </div>
      )}

      {/* Floating Buttons: Mic & Chat Trigger */}
      <div className="global-bot-fab-group">
        
        {/* Voice Assistant Button */}
        <button 
          className={`global-mic-fab ${isListening ? 'listening' : ''}`}
          onClick={handleToggleListening}
          title={isListening ? "Stop Voice Input" : "Ask with AI Voice Assistant"}
        >
          {isListening ? (
            <FiMicOff size={20} className="mic-icon-off" />
          ) : (
            <FiMic size={20} className="mic-icon-on" />
          )}
          {isListening && (
            <div className="mic-waves">
              <span className="wave-bar"></span>
              <span className="wave-bar"></span>
              <span className="wave-bar"></span>
            </div>
          )}
        </button>

        {/* Chatbot Toggle Button */}
        <button 
          className={`global-chat-fab ${chatOpen ? 'open' : ''}`} 
          onClick={() => setChatOpen(!chatOpen)}
          title="MediSphere Platform Assistant"
        >
          {chatOpen ? (
            <FiX size={22} />
          ) : (
            <div className="chat-fab-inner">
              <img src={aiBotIcon} alt="AI Helper" className="fab-bot-img" />
              <span className="fab-glow-effect"></span>
            </div>
          )}
        </button>
      </div>

      {/* Chat Interface Panel Overlay */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div 
            className="global-chat-panel"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          >
            {/* Panel Header */}
            <div className="global-chat-header">
              <div className="header-info">
                <div className="header-avatar">
                  <img src={aiBotIcon} alt="Astra" className="header-avatar-img" />
                </div>
                <div className="header-text">
                  <span className="header-title">Astra</span>
                  {!navigator.onLine ? (
                    <span className="header-subtitle" style={{ color: '#1d467c', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span className="offline-indicator-dot" style={{ backgroundColor: '#1d467c', boxShadow: '0 0 6px #1d467c' }}></span>
                      Offline Mode (TF.js)
                    </span>
                  ) : (
                    <span className="header-subtitle">
                      <span className="online-indicator-dot"></span>
                      24/7 Platform Guide
                    </span>
                  )}
                </div>
              </div>
              
              <div className="header-actions">
                <button
                  onClick={handleResetChat}
                  title="Reset Conversation"
                  className="header-btn-reset"
                >
                  <FiRefreshCw size={14} />
                </button>
                <button 
                  onClick={() => setChatOpen(false)} 
                  className="header-btn-close"
                >
                  <FiX size={18} />
                </button>
              </div>
            </div>

            {/* Chat History Area */}
            <div className="global-chat-body" ref={chatBodyRef}>
              {chatHistory.map((chat, i) => (
                <div key={i} className={`global-chat-message ${chat.sender}`}>
                  <span className="message-sender-name">
                    {chat.sender === 'user' ? 'You' : 'Astra'}
                  </span>
                  <div className="message-bubble">
                    {chat.sender === 'ai' ? parseMarkdown(chat.text) : chat.text}
                  </div>
                </div>
              ))}
              
              {sendingChat && (
                <div className="global-chat-message ai">
                  <span className="message-sender-name">Astra</span>
                  <div className="message-bubble typing">
                    <FiCpu className="typing-spinner" />
                    <span>Thinking...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Suggested Tags Area */}
            <div className="global-chat-suggestions">
              {quickTags.map((tag, i) => (
                <button 
                  key={i} 
                  className="suggestion-pill" 
                  onClick={() => handleSendChat(tag.query)}
                >
                  <FiHelpCircle size={12} className="pill-icon" />
                  <span>{tag.label}</span>
                </button>
              ))}
            </div>

            {/* Chat Input form */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendChat(); }} 
              className="global-chat-input-area"
            >
              <input 
                type="text" 
                className="global-chat-input-field" 
                placeholder="Ask how to book, sign up, buy..." 
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                disabled={sendingChat}
              />
              <button 
                type="submit" 
                className="global-chat-send-btn" 
                disabled={sendingChat || !chatMessage.trim()}
              >
                <FiSend size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

