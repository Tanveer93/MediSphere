import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { hospitalAPI, bookingAPI, paymentAPI, authAPI } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiArrowLeft, 
  FiArrowRight, 
  FiCalendar, 
  FiCheckCircle, 
  FiCreditCard, 
  FiInfo, 
  FiPhone, 
  FiClock, 
  FiUser, 
  FiActivity, 
  FiFileText, 
  FiShield,
  FiMapPin,
  FiSearch,
  FiCpu,
  FiX,
  FiMic,
  FiMicOff,
  FiZap,
  FiStar,
  FiCheck,
  FiFilter
} from 'react-icons/fi';
import toast from 'react-hot-toast';

// MedGemma AI Clinical Specialty Knowledge Base
const MEDGEMMA_SPECIALTY_RULES = [
  {
    specialty: 'General Physician',
    icon: '🩺',
    keywords: [
      'fever', 'bukhar', 'cold', 'cough', 'flu', 'weakness', 'fatigue', 'shivering',
      'malaria', 'dengue', 'typhoid', 'viral', 'headache', 'body pain', 'infection',
      'nausea', 'vomiting', 'stomach ache', 'food poisoning', 'indigestion', 'gas',
      'dizziness', 'routine checkup', 'general health', 'chills', 'acidity', 'loose motion', 'diarrhea'
    ],
    reason: 'Symptoms indicate general systemic, viral, or metabolic illness. A General Physician will provide primary diagnosis, lab prescriptions, and baseline treatment.'
  },
  {
    specialty: 'Orthopedic & Sports Injury',
    icon: '🦴',
    keywords: [
      'bone', 'joint', 'knee', 'fracture', 'sprain', 'ligament', 'back pain',
      'shoulder', 'spine', 'muscle', 'orthopedic', 'arthritis', 'swollen ankle',
      'cricket injury', 'gym injury', 'sciatica', 'wrist pain', 'neck pain', 'dislocation', 'pain in leg', 'leg pain'
    ],
    reason: 'Musculoskeletal or bone/joint trauma detected. Orthopedic specialist recommended for clinical evaluation, imaging (X-ray/MRI), and mobility care.'
  },
  {
    specialty: 'Dermatologist & Skin Specialist',
    icon: '🧴',
    keywords: [
      'skin', 'rash', 'itching', 'acne', 'pimple', 'eczema', 'allergy', 'dermatitis',
      'hair fall', 'dandruff', 'fungal', 'redness', 'boils', 'psoriasis', 'hives',
      'dry skin', 'sunburn', 'patches', 'skin infection'
    ],
    reason: 'Cutaneous allergy or dermatological issue detected. Dermatologist specialist recommended for topical assessment and skin treatment.'
  },
  {
    specialty: 'Psychiatrist & Mental Wellness',
    icon: '🧠',
    keywords: [
      'depression', 'anxiety', 'stress', 'panic', 'insomnia', 'sleep', 'trauma',
      'mood', 'bipolar', 'mental', 'sadness', 'overthinking', 'adhd', 'burnout',
      'exam stress', 'crying', 'loneliness', 'suicidal', 'focus issues'
    ],
    reason: 'Psychological, cognitive or sleep distress detected. Campus Mental Wellness & Psychiatrist counseling recommended for emotional well-being.'
  },
  {
    specialty: 'Eye & ENT Specialist',
    icon: '👁️',
    keywords: [
      'eye', 'vision', 'blurred vision', 'red eye', 'ear', 'earache', 'hearing',
      'throat', 'sore throat', 'tonsils', 'sinus', 'nose bleed', 'nasal', 'ent',
      'tinnitus', 'voice loss', 'throat pain', 'swollen glands'
    ],
    reason: 'Ophthalmology & ENT (Eye, Ear, Nose, Throat) symptoms identified for focused diagnostic consultation.'
  },
  {
    specialty: 'Cardiologist',
    icon: '🫀',
    keywords: [
      'heart', 'chest pain', 'bp', 'blood pressure', 'palpitations', 'hypertension',
      'irregular heartbeat', 'breathlessness on walking', 'cholesterol', 'cardiac', 'angina', 'high pulse'
    ],
    reason: 'Cardiovascular symptoms detected. Recommended specialist consultation for ECG, Echo and blood pressure management.'
  },
  {
    specialty: 'Pulmonologist & Asthma Care',
    icon: '🫁',
    keywords: [
      'asthma', 'breathing', 'wheezing', 'chest congestion', 'phlegm', 'heavy cough',
      'shortness of breath', 'bronchitis', 'lungs', 'inhaler', 'pneumonia', 'respiratory'
    ],
    reason: 'Respiratory & pulmonary tract symptoms detected. Pulmonologist consultation recommended for lung function and airway care.'
  },
  {
    specialty: 'Gynaecology & Obstetrics',
    icon: '🌸',
    keywords: [
      'period', 'pregnancy', 'cramp', 'pcos', 'pcod', 'menstrual', 'gynaecology',
      'gynae', 'pelvic pain', 'irregular periods', 'yeast infection', 'discharge', 'female health'
    ],
    reason: 'Obstetric & Gynecological health concern identified for specialized women’s health consultation.'
  },
  {
    specialty: 'Pediatrician & Child Health',
    icon: '👶',
    keywords: [
      'child', 'baby', 'pediatric', 'infant', 'vaccination', 'toddler', 'kids fever',
      'child cough', 'growth check'
    ],
    reason: 'Pediatric healthcare specialist recommended for child medical evaluation and growth milestones.'
  }
];

const QUICK_SYMPTOM_TAGS = [
  { label: '🌡️ Fever / Flu / Bukhar', query: 'high fever cold shivering body ache' },
  { label: '🦴 Knee / Bone / Joint Pain', query: 'knee joint pain ligament sprain back pain' },
  { label: '🧴 Skin / Rash / Allergy', query: 'skin rash itching acne redness allergy' },
  { label: '🧠 Stress / Anxiety / Sleep', query: 'stress anxiety insomnia exam panic mental' },
  { label: '👁️ Eye / Ear / Throat', query: 'sore throat earache red eye vision sinus' },
  { label: '🫁 Cough / Asthma / Lungs', query: 'chest congestion heavy cough breathing issue asthma' },
  { label: '🫀 Heart / Chest / BP', query: 'chest discomfort high blood pressure palpitations' },
  { label: '🌸 Women’s Health / Gynae', query: 'menstrual period cramps pcos gynae' },
  { label: '👶 Child / Pediatric Care', query: 'child baby pediatric fever health check' }
];

