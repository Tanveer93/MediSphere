import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiMic, FiMicOff } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './VoiceAssistant.css';

export default function VoiceAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);
  const convStateRef = useRef('IDLE');
  const bookingDataRef = useRef({ symptoms: '', time: '' });
  const navigate = useNavigate();
  const { login, isAuthenticated, logout } = useAuth();

  const speak = (message) => {
    window.speechSynthesis.cancel(); // Cancel any ongoing speech
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.onend = () => {
      if (convStateRef.current !== 'IDLE' && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.error(e);
        }
      }
    };
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech Recognition API not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      toast('Listening...', { icon: '🎤', duration: 2000 });
    };

    recognition.onresult = (event) => {
      const current = event.resultIndex;
      const resultTranscript = event.results[current][0].transcript.toLowerCase();
      setTranscript(resultTranscript);
      handleIntent(resultTranscript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
      toast.error('Could not hear you properly. Try again.');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const handleIntent = (text) => {
    toast.success(`Heard: "${text}"`, { duration: 3000 });

    if (convStateRef.current === 'ASKING_SYMPTOMS') {
      bookingDataRef.current.symptoms = text;
      convStateRef.current = 'ASKING_TIME';
      speak("Got it. What date and time would you like to book this appointment?");
      return;
    }

    if (convStateRef.current === 'ASKING_TIME') {
      bookingDataRef.current.time = text;
      convStateRef.current = 'IDLE';
      speak("Booking your appointment now. Please wait.");
      const { symptoms, time } = bookingDataRef.current;
      navigate(`/book/HOS101?autoPilot=true&symptoms=${encodeURIComponent(symptoms)}&time=${encodeURIComponent(time)}`);
      return;
    }

    const isLoginCommand = text.includes('login') || text.includes('log in') || text.includes('sign in');
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
        if (text.includes(key)) {
          matchedRole = data;
          break;
        }
      }

      if (matchedRole) {
        toast.success(`Logging into ${matchedRole.role} Dashboard...`, { duration: 4000 });
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
          navigate(matchedRole.path);
        }, 500);
        return;
      }
    }

    if (text.includes('logout') || text.includes('log out') || text.includes('sign out')) {
      toast.success('Logging out...', { duration: 2000 });
      logout();
      navigate('/');
      return;
    }

    const cleanText = text.toLowerCase().trim();
    const coreText = cleanText
      .replace(/^(please\s+|can\s+you\s+|kindly\s+)?(redirect\s+to|navigate\s+to|open\s+up|open\s+|take\s+me\s+to|go\s+to|show\s+me\s+|bring\s+up|chalo\s+|kholo\s+|le\s+jao\s+|dikhaye\s+|dikhao\s+)/gi, '')
      .trim();

    const routeIntents = [
      { keywords: ['emergency', 'sos', 'ambulance', 'accident', 'urgent', 'trauma', 'critical', 'khatra', 'madad', 'help'], route: '/emergency', message: 'Triggering Emergency SOS & Ambulance Protocols...' },
      { keywords: ['doctor', 'book doctor', 'appointment', 'book appointment', 'consultation', 'specialist', 'clinic', 'opd', 'physician', 'hospital', 'campus doctor', 'daktar', 'checkup'], route: '/book/HOS101', message: 'Navigating to Campus Doctor Booking...' },
      { keywords: ['prescription', 'prescriptions', 'medicine', 'medicines', 'meds', 'pharmacy', 'pill', 'pills', 'dawai', 'dawa', 'dawaii', 'order med', 'drug', 'drugs', 'rx', 'dosage'], route: '/my-prescriptions', message: 'Opening your Prescriptions & Medicines...' },
      { keywords: ['leave', 'medical leave', 'sick leave', 'attendance', 'certificate', 'medical certificate', 'chutti', 'leave application', 'apply leave'], route: '/medical-leave', message: 'Opening Medical Leave Portal...' },
      { keywords: ['symptom', 'symptoms', 'symptom checker', 'body map', '2d body map', '2d map', 'diagnosis', 'diagnose', 'check symptom', 'bimari', 'body check'], route: '/symptom-checker', message: 'Opening AI 2D Body Symptom Checker...' },
      { keywords: ['care plan', 'care', 'diet plan', 'diet', 'recovery plan', 'nutrition', 'health plan', 'meal plan', 'workout plan'], route: '/care-plan', message: 'Opening your Personalized AI Health Care Plan...' },
      { keywords: ['mood', 'mood tracker', 'journal', 'feelings', 'emotional', 'mood journal'], route: '/wellness-center', message: 'Opening Mood Tracker & Journal...' },
      { keywords: ['stress', 'stress assessment', 'stress level', 'stress test', 'anxiety', 'tension', 'breathing test'], route: '/wellness-center', message: 'Opening Stress Level Assessment...' },
      { keywords: ['wellness center', 'wellness', 'mental health', 'psychologist', 'counselor', 'counseling', 'counselling', 'therapist', 'therapy', 'mental wellness'], route: '/wellness-center', message: 'Opening Campus Psychologist & Wellness Center...' },
      { keywords: ['vaccination', 'vaccine', 'vaccines', 'vaccinations', 'immunization', 'injection', 'dose', 'tika', 'flu shot', 'booster'], route: '/vaccinations', message: 'Opening Vaccination Records...' },
      { keywords: ['health map', 'campus map', 'map', 'nearby', 'location', 'dispensary', 'first aid', 'route', 'rasta'], route: '/health-map', message: 'Opening Campus Health Map...' },
      { keywords: ['my bookings', 'my booking', 'my appointment', 'my appointments', 'scheduled visit', 'past bookings', 'upcoming appointment'], route: '/my-bookings', message: 'Opening My Bookings...' },
      { keywords: ['reward', 'rewards', 'leaderboard', 'points', 'point', 'badge', 'badges', 'rank', 'ranking', 'coin', 'coins', 'streak'], route: '/dashboard?tab=rewards', message: 'Opening Rewards & Leaderboard...' },
      { keywords: ['student health portal', 'student portal', 'student health', 'health portal', 'blood group', 'medical record', 'health card'], route: '/student-health-portal', message: 'Opening Student Health Portal...' },
      { keywords: ['complementary checkup', 'free checkup', 'body checkup', 'complementary', 'full body', 'full body checkup'], route: '/dashboard?tab=full-body-checkup', message: 'Opening Complementary Checkup...' },
      { keywords: ['analytics', 'health analytics', 'stats', 'statistics', 'graph', 'health report', 'chart', 'vitals'], route: '/analytics', message: 'Opening Health Analytics...' },
      { keywords: ['medicine trends', 'medicine trend', 'disease trend', 'illness trend', 'trends', 'trend', 'outbreak'], route: '/medicine-trends', message: 'Opening Medicine & Illness Trends...' },
      { keywords: ['wellness score', 'health score', 'wellbeing score', 'fitness score'], route: '/wellness-score', message: 'Opening Wellness Score...' },
      { keywords: ['refer', 'referral', 'refer a student', 'invite', 'invite friend', 'dost'], route: '/refer-a-student', message: 'Opening Student Referral...' },
      { keywords: ['faculty portal', 'faculty', 'teacher', 'prof', 'professor'], route: '/faculty-portal', message: 'Opening Faculty Portal...' },
      { keywords: ['dashboard', 'home', 'profile', 'main', 'homepage', 'overview'], route: '/dashboard', message: 'Taking you to Dashboard Home...' }
    ];

    let matchedIntent = null;
    for (const intent of routeIntents) {
      if (intent.keywords.some(keyword => cleanText.includes(keyword) || coreText.includes(keyword))) {
        matchedIntent = intent;
        break;
      }
    }

    if (matchedIntent) {
      toast.success(`Executing: ${matchedIntent.message}`, { duration: 3500 });
      speak(matchedIntent.message);
      navigate(matchedIntent.route);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    toast('Command not recognized. Please try again.', { icon: '🤔', duration: 3000 });
  };

  const toggleListen = () => {
    if (!recognitionRef.current) {
      toast.error('Voice commands are not supported in your browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setTranscript('');
      recognitionRef.current.start();
    }
  };

  return (
    <div className="voice-assistant-wrapper">
      <button 
        className={`fab-button voice-fab ${isListening ? 'listening' : ''}`}
        onClick={toggleListen}
        title="Voice Commands"
      >
        {isListening ? <FiMicOff /> : <FiMic />}
      </button>
      {isListening && <div className="voice-fab-pulse"></div>}
    </div>
  );
}