export default function BookingPage() {
  const { hospitalId } = useParams();
  const navigate = useNavigate();
  const { user, activeProfile } = useAuth();
  
  const [hospital, setHospital] = useState(null);
  const [loadingHospital, setLoadingHospital] = useState(true);
  const [step, setStep] = useState(1);
  const [isAutoPilot, setIsAutoPilot] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showMockRazorpay, setShowMockRazorpay] = useState(false);
  const [mockRzpOptions, setMockRzpOptions] = useState(null);
  
  const [isFlipped, setIsFlipped] = useState(false);
  const [upiVerified, setUpiVerified] = useState(false);
  const [verifyingUpi, setVerifyingUpi] = useState(false);
  const [verifiedName, setVerifiedName] = useState('');
  const [verifiedBank, setVerifiedBank] = useState('');

  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');

  // MedGemma AI Symptom Search & Filter State
  const [symptomSearch, setSymptomSearch] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [medGemmaRecommendation, setMedGemmaRecommendation] = useState(null);
  const [activeSpecialtyFilter, setActiveSpecialtyFilter] = useState('ALL');

  const [formData, setFormData] = useState({
    patientName: user?.name || '',
    patientPhone: user?.phone || '',
    age: '',
    gender: '',
    bookingDate: '',
    timeSlot: '',
    type: 'OFFLINE', // default to offline visit
    notes: '',
    symptoms: '',
    duration: '',
    allergies: 'None',
    medications: 'None',
    firstTime: 'yes',
    paymentMethod: 'CASH', // CASH or ONLINE
    onlineMethod: 'CARD', // CARD or UPI
    upiProvider: 'GPAY', // GPAY, PAYTM, PHONEPE
    upiId: '',
    upiPhone: '',
    cardName: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: ''
  });

  useEffect(() => {
    fetchHospitalDetails();
    fetchPatientProfile();
  }, [hospitalId]);

  const fetchPatientProfile = async () => {
    if (activeProfile) {
      setFormData(prev => ({
        ...prev,
        patientName: activeProfile.name || '',
        patientPhone: activeProfile.phone || '',
        age: activeProfile.age !== undefined && activeProfile.age !== null ? activeProfile.age.toString() : '',
        gender: activeProfile.gender || '',
        allergies: activeProfile.allergies || 'None',
        medications: activeProfile.currentMedication || 'None',
        firstTime: 'yes'
      }));
      return;
    }

    try {
      const res = await authAPI.getProfile();
      const profile = res.data;
      if (profile) {
        setFormData(prev => ({
          ...prev,
          patientName: profile.name || prev.patientName,
          patientPhone: profile.phone || prev.patientPhone,
          age: profile.age !== undefined && profile.age !== null ? profile.age.toString() : '',
          gender: profile.gender || '',
          allergies: profile.allergies || 'None',
          medications: profile.currentMedication || 'None',
          firstTime: profile.isFirstTimeUser === false ? 'no' : 'yes'
        }));
      }
    } catch (error) {
      console.error('Failed to load patient profile details', error);
    }
  };

  const getDoctorBusyStorageKey = (doctorId) => `medisphere_doctor_busy_${doctorId}`;

  const getDoctorBusyStatus = (doctorId) => {
    if (!doctorId) return { mode: 'NONE', date: '' };
    try {
      const stored = window.localStorage.getItem(getDoctorBusyStorageKey(doctorId));
      if (!stored) return { mode: 'NONE', date: '' };
      const parsed = JSON.parse(stored);
      return parsed && parsed.mode ? parsed : { mode: 'NONE', date: '' };
    } catch (error) {
      return { mode: 'NONE', date: '' };
    }
  };

  const parseSlotHour = (slot) => {
    if (!slot || typeof slot !== 'string') return null;
    const parts = slot.split(' ');
    if (parts.length < 2) return null;
    const [time, ampm] = parts;
    const [hourStr, minuteStr] = time.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
    let parsedHour = hour % 12;
    if (ampm.toUpperCase() === 'PM') parsedHour += 12;
    return parsedHour + minute / 60;
  };

  const parseTimeInputHour = (value) => {
    if (!value || typeof value !== 'string') return null;
    const [hourStr, minuteStr] = value.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
    return hour + minute / 60;
  };

  const isAfternoonSlot = (slot) => {
    const hour = parseSlotHour(slot);
    return hour !== null && hour >= 12;
  };

  const isSlotInTimeRange = (slot, startTime, endTime) => {
    const slotHour = parseSlotHour(slot);
    const startHour = parseTimeInputHour(startTime);
    const endHour = parseTimeInputHour(endTime);
    if (slotHour === null || startHour === null || endHour === null) return false;
    return slotHour >= startHour && slotHour < endHour;
  };

  const addLocalNotification = (role, note) => {
    try {
      const key = `medisphere_notifications_${role}`;
      const stored = window.localStorage.getItem(key);
      let list = [];
      if (stored) {
        list = JSON.parse(stored) || [];
      }
      const id = Date.now();
      const item = { id, ...note, read: false };
      list.unshift(item);
      if (list.length > 50) list = list.slice(0, 50);
      window.localStorage.setItem(key, JSON.stringify(list));
    } catch (err) {
      console.warn('Failed to add local notification', err);
    }
  };

  const filterBookedSlotsForBusyDoctor = (slots) => {
    const activeDocId = selectedDoctorId || hospital?.doctorId;
    if (!activeDocId || !formData.bookingDate) return slots;
    const busyStatus = getDoctorBusyStatus(activeDocId);
    if (busyStatus.mode === 'NONE' || busyStatus.date !== formData.bookingDate) return slots;
    if (busyStatus.mode === 'TODAY' || busyStatus.mode === 'ALL_DAY') return [];
    if (busyStatus.mode === 'AFTERNOON') return slots.filter(slot => !isAfternoonSlot(slot));
    if (busyStatus.mode === 'TIME_RANGE') {
      if (!busyStatus.startTime || !busyStatus.endTime) return slots;
      return slots.filter(slot => !isSlotInTimeRange(slot, busyStatus.startTime, busyStatus.endTime));
    }
    return slots;
  };

  useEffect(() => {
    if (formData.bookingDate && (selectedDoctorId || hospital?.doctorId)) {
      fetchAvailableSlots();
    } else {
      setAvailableSlots([]);
      setFormData(prev => ({ ...prev, timeSlot: '' }));
    }
  }, [formData.bookingDate, selectedDoctorId, hospital]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('autoPilot') === 'true') {
      setIsAutoPilot(true);
      const urlSymptoms = searchParams.get('symptoms');
      const urlTime = searchParams.get('time');
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];
      const timeStr = urlTime || '10:00 AM';

      const runAutoPilot = async () => {
        await new Promise(r => setTimeout(r, 1500));
        setFormData(prev => ({ ...prev, bookingDate: dateStr }));
        
        await new Promise(r => setTimeout(r, 1500));
        setFormData(prev => ({ ...prev, timeSlot: timeStr }));
        
        await new Promise(r => setTimeout(r, 1000));
        setStep(2);
        
        await new Promise(r => setTimeout(r, 1000));
        const baseSymptoms = urlSymptoms || "Routine checkup and slight headache.";
        const textToType = `${baseSymptoms} (Auto-filled by Astra AI)`;
        let currentText = "";
        for (let i = 0; i < textToType.length; i++) {
          currentText += textToType[i];
          setFormData(prev => ({ ...prev, symptoms: currentText }));
          await new Promise(r => setTimeout(r, 40));
        }
        
        await new Promise(r => setTimeout(r, 1000));
        setStep(3);
        
        await new Promise(r => setTimeout(r, 2000));
        const confirmBtn = document.getElementById('auto-confirm-btn');
        if (confirmBtn) {
          confirmBtn.click();
        }
      };
      
      runAutoPilot();
    }
  }, []);

  const fetchHospitalDetails = async () => {
    try {
      setLoadingHospital(true);
      const res = await hospitalAPI.getById(hospitalId);
      setHospital(res.data);

      try {
        setLoadingDoctors(true);
        const docsRes = await hospitalAPI.getDoctors(hospitalId);
        setDoctors(docsRes.data || []);
        if (docsRes.data && docsRes.data.length > 0) {
          setSelectedDoctorId(docsRes.data[0].id.toString());
        }
      } catch (err) {
        console.error('Failed to load doctors for hospital', err);
      } finally {
        setLoadingDoctors(false);
      }
    } catch (error) {
      toast.error('Failed to load hospital details');
      navigate('/dashboard');
    } finally {
      setLoadingHospital(false);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      setLoadingSlots(true);
      const activeDocId = selectedDoctorId || hospital.doctorId;
      const res = await bookingAPI.getAvailableSlots(activeDocId, formData.bookingDate);
      let filteredSlots = filterBookedSlotsForBusyDoctor(res.data || []);
      
      if (formData.bookingDate === getTodayString()) {
        const now = new Date();
        const currentHour = now.getHours() + now.getMinutes() / 60;
        filteredSlots = filteredSlots.filter(slot => {
          const slotHour = parseSlotHour(slot);
          return slotHour !== null && slotHour > currentHour;
        });
      }

      setAvailableSlots(filteredSlots);
      if (!filteredSlots.includes(formData.timeSlot)) {
        setFormData(prev => ({ ...prev, timeSlot: '' }));
      }
    } catch (error) {
      toast.error('Failed to load time slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'upiId') {
      setUpiVerified(false);
      setVerifiedName('');
      setVerifiedBank('');
    }
  };

  const handleVerifyUpi = async () => {
    if (!formData.upiId.trim()) {
      toast.error('Please enter a UPI ID first');
      return;
    }
    if (!formData.upiId.includes('@')) {
      toast.error('Invalid UPI ID format (must contain @)');
      return;
    }
    
    setVerifyingUpi(true);
    setUpiVerified(false);
    setVerifiedName('');
    setVerifiedBank('');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1200));
      const res = await authAPI.verifyUpi(formData.upiId);
      const { name, bankName, verified } = res.data;
      
      if (verified && name) {
        setVerifyingUpi(false);
        setUpiVerified(true);
        setVerifiedName(name);
        setVerifiedBank(bankName || 'UPI Bank');
        toast.success(`UPI verified — Account holder: ${name}`);
      } else {
        setVerifyingUpi(false);
        toast.error('Could not verify this UPI ID. Please check and try again.');
      }
    } catch (error) {
      setVerifyingUpi(false);
      toast.error('UPI Verification failed. Please try again.');
    }
  };

  // MedGemma AI Clinical Symptom Matching Logic
  const analyzeSymptomsWithMedGemma = (queryText) => {
    if (!queryText || !queryText.trim()) {
      setMedGemmaRecommendation(null);
      setActiveSpecialtyFilter('ALL');
      return;
    }

    const cleanQuery = queryText.toLowerCase().trim();
    
    let bestMatch = null;
    let highestScore = 0;
    let matchedKws = [];

    for (const rule of MEDGEMMA_SPECIALTY_RULES) {
      let score = 0;
      const hits = [];
      for (const kw of rule.keywords) {
        if (cleanQuery.includes(kw)) {
          score += 2;
          hits.push(kw);
        }
      }
      if (cleanQuery.includes(rule.specialty.toLowerCase())) {
        score += 6;
      }
      if (score > highestScore) {
        highestScore = score;
        bestMatch = rule;
        matchedKws = hits;
      }
    }

    if (bestMatch && highestScore > 0) {
      const rec = {
        specialty: bestMatch.specialty,
        icon: bestMatch.icon,
        reason: bestMatch.reason,
        matchedKeywords: matchedKws,
        query: queryText,
        confidence: highestScore >= 4 ? 99 : 91
      };
      setMedGemmaRecommendation(rec);
      setActiveSpecialtyFilter(bestMatch.specialty);

      // Auto-select the first matching doctor if available
      const matchingDoc = doctors.find(doc => {
        const spec = (doc.specialization || '').toLowerCase();
        return spec.includes(bestMatch.specialty.toLowerCase()) || bestMatch.specialty.toLowerCase().includes(spec);
      });
      if (matchingDoc) {
        setSelectedDoctorId(matchingDoc.id.toString());
      }
    } else {
      setMedGemmaRecommendation({
        specialty: 'General Physician',
        icon: '🩺',
        reason: 'MedGemma AI suggests starting with a General Physician for primary clinical triage and baseline diagnostics.',
        matchedKeywords: [],
        query: queryText,
        confidence: 85
      });
      setActiveSpecialtyFilter('General Physician');
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSymptomSearch(val);
    analyzeSymptomsWithMedGemma(val);
    setFormData(prev => ({ ...prev, symptoms: val }));
  };

  const handleQuickTagClick = (tag) => {
    setSymptomSearch(tag.label);
    analyzeSymptomsWithMedGemma(tag.query);
    setFormData(prev => ({ ...prev, symptoms: `${tag.label} - ${tag.query}` }));
    toast.success(`MedGemma AI matched: ${tag.label}`);
  };

  const handleClearSearch = () => {
    setSymptomSearch('');
    setMedGemmaRecommendation(null);
    setActiveSpecialtyFilter('ALL');
  };

  const toggleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice input is not supported in this browser. Please type your symptoms.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        toast('Listening to your symptoms... Speak now 🎙️', { icon: '🤖' });
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSymptomSearch(transcript);
        analyzeSymptomsWithMedGemma(transcript);
        setFormData(prev => ({ ...prev, symptoms: transcript }));
        setIsListening(false);
        toast.success(`Heard: "${transcript}"`);
      };

      recognition.onerror = () => {
        setIsListening(false);
        toast.error('Voice recognition error. Please type your symptoms.');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      setIsListening(false);
      toast.error('Voice search unavailable');
    }
  };

  const handleSelectDoctorAndFocusSlots = (docId) => {
    setSelectedDoctorId(docId.toString());
    setFormData(prev => ({ ...prev, timeSlot: '' })); // reset slot on doctor select
    toast.success('Doctor selected! Please pick your preferred date and time slot below.');
    
    // Smooth scroll to the appointment date and time slot picker
    setTimeout(() => {
      const slotSection = document.getElementById('booking-slot-section');
      if (slotSection) {
        slotSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);
  };

  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    const formattedValue = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    setFormData(prev => ({ ...prev, cardNumber: formattedValue }));
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length > 2) {
      value = value.slice(0, 2) + '/' + value.slice(2);
    }
    setFormData(prev => ({ ...prev, cardExpiry: value }));
  };

  const handleCvvChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 3) value = value.slice(0, 3);
    setFormData(prev => ({ ...prev, cardCvv: value }));
  };

  const validateStep1 = () => {
    if (!formData.patientName.trim()) return 'Patient name is required';
    if (!formData.patientPhone.trim()) return 'Phone number is required';
    if (!formData.age || parseInt(formData.age) <= 0) return 'Please enter a valid age';
    if (!formData.gender) return 'Please select a gender';
    if (!formData.bookingDate) return 'Please choose a date';
    if (formData.bookingDate < getTodayString()) return 'Booking date cannot be in the past';
    if (!formData.timeSlot) return 'Please choose a time slot';

    if (formData.bookingDate === getTodayString()) {
      const now = new Date();
      const currentHour = now.getHours() + now.getMinutes() / 60;
      const slotHour = parseSlotHour(formData.timeSlot);
      if (slotHour !== null && slotHour <= currentHour) {
        return 'Selected time slot has already passed';
      }
    }
    return null;
  };

  const validateStep2 = () => {
    if (!formData.symptoms.trim()) return 'Please describe your symptoms';
    if (!formData.duration) return 'Please specify the duration';
    return null;
  };

  const validateStep3 = () => {
    if (formData.type === 'ONLINE' && formData.paymentMethod === 'CASH') {
      return 'Pay at Reception is not available for online consultations. Please choose Pay Online.';
    }

    if (formData.paymentMethod === 'ONLINE') {
      if (formData.onlineMethod === 'CARD') {
        if (!formData.cardName.trim()) return 'Cardholder name is required';
        if (formData.cardNumber.replace(/\s/g, '').length !== 16) return 'Invalid Card Number (must be 16 digits)';
        
        const expiryParts = formData.cardExpiry.split('/');
        if (expiryParts.length !== 2 || expiryParts[0].length !== 2 || expiryParts[1].length !== 2) {
          return 'Expiry must be in MM/YY format';
        }
        
        const month = parseInt(expiryParts[0]);
        const year = parseInt('20' + expiryParts[1]);
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        
        if (month < 1 || month > 12) return 'Invalid expiry month';
        if (year < currentYear || (year === currentYear && month < currentMonth)) {
          return 'Card has expired';
        }

        if (formData.cardCvv.length !== 3) return 'CVV must be 3 digits';
      } else if (formData.onlineMethod === 'UPI') {
        if (!formData.upiId.trim()) return 'UPI ID is required';
        if (!formData.upiId.includes('@')) return 'Invalid UPI ID format (must contain @)';
        if (!upiVerified) return 'Please verify your UPI ID before proceeding';
      }
    }
    return null;
  };

  const handleNextStep = () => {
    let error = null;
    if (step === 1) {
      error = validateStep1();
      if (!error && formData.type === 'ONLINE') {
        setFormData(prev => ({ ...prev, paymentMethod: 'ONLINE' }));
      }
    } else if (step === 2) {
      error = validateStep2();
    }

    if (error) {
      toast.error(error);
      return;
    }
    
    setStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setStep(prev => prev - 1);
  };  const handleConfirmBooking = async () => {
    const error = validateStep3();
    if (error) {
      toast.error(error);
      return;
    }

    try {
      setSubmitting(true);
      
      const actualMethodName = formData.paymentMethod === 'ONLINE' 
        ? (formData.onlineMethod === 'UPI' ? formData.upiProvider : 'CARD') 
        : 'CASH';

      const activeDocId = selectedDoctorId || hospital?.doctorId;
      const activeDocObj = doctors.find(d => d.id.toString() === activeDocId.toString());
      const activeDoctorName = activeDocObj ? activeDocObj.name : (hospital?.doctorName || 'Doctor');
      
      if (formData.paymentMethod === 'ONLINE') {
        const orderToast = toast.loading('Initializing secure checkout order...');
        
        const orderResponse = await paymentAPI.createOrder({
          hospitalId: hospital.id,
          amount: parseFloat(hospital.consultationRate)
        });
        
        const { orderId, amount, keyId } = orderResponse.data;
        toast.dismiss(orderToast);
        
        const options = {
          key: keyId, // public key from backend
          amount: amount * 100, // amount in paise
          currency: "INR",
          name: "MediSphere Care",
          description: `Consultation Booking at ${hospital.name}`,
          order_id: orderId,
          handler: async function (response) {
            const verifyToast = toast.loading('Verifying transaction details...');
            try {
              const verifyPayload = {
                hospitalId: hospital.id,
                doctorId: activeDocId,
                bookingDate: formData.bookingDate,
                timeSlot: formData.timeSlot,
                type: formData.type,
                notes: `Assessment details - Duration: ${formData.duration}. Allergies: ${formData.allergies}. Medications: ${formData.medications}. First time: ${formData.firstTime}. Patient Notes: ${formData.notes}`,
                patientName: formData.patientName,
                patientPhone: formData.patientPhone,
                age: parseInt(formData.age),
                gender: formData.gender,
                symptoms: formData.symptoms,
                paymentMethod: actualMethodName,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
                familyMemberId: activeProfile ? activeProfile.id : null
              };
              
              await paymentAPI.verifyPayment(verifyPayload);
              toast.success('Payment verified & Booking Confirmed!', { id: verifyToast });
              try {
                const patientNote = {
                  title: 'Booking Confirmed',
                  message: `Your booking with ${activeDoctorName} is confirmed for ${formData.bookingDate} ${formData.timeSlot}.`,
                  time: 'Just now'
                };
                const doctorNote = {
                  title: 'New Booking',
                  message: `${formData.patientName} booked ${formData.bookingDate} ${formData.timeSlot} at ${hospital.name}.`,
                  time: 'Just now'
                };
                addLocalNotification('PATIENT', patientNote);
                addLocalNotification('DOCTOR', doctorNote);
              } catch (e) {
                console.warn('Notification creation failed', e);
              }
              navigate('/my-bookings');
            } catch (err) {
              toast.dismiss(verifyToast);
              const errMsg = err.response?.data?.message || 'Verification failed';
              toast.error(errMsg);
            } finally {
              setSubmitting(false);
              setShowMockRazorpay(false);
            }
          },
          prefill: {
            name: formData.patientName,
            contact: formData.patientPhone,
            email: user?.email || ''
          },
          notes: {
            hospital_name: hospital.name,
            doctor_name: activeDoctorName
          },
          theme: {
            color: "#00D9A6"
          },
          modal: {
            ondismiss: function() {
              toast.error('Payment checkout cancelled.');
              setSubmitting(false);
              setShowMockRazorpay(false);
            }
          }
        };
        
        if (orderId && orderId.startsWith("order_mock_")) {
          setMockRzpOptions(options);
          setShowMockRazorpay(true);
          setSubmitting(false);
        } else {
          const rzp = new window.Razorpay(options);
          rzp.open();
        }
      } else {
        const loadingToast = toast.loading('Confirming your booking...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const packedNotes = `Assessment details - Duration: ${formData.duration}. Allergies: ${formData.allergies}. Medications: ${formData.medications}. First time: ${formData.firstTime}. Patient Notes: ${formData.notes}`;

        const bookingPayload = {
          hospitalId: hospital.id,
          doctorId: activeDocId,
          bookingDate: formData.bookingDate,
          timeSlot: formData.timeSlot,
          type: formData.type,
          notes: packedNotes,
          patientName: formData.patientName,
          patientPhone: formData.patientPhone,
          age: parseInt(formData.age),
          gender: formData.gender,
          symptoms: formData.symptoms,
          paymentMethod: 'CASH',
          paymentStatus: 'PENDING',
          familyMemberId: activeProfile ? activeProfile.id : null
        };

        await bookingAPI.create(bookingPayload);
        toast.success('Booking confirmed successfully!', { id: loadingToast });
        try {
          const patientNote = {
            title: 'Booking Confirmed',
            message: `Your booking with ${activeDoctorName} is confirmed for ${formData.bookingDate} ${formData.timeSlot}.`,
            time: 'Just now'
          };
          const doctorNote = {
            title: 'New Booking',
            message: `${formData.patientName} booked ${formData.bookingDate} ${formData.timeSlot} at ${hospital.name}.`,
            time: 'Just now'
          };
          addLocalNotification('PATIENT', patientNote);
          addLocalNotification('DOCTOR', doctorNote);
        } catch (e) {
          console.warn('Notification creation failed', e);
        }
        navigate('/my-bookings');
      }
    } catch (error) {
      toast.dismiss();
      const errorMsg = error.response?.data?.message || 'Failed to initialize booking';
      toast.error(errorMsg);
      setSubmitting(false);
    }
  };

  const getCardBrand = (number) => {
    const cleanNumber = number.replace(/\D/g, '');
    if (cleanNumber.startsWith('4')) return 'VISA';
    if (cleanNumber.startsWith('5')) return 'MASTERCARD';
    if (cleanNumber.startsWith('3')) return 'AMEX';
    if (cleanNumber.startsWith('6')) return 'RUPAY';
    return 'CARD';
  };

  const getTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  if (loadingHospital) {
    return (
      <div className="page-container section flex-center" style={{ height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="skeleton-loader" style={{ width: '100%', maxWidth: '800px', height: '450px', borderRadius: 'var(--radius-lg)' }}></div>
      </div>
    );
  }

  return (
    <div className="page-container section" style={{ minHeight: '90vh' }}>
      
      {/* Styles local to this page to make card checkout extremely beautiful */}
      <style>{`
        .booking-layout {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 32px;
          align-items: start;
        }

        .booking-steps-nav {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
          position: relative;
        }

        .booking-steps-nav::before {
          content: '';
          position: absolute;
          top: 20px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--border-color);
          z-index: 1;
        }

        .step-indicator {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 120px;
        }

        .step-bubble {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: var(--bg-tertiary);
          border: 2px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: var(--text-muted);
          transition: all 0.3s ease;
          font-family: var(--font-display);
        }

        .step-indicator.active .step-bubble {
          background: var(--bg-primary);
          border-color: var(--primary);
          color: var(--primary);
          box-shadow: var(--shadow-glow);
        }

        .step-indicator.completed .step-bubble {
          background: var(--primary);
          border-color: var(--primary);
          color: var(--bg-primary);
        }

        .step-label {
          margin-top: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-align: center;
        }

        .step-indicator.active .step-label {
          color: var(--text-primary);
        }

        .step-indicator.completed .step-label {
          color: var(--primary);
        }

        /* Radio cards */
        .radio-card-group {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .radio-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 16px;
          cursor: pointer;
          transition: all var(--transition-normal);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .radio-card:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: var(--border-light);
        }

        .radio-card.selected {
          background: rgba(0, 217, 166, 0.05);
          border-color: var(--primary);
          box-shadow: 0 0 10px rgba(0, 217, 166, 0.1);
        }

        .radio-card-title {
          font-weight: 600;
          font-size: 0.95rem;
          color: var(--text-primary);
        }

        .radio-card-desc {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        /* MedGemma AI Symptom Search Box */
        .medgemma-search-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          border-radius: 14px;
          padding: 18px 20px;
          margin-bottom: 22px;
          position: relative;
        }

        .medgemma-search-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          flex-wrap: wrap;
          gap: 8px;
        }

        .medgemma-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(0, 217, 166, 0.12);
          border: none;
          color: var(--primary);
          font-size: 0.78rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
          letter-spacing: 0.4px;
        }

        .medgemma-search-input-wrapper {
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          padding: 4px 8px 4px 12px;
          gap: 8px;
          transition: all 0.2s ease;
        }

        .medgemma-search-input-wrapper:focus-within {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(0, 217, 166, 0.12);
          background: rgba(255, 255, 255, 0.06);
        }

        .medgemma-search-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-primary);
          font-size: 0.92rem;
          padding: 8px 4px;
        }

        .medgemma-search-input::placeholder {
          color: var(--text-muted);
        }

        .medgemma-btn-icon {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          border-radius: 8px;
          padding: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .medgemma-btn-icon:hover {
          background: rgba(0, 217, 166, 0.15);
          color: var(--primary);
          border-color: var(--primary);
        }

        .medgemma-btn-icon.listening {
          background: rgba(239, 68, 68, 0.2);
          border-color: #ef4444;
          color: #ef4444;
          animation: pulse 1.5s infinite;
        }

        .medgemma-search-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 14px;
        }

        .medgemma-chip {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          border-radius: 16px;
          padding: 5px 12px;
          font-size: 0.78rem;
          cursor: pointer;
          transition: all 0.18s ease;
          user-select: none;
        }

        .medgemma-chip:hover {
          background: rgba(0, 217, 166, 0.1);
          border-color: var(--primary);
          color: var(--primary);
          transform: translateY(-1px);
        }

        .medgemma-chip.active {
          background: rgba(0, 217, 166, 0.18);
          border-color: var(--primary);
          color: var(--primary);
          font-weight: 600;
        }

        .medgemma-recommendation-banner {
          margin-top: 16px;
          background: rgba(0, 217, 166, 0.08);
          border: 1px solid rgba(0, 217, 166, 0.3);
          border-radius: 10px;
          padding: 14px 16px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          animation: fadeIn 0.3s ease-in-out;
        }

        /* Doctors Grid styling */
        .doctors-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-top: 12px;
          margin-bottom: 24px;
        }

        @media (max-width: 1024px) {
          .doctors-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .doctors-grid {
            grid-template-columns: 1fr;
          }
        }

        .doctor-grid-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          border-radius: 14px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.22s ease;
          display: flex;
          flex-direction: column;
          gap: 12px;
          position: relative;
        }

        .doctor-grid-card:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: var(--primary);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        }

        .doctor-grid-card.selected {
          background: rgba(0, 217, 166, 0.04);
          border: 2px solid var(--primary);
          box-shadow: 0 4px 24px rgba(0, 217, 166, 0.12);
        }

        .doctor-recommended-badge {
          position: absolute;
          top: -10px;
          right: 14px;
          background: linear-gradient(135deg, var(--primary) 0%, #059669 100%);
          color: #032e24;
          font-weight: 700;
          font-size: 0.72rem;
          padding: 3px 10px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 4px;
          box-shadow: 0 2px 8px rgba(0, 217, 166, 0.3);
          letter-spacing: 0.3px;
        }

        .doctor-grid-top-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .doctor-grid-avatar-wrapper {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid rgba(0, 217, 166, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .doctor-grid-avatar {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .doctor-grid-info {
          display: flex;
          flex-direction: column;
          gap: 3px;
          flex: 1;
          min-width: 0;
        }

        .doctor-grid-name {
          font-weight: 700;
          color: var(--text-primary);
          font-size: 0.96rem;
          line-height: 1.2;
        }

        .specialty-pill {
          display: inline-block;
          font-size: 0.76rem;
          color: var(--primary);
          background: rgba(0, 217, 166, 0.1);
          padding: 2px 8px;
          border-radius: 6px;
          font-weight: 500;
          width: fit-content;
        }

        .doctor-grid-rating {
          font-size: 0.78rem;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: 1px;
        }

        .doctor-grid-star {
          color: #FFC107;
          font-weight: bold;
        }

        .doctor-details-box {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .doctor-schedule-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.78rem;
          gap: 6px;
        }

        .schedule-days-pill {
          color: var(--text-primary);
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .schedule-time-pill {
          color: var(--text-muted);
          font-size: 0.75rem;
          white-space: nowrap;
        }

        .doctor-pricing-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 6px;
          border-top: 1px solid rgba(255, 255, 255, 0.04);
          gap: 8px;
        }

        .fee-tag {
          color: var(--text-primary);
          font-size: 0.8rem;
        }

        .consult-type-badge {
          background: rgba(255, 255, 255, 0.05);
          padding: 2px 7px;
          border-radius: 4px;
          font-size: 0.72rem;
          color: var(--text-secondary);
        }

        .btn-doctor-select {
          width: 100%;
          padding: 9px 14px;
          border-radius: 8px;
          font-size: 0.84rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          border: 1px solid var(--primary);
          background: rgba(0, 217, 166, 0.1);
          color: var(--primary);
          transition: all 0.2s ease;
        }

        .btn-doctor-select:hover {
          background: var(--primary);
          color: #032e24;
        }

        .btn-doctor-select.btn-selected {
          background: linear-gradient(135deg, var(--primary) 0%, #10b981 100%);
          color: #032e24;
          border-color: transparent;
          font-weight: 700;
        }
          justify-content: center;
        }

        /* Credit card 3d design */
        .credit-card-wrapper {
          perspective: 1000px;
          width: 100%;
          max-width: 320px;
          height: 190px;
          margin: 0 auto 24px;
        }

        .credit-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          text-align: left;
          transition: transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          transform-style: preserve-3d;
        }

        .credit-card-wrapper.flipped .credit-card-inner {
          transform: rotateY(180deg);
        }

        .credit-card-front, .credit-card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: var(--shadow-lg);
          border: 1px solid rgba(255, 255, 255, 0.15);
        }

        .credit-card-front {
          background: linear-gradient(135deg, #1d2671 0%, #c33764 100%);
        }

        .credit-card-back {
          background: linear-gradient(135deg, #c33764 0%, #1d2671 100%);
          transform: rotateY(180deg);
          padding: 20px 0;
        }

        .card-chip {
          width: 40px;
          height: 30px;
          background: linear-gradient(135deg, #ffd700, #b8860b);
          border-radius: 4px;
        }

        .card-brand-logo {
          font-family: var(--font-display);
          font-weight: 800;
          font-style: italic;
          font-size: 1.2rem;
          color: white;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }

        .card-display-number {
          font-family: 'Courier New', Courier, monospace;
          font-size: 1.15rem;
          letter-spacing: 2px;
          word-spacing: 4px;
          color: white;
          margin: 20px 0 10px;
        }

        .card-display-info {
          display: flex;
          justify-content: space-between;
        }

        .card-display-label {
          font-size: 0.6rem;
          color: rgba(255,255,255,0.6);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .card-display-val {
          font-size: 0.8rem;
          font-weight: 600;
          color: white;
          text-transform: uppercase;
        }

        .card-magnetic-stripe {
          width: 100%;
          height: 40px;
          background: #111;
        }

        .card-signature-area {
          background: white;
          margin: 10px 20px 0;
          height: 35px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding: 0 10px;
        }

        .card-display-cvv {
          font-family: 'Courier New', Courier, monospace;
          font-weight: 700;
          font-style: italic;
          color: #333;
        }

        .slots-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 10px;
          margin-top: 8px;
        }

        .slot-pill {
          padding: 10px;
          border-radius: var(--radius-sm);
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border-color);
          text-align: center;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .slot-pill:hover:not(.disabled) {
          border-color: var(--primary-light);
          background: rgba(0, 217, 166, 0.02);
        }

        .slot-pill.selected {
          background: var(--primary);
          border-color: var(--primary);
          color: var(--bg-primary);
          font-weight: 600;
        }

        .slot-pill.disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        @media (max-width: 900px) {
          .booking-layout {
            grid-template-columns: 1fr;
          }
        }

        /* select option color override */
        select.form-input option {
          background-color: #FFFFFF !important;
          color: #0F172A !important;
        }

        /* Mock Razorpay Modal Styles */
        .mock-rzp-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(11, 15, 26, 0.85);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: fadeIn 0.2s ease-out;
        }

        .mock-rzp-modal {
          width: 100%;
          max-width: 440px;
          background: #171c2f;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
          animation: scaleIn 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .mock-rzp-header {
          background: #0f1322;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .mock-rzp-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .mock-rzp-logo {
          font-family: var(--font-display);
          font-weight: 800;
          font-style: italic;
          font-size: 1.3rem;
          color: #00d9a6;
          letter-spacing: -0.5px;
        }

        .mock-rzp-badge {
          background: rgba(0, 217, 166, 0.1);
          color: #00d9a6;
          font-size: 0.7rem;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .mock-rzp-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .mock-rzp-amount-section {
          text-align: center;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 12px;
          padding: 16px;
          border: 1px dashed rgba(255, 255, 255, 0.08);
        }

        .mock-rzp-amount {
          font-size: 1.8rem;
          font-weight: 700;
          color: #fff;
        }

        .mock-rzp-orderid {
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-top: 4px;
          font-family: monospace;
        }

        .mock-rzp-details {
          display: flex;
          flex-direction: column;
          gap: 10px;
          font-size: 0.85rem;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 8px;
          padding: 12px;
        }

        .mock-rzp-row {
          display: flex;
          justify-content: space-between;
        }

        .mock-rzp-label {
          color: var(--text-secondary);
        }

        .mock-rzp-val {
          color: #fff;
          font-weight: 500;
        }

        .mock-rzp-warning {
          background: rgba(255, 179, 0, 0.05);
          border: 1px solid rgba(255, 179, 0, 0.15);
          border-radius: 8px;
          padding: 12px;
          font-size: 0.8rem;
          color: var(--warning);
          display: flex;
          gap: 8px;
          line-height: 1.4;
        }

        .mock-rzp-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 8px;
        }

        .mock-rzp-btn-success {
          background: var(--primary);
          color: var(--bg-primary);
          font-weight: 700;
          border: none;
          padding: 14px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 0.95rem;
          box-shadow: 0 4px 12px rgba(0, 217, 166, 0.2);
        }

        .mock-rzp-btn-success:hover {
          background: var(--primary-light);
          box-shadow: 0 6px 16px rgba(0, 217, 166, 0.35);
          transform: translateY(-1px);
        }

        .mock-rzp-btn-fail {
          background: rgba(255, 82, 82, 0.1);
          color: #ff5252;
          font-weight: 500;
          border: 1px solid rgba(255, 82, 82, 0.2);
          padding: 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 0.9rem;
        }

        .mock-rzp-btn-fail:hover {
          background: rgba(255, 82, 82, 0.18);
          border-color: #ff5252;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button 
          onClick={() => navigate('/dashboard')} 
          className="btn btn-ghost btn-icon"
          style={{ width: '40px', height: '40px', borderRadius: '50%' }}
        >
          <FiArrowLeft />
        </button>
        <div>
          <span className="badge badge-primary" style={{ marginBottom: '6px' }}>Booking intake</span>
          <h1 className="heading-md" style={{ margin: 0 }}>Book consultation</h1>
        </div>
      </div>

      {isAutoPilot && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'linear-gradient(90deg, #1d2671 0%, #c33764 100%)',
            color: 'white',
            padding: '12px 24px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontWeight: '600',
            boxShadow: '0 8px 24px rgba(195, 55, 100, 0.3)'
          }}
        >
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: '#00d9a6',
            boxShadow: '0 0 10px #00d9a6',
            animation: 'pulse-dot 1.5s infinite'
          }}></div>
          🤖 Astra AI is autonomously booking your appointment...
        </motion.div>
      )}

      <div className="booking-layout">
        
        {/* Main Booking Panel */}
        <div className="glass-card animate-slide-up" style={{ padding: '32px' }}>
          
          {/* Progress Indicators */}
          <div className="booking-steps-nav">
            <div className={`step-indicator ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
              <div className="step-bubble">{step > 1 ? '✓' : '1'}</div>
              <span className="step-label">Patient Details</span>
            </div>
            <div className={`step-indicator ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
              <div className="step-bubble">{step > 2 ? '✓' : '2'}</div>
              <span className="step-label">Symptom Assessment</span>
            </div>
            <div className={`step-indicator ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
              <div className="step-bubble">3</div>
              <span className="step-label">Payment Options</span>
            </div>
          </div>

          <div className="divider"></div>

          {/* Form Step Switcher */}
          <AnimatePresence mode="wait">
            
            {/* STEP 1: PATIENT DETAILS */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="heading-sm" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiUser color="var(--primary)" /> Demographics & Date selection
                </h3>

                {/* Auto-filled Patient Info Header */}
                <div style={{ 
                  background: 'rgba(0, 217, 166, 0.04)', 
                  border: '1px solid rgba(0, 217, 166, 0.15)', 
                  borderRadius: 'var(--radius-md)', 
                  padding: '16px 20px', 
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'rgba(0, 217, 166, 0.1)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '1.1rem'
                  }}>
                    {formData.patientName ? formData.patientName.charAt(0).toUpperCase() : 'P'}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                      Booking for {formData.patientName || 'Patient'}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {formData.gender ? `${formData.gender}, ` : ''}{formData.age ? `Age ${formData.age}` : ''} {formData.patientPhone ? `• Phone: ${formData.patientPhone}` : ''}
                    </div>
                  </div>
                </div>

                {/* MedGemma AI Symptom Search & Specialist Recommendation Card */}
                <div className="medgemma-search-card">
                  <div className="medgemma-search-input-wrapper">
                    <FiSearch style={{ color: 'var(--primary)', fontSize: '1.1rem', flexShrink: 0 }} />
                    <input 
                      type="text"
                      className="medgemma-search-input"
                      placeholder="Describe symptoms or issue (e.g. fever, knee joint injury, skin rash, stress, throat pain)..."
                      value={symptomSearch}
                      onChange={handleSearchChange}
                    />
                    {symptomSearch && (
                      <button 
                        type="button" 
                        onClick={handleClearSearch}
                        className="medgemma-btn-icon"
                        title="Clear search"
                      >
                        <FiX />
                      </button>
                    )}
                    <button 
                      type="button"
                      onClick={toggleVoiceSearch}
                      className={`medgemma-btn-icon ${isListening ? 'listening' : ''}`}
                      title="Speak your symptoms"
                    >
                      {isListening ? <FiMicOff /> : <FiMic />}
                    </button>
                  </div>

                  {/* Quick Clickable Symptom Chips */}
                  <div className="medgemma-search-chips">
                    {QUICK_SYMPTOM_TAGS.map((tag, idx) => (
                      <div 
                        key={idx}
                        className={`medgemma-chip ${symptomSearch === tag.label ? 'active' : ''}`}
                        onClick={() => handleQuickTagClick(tag)}
                      >
                        {tag.label}
                      </div>
                    ))}
                  </div>

                  {/* MedGemma AI Recommendation Banner */}
                  {medGemmaRecommendation && (
                    <motion.div 
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="medgemma-recommendation-banner"
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                          <span style={{ fontSize: '1.2rem' }}>{medGemmaRecommendation.icon}</span>
                          <strong style={{ color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                            MedGemma AI Match: {medGemmaRecommendation.specialty}
                          </strong>
                          <span style={{ 
                            background: 'rgba(0, 217, 166, 0.2)', 
                            color: 'var(--primary)', 
                            fontSize: '0.72rem', 
                            padding: '2px 8px', 
                            borderRadius: '12px', 
                            fontWeight: '600' 
                          }}>
                            {medGemmaRecommendation.confidence}% Confidence
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                          {medGemmaRecommendation.reason}
                        </p>
                      </div>
                      <button 
                        type="button"
                        onClick={handleClearSearch}
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-secondary)',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Show All Doctors
                      </button>
                    </motion.div>
                  )}
                </div>

                {/* Doctor Selection */}
                {(() => {
                  const filteredDoctors = doctors.filter(doc => {
                    if (activeSpecialtyFilter === 'ALL' || !activeSpecialtyFilter) {
                      if (!symptomSearch.trim()) return true;
                      const q = symptomSearch.toLowerCase();
                      return (
                        (doc.name || '').toLowerCase().includes(q) ||
                        (doc.specialization || '').toLowerCase().includes(q)
                      );
                    }

                    const docSpec = (doc.specialization || '').toLowerCase();
                    const filterSpec = activeSpecialtyFilter.toLowerCase();
                    
                    if (docSpec.includes(filterSpec) || filterSpec.includes(docSpec)) return true;
                    
                    const docWords = docSpec.split(/[\s,&/]+/);
                    const filterWords = filterSpec.split(/[\s,&/]+/);
                    const overlap = docWords.some(w => w.length > 3 && filterWords.includes(w));
                    if (overlap) return true;

                    if (symptomSearch && doc.name.toLowerCase().includes(symptomSearch.toLowerCase())) return true;

                    return false;
                  });

                  const doctorsToShow = filteredDoctors.length > 0 ? filteredDoctors : doctors;

                  return (
                    <div className="form-group" style={{ marginBottom: '28px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                        <label className="form-label" style={{ fontWeight: '600', margin: 0 }}>
                          Select Consulting Doctor * {activeSpecialtyFilter !== 'ALL' && <span style={{ color: 'var(--primary)', fontSize: '0.82rem', fontWeight: 'normal' }}>({doctorsToShow.length} specialist doctor{doctorsToShow.length !== 1 ? 's' : ''} matched)</span>}
                        </label>
                        {activeSpecialtyFilter !== 'ALL' && (
                          <button 
                            type="button" 
                            onClick={handleClearSearch} 
                            style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
                          >
                            View all doctors
                          </button>
                        )}
                      </div>

                      {loadingDoctors ? (
                        <div className="skeleton" style={{ height: '140px', borderRadius: 'var(--radius-sm)' }}></div>
                      ) : doctorsToShow.length === 0 ? (
                        <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                          No doctors found for this criteria. <button onClick={handleClearSearch} style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Show all available doctors</button>
                        </div>
                      ) : (
                        <div className="doctors-grid">
                          {doctorsToShow.map(doc => {
                            const isSelected = selectedDoctorId.toString() === doc.id.toString();
                            const isRecommended = medGemmaRecommendation && (
                              (doc.specialization || '').toLowerCase().includes(medGemmaRecommendation.specialty.toLowerCase()) ||
                              medGemmaRecommendation.specialty.toLowerCase().includes((doc.specialization || '').toLowerCase())
                            );

                            return (
                              <div 
                                key={doc.id} 
                                className={`doctor-grid-card ${isSelected ? 'selected' : ''}`}
                                onClick={() => handleSelectDoctorAndFocusSlots(doc.id)}
                              >
                                {isRecommended && (
                                  <div className="doctor-recommended-badge">
                                    <FiZap /> AI Match ({medGemmaRecommendation.confidence}%)
                                  </div>
                                )}

                                <div className="doctor-grid-top-row">
                                  <div className="doctor-grid-avatar-wrapper">
                                    <img 
                                      src={doc.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(doc.name)}`} 
                                      alt={doc.name} 
                                      className="doctor-grid-avatar"
                                      onError={(e) => {
                                        e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(doc.name)}`;
                                      }}
                                    />
                                  </div>
                                  <div className="doctor-grid-info">
                                    <div className="doctor-grid-name">{doc.name}</div>
                                    <div className="doctor-grid-specialty">
                                      <span className="specialty-pill">{doc.specialization || 'General Physician'}</span>
                                    </div>
                                    <div className="doctor-grid-rating">
                                      <span className="doctor-grid-star">★</span> {doc.rating ? doc.rating.toFixed(1) : '4.8'} 
                                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: '4px' }}>
                                        ({doc.reviewsCount || 120}+ reviews)
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="doctor-details-box">
                                  <div className="doctor-schedule-row">
                                    <span className="schedule-days-pill">
                                      <FiClock style={{ color: 'var(--primary)' }} />
                                      {Array.isArray(doc.workingDays) ? doc.workingDays.join(', ') : (doc.workingDays || 'Mon - Fri')}
                                    </span>
                                    <span className="schedule-time-pill">
                                      {doc.workingHours || '09:00 AM - 05:00 PM'}
                                    </span>
                                  </div>
                                  <div className="doctor-pricing-row">
                                    <span className="fee-tag">
                                      Fee: <strong>{doc.fees === 0 || hospital?.consultationRate === 0 ? 'FREE' : `₹${doc.fees || hospital?.consultationRate || 200}`}</strong>
                                    </span>
                                    <span className="consult-type-badge">
                                      {doc.onlineConsultation ? '🌐 Online & In-Clinic' : '🏥 In-Clinic'}
                                    </span>
                                  </div>
                                </div>

                                <div style={{ marginTop: 'auto' }}>
                                  <button 
                                    type="button" 
                                    className={`btn-doctor-select ${isSelected ? 'btn-selected' : ''}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectDoctorAndFocusSlots(doc.id);
                                    }}
                                  >
                                    {isSelected ? (
                                      <>
                                        <FiCheckCircle /> Selected • Choose Slot Below
                                      </>
                                    ) : (
                                      <>
                                        Book Now <FiArrowRight />
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Appointment Date & Slot Picker Section */}
                <div id="booking-slot-section" style={{ scrollMarginTop: '80px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: '600' }}>Preferred Appointment Date *</label>
                    <div className="form-input-icon">
                      <FiCalendar className="icon" />
                      <input 
                        type="date" 
                        className="form-input" 
                        name="bookingDate"
                        value={formData.bookingDate}
                        onChange={handleInputChange}
                        min={getTodayString()}
                      />
                    </div>
                  </div>
                </div>

                {/* Available Slots Section */}
                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label className="form-label">Available Time Slots {loadingSlots && <span className="text-gradient" style={{ fontSize: '0.8rem', marginLeft: '8px' }}>(Loading...)</span>}</label>
                  
                  {!formData.bookingDate ? (
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      <FiInfo style={{ marginRight: '6px' }} /> Please select an appointment date first to see available slots.
                    </div>
                  ) : loadingSlots ? (
                    <div className="slots-grid">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="skeleton" style={{ height: '42px', borderRadius: 'var(--radius-sm)' }}></div>
                      ))}
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div style={{ background: 'rgba(255,82,82,0.02)', border: '1px dashed var(--danger)', borderRadius: 'var(--radius-md)', padding: '20px', textAlign: 'center', color: 'var(--danger)' }}>
                      {(() => {
                        const busyStatus = getDoctorBusyStatus(hospital?.doctorId);
                        if ((busyStatus.mode === 'TODAY' || busyStatus.mode === 'ALL_DAY') && busyStatus.date === formData.bookingDate) {
                          return 'This doctor is busy all day on the selected date. Please choose another date or try again later.';
                        }
                        if (busyStatus.mode === 'AFTERNOON' && busyStatus.date === formData.bookingDate) {
                          return 'This doctor is busy this afternoon. Only morning slots are available if you choose a different morning date.';
                        }
                        return 'No available slots found for the chosen date. Try selecting another date.';
                      })()}
                    </div>
                  ) : (
                    <div className="slots-grid">
                      {availableSlots.map(slot => (
                        <div 
                          key={slot}
                          className={`slot-pill ${formData.timeSlot === slot ? 'selected' : ''}`}
                          onClick={() => setFormData(prev => ({ ...prev, timeSlot: slot }))}
                        >
                          {slot}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-group" style={{ marginTop: '24px' }}>
                  <label className="form-label">Consultation Type</label>
                  <div className="radio-card-group">
                    <div 
                      className={`radio-card ${formData.type === 'OFFLINE' ? 'selected' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, type: 'OFFLINE' }))}
                    >
                      <span className="radio-card-title">In-Person Checkup</span>
                      <span className="radio-card-desc">Visit the physical hospital for direct consultation.</span>
                    </div>
                    <div 
                      className={`radio-card ${formData.type === 'ONLINE' ? 'selected' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, type: 'ONLINE' }))}
                    >
                      <span className="radio-card-title">Online Video Consultation</span>
                      <span className="radio-card-desc">Consult the doctor securely from your home via browser video.</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
                  <button onClick={handleNextStep} className="btn btn-primary">
                    Next Step <FiArrowRight />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: INTAKE QUESTIONS */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="heading-sm" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiActivity color="var(--primary)" /> Symptom Assessment
                </h3>

                {/* Auto-filled Medical History Info */}
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.02)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: 'var(--radius-md)', 
                  padding: '14px 18px', 
                  marginBottom: '24px',
                  fontSize: '0.85rem'
                }}>
                  <div style={{ fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.75rem' }}>
                    Linked Health Profile Details (From Signup)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div><span style={{ color: 'var(--text-muted)' }}>Known Allergies:</span> <span style={{ color: 'var(--text-primary)' }}>{formData.allergies || 'None'}</span></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Active Medications:</span> <span style={{ color: 'var(--text-primary)' }}>{formData.medications || 'None'}</span></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>First Time Visit:</span> <span style={{ color: 'var(--text-primary)' }}>{formData.firstTime === 'yes' ? 'Yes' : 'No'}</span></div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">What symptoms are you experiencing?</label>
                  <textarea 
                    className="form-input" 
                    name="symptoms"
                    rows="3"
                    value={formData.symptoms}
                    onChange={handleInputChange}
                    placeholder="Describe what symptoms you feel, their severity, etc."
                  ></textarea>
                </div>

                <div className="form-group">
                  <label className="form-label">How long have you had these symptoms?</label>
                  <select 
                    className="form-input" 
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                  >
                    <option value="">Choose Duration</option>
                    <option value="Less than 24 hours">Less than 24 hours</option>
                    <option value="1 to 3 days">1 to 3 days</option>
                    <option value="4 to 7 days">4 to 7 days</option>
                    <option value="1 to 2 weeks">1 to 2 weeks</option>
                    <option value="More than 2 weeks">More than 2 weeks</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Additional notes for the doctor (Optional)</label>
                  <textarea 
                    className="form-input" 
                    name="notes"
                    rows="2"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Any extra details you wish to share..."
                  ></textarea>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
                  <button onClick={handlePrevStep} className="btn btn-ghost">
                    <FiArrowLeft /> Back
                  </button>
                  <button onClick={handleNextStep} className="btn btn-primary">
                    Next Step <FiArrowRight />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: PAYMENT METHOD */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="heading-sm" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiCreditCard color="var(--primary)" /> Confirm payment & booking
                </h3>

                <div className="form-group">
                  <label className="form-label">Select Payment Preference</label>
                  <div className="radio-card-group" style={{ marginBottom: '24px' }}>
                    {formData.type !== 'ONLINE' && (
                      <div 
                        className={`radio-card ${formData.paymentMethod === 'CASH' ? 'selected' : ''}`}
                        onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'CASH' }))}
                      >
                        <span className="radio-card-title">Pay at Hospital Reception</span>
                        <span className="radio-card-desc">Pay by cash, card, or UPI when you arrive for checkup.</span>
                      </div>
                    )}
                    <div 
                      className={`radio-card ${formData.paymentMethod === 'ONLINE' ? 'selected' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'ONLINE' }))}
                    >
                      <span className="radio-card-title">Pay Online Now</span>
                      <span className="radio-card-desc">Prepay securely now to get immediate booking confirmation.</span>
                    </div>
                  </div>
                </div>

                {formData.paymentMethod === 'CASH' ? (
                  <div className="animate-fade-in" style={{ 
                    background: 'rgba(255, 179, 0, 0.05)', 
                    border: '1px solid rgba(255, 179, 0, 0.2)', 
                    borderRadius: 'var(--radius-lg)', 
                    padding: '24px',
                    marginBottom: '32px'
                  }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--warning)', margin: '0 0 8px 0', fontSize: '1rem' }}>
                      <FiInfo /> Pay at Reception Guidelines
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      Your booking will be logged in our system as **PENDING PAYMENT**. You must arrive at the hospital counter 15 minutes before your time slot (<strong>{formData.timeSlot}</strong>) on <strong>{formData.bookingDate}</strong> to clear the consultation charge of <strong>₹{hospital.consultationRate}</strong> and secure your token.
                    </p>
                  </div>
                ) : (
                  <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginBottom: '32px' }}>
                    
                    {/* Sub-tabs selector for Online Method */}
                    <div style={{ display: 'flex', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-color)', margin: '0 auto', maxWidth: '320px', width: '100%' }}>
                      <button 
                        type="button"
                        className={`btn btn-sm ${formData.onlineMethod === 'CARD' ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ flex: 1, borderRadius: 'var(--radius-full)', padding: '8px 12px' }}
                        onClick={() => setFormData(prev => ({ ...prev, onlineMethod: 'CARD' }))}
                      >
                        <FiCreditCard /> Card
                      </button>
                      <button 
                        type="button"
                        className={`btn btn-sm ${formData.onlineMethod === 'UPI' ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ flex: 1, borderRadius: 'var(--radius-full)', padding: '8px 12px' }}
                        onClick={() => setFormData(prev => ({ ...prev, onlineMethod: 'UPI' }))}
                      >
                        UPI
                      </button>
                    </div>

                    {/* Conditional Online Forms */}
                    {formData.onlineMethod === 'CARD' && (
                      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Interactive Glassmorphic Card Mockup */}
                        <div className={`credit-card-wrapper ${isFlipped ? 'flipped' : ''}`}>
                          <div className="credit-card-inner">
                            {/* Front View */}
                            <div className="credit-card-front">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div className="card-chip"></div>
                                <div className="card-brand-logo">{getCardBrand(formData.cardNumber)}</div>
                              </div>
                              <div className="card-display-number">
                                {formData.cardNumber || '•••• •••• •••• ••••'}
                              </div>
                              <div className="card-display-info">
                                <div>
                                  <div className="card-display-label">Card Holder</div>
                                  <div className="card-display-val">{formData.cardName || 'YOUR NAME'}</div>
                                </div>
                                <div>
                                  <div className="card-display-label">Expires</div>
                                  <div className="card-display-val">{formData.cardExpiry || 'MM/YY'}</div>
                                </div>
                              </div>
                            </div>
                            {/* Back View */}
                            <div className="credit-card-back">
                              <div className="card-magnetic-stripe"></div>
                              <div>
                                <div className="card-signature-area">
                                  <span className="card-display-cvv">{formData.cardCvv || '•••'}</span>
                                </div>
                                <div style={{ padding: '0 20px', marginTop: '10px' }}>
                                  <div className="card-display-label" style={{ textAlign: 'right' }}>Security Code</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Card Fields Form */}
                        <div className="grid grid-2">
                          <div className="form-group">
                            <label className="form-label">Cardholder Name</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              name="cardName"
                              value={formData.cardName}
                              onChange={handleInputChange}
                              onFocus={() => setIsFlipped(false)}
                              placeholder="e.g. Rahul Sharma"
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Card Number</label>
                            <div className="form-input-icon">
                              <FiCreditCard className="icon" />
                              <input 
                                type="text" 
                                className="form-input" 
                                name="cardNumber"
                                value={formData.cardNumber}
                                onChange={handleCardNumberChange}
                                onFocus={() => setIsFlipped(false)}
                                placeholder="4532 0124 5874 9632"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-2">
                          <div className="form-group">
                            <label className="form-label">Expiration Date (MM/YY)</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              name="cardExpiry"
                              value={formData.cardExpiry}
                              onChange={handleExpiryChange}
                              onFocus={() => setIsFlipped(false)}
                              placeholder="12/28"
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Security CVV (3 Digits)</label>
                            <input 
                              type="password" 
                              className="form-input" 
                              name="cardCvv"
                              value={formData.cardCvv}
                              onChange={handleCvvChange}
                              onFocus={() => setIsFlipped(true)}
                              onBlur={() => setIsFlipped(false)}
                              placeholder="***"
                              maxLength="3"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.onlineMethod === 'UPI' && (
                      <div className="animate-fade-in" style={{ 
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '32px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '24px'
                      }}>
                        {/* Sub-providers select: GPay, Paytm, PhonePe */}
                        <div>
                          <label className="form-label" style={{ marginBottom: '10px' }}>Select UPI App</label>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                              type="button"
                              className={`slot-pill ${formData.upiProvider === 'GPAY' ? 'selected' : ''}`}
                              style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}
                              onClick={() => setFormData(prev => ({ ...prev, upiProvider: 'GPAY' }))}
                            >
                              Google Pay
                            </button>
                            <button
                              type="button"
                              className={`slot-pill ${formData.upiProvider === 'PAYTM' ? 'selected' : ''}`}
                              style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}
                              onClick={() => setFormData(prev => ({ ...prev, upiProvider: 'PAYTM' }))}
                            >
                              Paytm
                            </button>
                            <button
                              type="button"
                              className={`slot-pill ${formData.upiProvider === 'PHONEPE' ? 'selected' : ''}`}
                              style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}
                              onClick={() => setFormData(prev => ({ ...prev, upiProvider: 'PHONEPE' }))}
                            >
                              PhonePe
                            </button>
                          </div>
                        </div>

                        {/* UPI ID entry with Verify Action */}
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label">Enter UPI ID</label>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <div className="form-input-icon" style={{ flex: 1 }}>
                              <FiUser className="icon" />
                              <input 
                                type="text" 
                                className="form-input" 
                                name="upiId"
                                value={formData.upiId}
                                onChange={handleInputChange}
                                placeholder="username@bankname"
                                style={{ paddingRight: '12px' }}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={handleVerifyUpi}
                              className={`btn ${upiVerified ? 'btn-ghost' : 'btn-primary'}`}
                              disabled={verifyingUpi || !formData.upiId.trim()}
                              style={{ 
                                minWidth: '100px', 
                                height: '50px',
                                border: upiVerified ? '1px solid var(--success)' : '',
                                color: upiVerified ? 'var(--success)' : '',
                                background: upiVerified ? 'transparent' : ''
                              }}
                            >
                              {verifyingUpi ? 'Verifying...' : upiVerified ? '✓ Verified' : 'Verify'}
                            </button>
                          </div>

                          {/* Verification result below the field */}
                          {verifyingUpi && (
                            <div className="animate-fade-in" style={{ 
                              fontSize: '0.82rem', 
                              color: 'var(--text-secondary)', 
                              marginTop: '10px', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '8px',
                              padding: '12px 16px',
                              background: 'rgba(255, 255, 255, 0.02)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '10px'
                            }}>
                              <div style={{
                                width: '16px', height: '16px', borderRadius: '50%',
                                border: '2px solid var(--primary)', borderTopColor: 'transparent',
                                animation: 'spin 0.8s linear infinite'
                              }}></div>
                              <span>Verifying with NPCI... Fetching account holder details</span>
                            </div>
                          )}

                          {upiVerified && verifiedName && (
                            <div className="animate-fade-in" style={{ 
                              marginTop: '12px', 
                              padding: '16px 18px', 
                              background: 'rgba(0, 217, 166, 0.04)', 
                              border: '1px solid rgba(0, 217, 166, 0.2)', 
                              borderRadius: '12px',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                <FiCheckCircle color="var(--success)" size={18} />
                                <span style={{ fontSize: '0.78rem', color: 'var(--success)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                  NPCI Verified
                                </span>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Account Holder Name</span>
                                  <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: '700' }}>
                                    {verifiedName}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Linked Bank</span>
                                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                                    {verifiedBank}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>UPI ID</span>
                                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500', fontFamily: 'monospace' }}>
                                    {formData.upiId}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {!upiVerified && !verifyingUpi && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
                              Enter your UPI ID and click Verify. The real account holder name linked to this UPI will be shown.
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.8rem', justifyContent: 'center' }}>
                      <FiShield color="var(--success)" /> Fully encrypted, secure 256-bit SSL transaction gateway.
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
                  <button onClick={handlePrevStep} className="btn btn-ghost" disabled={submitting}>
                    <FiArrowLeft /> Back
                  </button>
                  <button 
                    id="auto-confirm-btn"
                    onClick={handleConfirmBooking} 
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? (
                      'Processing...'
                    ) : formData.paymentMethod === 'ONLINE' ? (
                      `Pay ₹${hospital.consultationRate} & Confirm`
                    ) : (
                      'Confirm Booking'
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Summary Widget */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 className="heading-sm" style={{ margin: '0 0 4px 0' }}>{hospital.name}</h3>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FiMapPin /> {hospital.city}, {hospital.state}
            </span>
          </div>

          <div className="divider" style={{ margin: '8px 0' }}></div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span className="form-label" style={{ margin: 0 }}>Consulting Practitioner</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="avatar">{hospital.doctorName?.charAt(0).toUpperCase()}</div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.95rem' }}>{hospital.doctorName}</strong>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Resident Doctor</span>
              </div>
            </div>
          </div>

          <div className="divider" style={{ margin: '8px 0' }}></div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Consultation fee:</span>
              <strong style={{ color: 'var(--primary)' }}>
                {doctors.find(d => d.id.toString() === selectedDoctorId)?.fees === 0 || hospital.consultationRate === 0 ? 'FREE' : `₹${doctors.find(d => d.id.toString() === selectedDoctorId)?.fees || hospital.consultationRate || 250}`}
              </strong>
            </div>

            {formData.bookingDate && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}><FiCalendar /> Date:</span>
                <span>{formData.bookingDate}</span>
              </div>
            )}

            {formData.timeSlot && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}><FiClock /> Time:</span>
                <span>{formData.timeSlot}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}><FiFileText /> Type:</span>
              <span>{formData.type === 'ONLINE' ? 'Video call' : 'Physical Visit'}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Mock Razorpay Gateway Sandbox Modal */}
      {showMockRazorpay && mockRzpOptions && (
        <div className="mock-rzp-overlay">
          <div className="mock-rzp-modal">
            <div className="mock-rzp-header">
              <div className="mock-rzp-brand">
                <span className="mock-rzp-logo">Razorpay</span>
                <span className="mock-rzp-badge">Sandbox Simulator</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                <FiShield color="#00d9a6" /> Secure
              </div>
            </div>
            <div className="mock-rzp-body">
              <div className="mock-rzp-amount-section">
                <div className="mock-rzp-amount">₹{mockRzpOptions.amount / 100}</div>
                <div className="mock-rzp-orderid">Order ID: {mockRzpOptions.order_id}</div>
              </div>

              <div className="mock-rzp-details">
                <div className="mock-rzp-row">
                  <span className="mock-rzp-label">Beneficiary:</span>
                  <span className="mock-rzp-val">{mockRzpOptions.name}</span>
                </div>
                <div className="mock-rzp-row">
                  <span className="mock-rzp-label">Description:</span>
                  <span className="mock-rzp-val" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {mockRzpOptions.description}
                  </span>
                </div>
                <div className="mock-rzp-row">
                  <span className="mock-rzp-label">Patient Contact:</span>
                  <span className="mock-rzp-val">{mockRzpOptions.prefill?.contact}</span>
                </div>
                <div className="mock-rzp-row">
                  <span className="mock-rzp-label">Online Method:</span>
                  <span className="mock-rzp-val" style={{ textTransform: 'uppercase', color: '#00d9a6' }}>
                    {formData.onlineMethod}
                  </span>
                </div>
              </div>

              <div className="mock-rzp-warning">
                <FiInfo style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <strong>Sandbox Mode:</strong> Real Razorpay credentials are not configured. Click "Confirm Payment" to confirm your booking.
                </span>
              </div>

              <div className="mock-rzp-actions">
                <button 
                  type="button" 
                  className="mock-rzp-btn-success"
                  onClick={() => {
                    mockRzpOptions.handler({
                      razorpay_payment_id: 'pay_mock_' + Math.random().toString(36).substring(2, 11),
                      razorpay_order_id: mockRzpOptions.order_id,
                      razorpay_signature: 'sig_mock_' + Math.random().toString(36).substring(2, 11)
                    });
                  }}
                >
                  <FiCheckCircle /> Confirm Payment
                </button>
                <button 
                  type="button" 
                  className="mock-rzp-btn-fail"
                  onClick={() => {
                    mockRzpOptions.modal.ondismiss();
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

