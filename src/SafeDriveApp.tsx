
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Shield, TrendingUp, AlertTriangle, CheckCircle, Car, User, Settings, Moon, Sun, LogOut } from 'lucide-react';
import { auth, db } from './firebase/config';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

type Alert = {
  id: number;
  type: 'speed' | 'success' | 'info' | 'error';
  message: string;
  timestamp: string;
};

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

const SafeDriveApp = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [speedLimit, setSpeedLimit] = useState(35);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);

  const [userProfile, setUserProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    licenseNumber: '',
    licenseState: 'NY'
  });

  const [vehicleInfo, setVehicleInfo] = useState({
    make: '',
    model: '',
    year: '',
    vin: '',
    licensePlate: '',
    color: ''
  });

  const [insuranceInfo, setInsuranceInfo] = useState({
    provider: '',
    policyNumber: '',
    groupNumber: '',
    effectiveDate: '',
    expirationDate: '',
    coverageType: 'Full Coverage',
    deductible: '500'
  });

  const carMakes = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'BMW', 'Mercedes-Benz', 'Audi', 'Nissan', 'Hyundai', 'Subaru'];
  const insuranceProviders = ['Progressive', 'State Farm', 'Geico', 'Allstate', 'USAA', 'Liberty Mutual', 'Farmers', 'Nationwide'];
  
  const [tripData, setTripData] = useState({
    distance: 0,
    duration: 0,
    averageSpeed: 0,
    maxSpeed: 0,
    speedViolations: 0,
    hardBraking: 0,
    rapidAcceleration: 0,
    safetyScore: 100
  });
  
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [mapProvider, setMapProvider] = useState('waze');
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserProfile(data.userProfile || userProfile);
          setVehicleInfo(data.vehicleInfo || vehicleInfo);
          setInsuranceInfo(data.insuranceInfo || insuranceInfo);
          setDarkMode(data.darkMode || false);
        }
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isTracking) {
      if (!navigator.geolocation) {
        setAlerts(prev => [...prev, {id: Date.now(), type: 'error', message: 'Geolocation is not supported.', timestamp: new Date().toLocaleTimeString()}]);
        return;
      }

      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, speed } = position.coords;
          const speedMph = speed ? Math.round(speed * 2.23694) : 0;
          setCurrentSpeed(speedMph);
          setLocation({ lat: latitude, lng: longitude });

          setTripData((prev) => ({
            ...prev,
            distance: prev.distance + (speedMph / 3600),
            duration: prev.duration + 1,
            maxSpeed: Math.max(prev.maxSpeed, speedMph),
            averageSpeed: (prev.averageSpeed * (prev.duration) + speedMph) / (prev.duration + 1),
            speedViolations: speedMph > speedLimit ? prev.speedViolations + 1 : prev.speedViolations,
            safetyScore: Math.max(0, 100 - (prev.speedViolations * 2))
          }));

          if (speedMph > speedLimit + 5) {
            setAlerts((prev) => [...prev.slice(-4), {
              id: Date.now(),
              type: 'speed',
              message: `Speed Alert: ${speedMph} mph in ${speedLimit} mph zone`,
              timestamp: new Date().toLocaleTimeString()
            }]);
          }
        },
        (error) => {
          setAlerts(prev => [...prev, {id: Date.now(), type: 'error', message: `Geolocation error: ${error.message}`, timestamp: new Date().toLocaleTimeString()}]);
          setIsTracking(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );

    } else {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    }

    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [isTracking, speedLimit]);

  const handleLogout = async () => {
    await signOut(auth);
    setUserProfile({ firstName: '', lastName: '', email: '', phone: '', licenseNumber: '', licenseState: 'NY' });
    setVehicleInfo({ make: '', model: '', year: '', vin: '', licensePlate: '', color: '' });
    setAlerts([]);
    setCurrentScreen('dashboard');
  };

  const saveProfile = async () => {
    if (!user) return;
    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { userProfile, vehicleInfo, insuranceInfo, darkMode }, { merge: true });
      setAlerts(prev => [...prev, { id: Date.now(), type: 'success', message: 'Profile saved successfully', timestamp: new Date().toLocaleTimeString() }]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred.";
      setAlerts(prev => [...prev, { id: Date.now(), type: 'error', message, timestamp: new Date().toLocaleTimeString() }]);
    }
  };
  
  const startTrip = () => {
    setIsTracking(true);
    setAlerts([]);
    setTripData({ distance: 0, duration: 0, averageSpeed: 0, maxSpeed: 0, speedViolations: 0, hardBraking: 0, rapidAcceleration: 0, safetyScore: 100 });
  };

  const endTrip = () => {
    setIsTracking(false);
    setCurrentSpeed(0);
  };

  const connectToMaps = (provider: string) => {
    setMapProvider(provider);
    const destination = "Times Square, New York, NY";
    const encodedDestination = encodeURIComponent(destination);
    const url = provider === 'waze' 
      ? `https://waze.com/ul?q=${encodedDestination}&navigate=yes`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodedDestination}`;
    
    window.open(url, '_blank');
    setAlerts(prev => [...prev, { id: Date.now(), type: 'info', message: `Opened ${provider} for directions.`, timestamp: new Date().toLocaleTimeString() }]);
  };

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const exportData = async () => {
    if (!user) return;
    const exportDataObj = {
      tripId: `trip_${Date.now()}`,
      userId: user.uid,
      timestamp: new Date().toISOString(),
      userProfile, vehicleInfo, insuranceInfo, tripData,
      alerts: alerts.filter(a => a.type === 'speed'),
      mapProvider, location
    };
    try {
      setAlerts(prev => [...prev, { id: Date.now(), type: 'info', message: 'Submitting data...', timestamp: new Date().toLocaleTimeString() }]);
      // Placeholder API call
      const response = await fetch('https://api.example.com/submit-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportDataObj)
      });
      if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
      
      setAlerts(prev => [...prev, { id: Date.now(), type: 'success', message: 'Trip data submitted successfully.', timestamp: new Date().toLocaleTimeString() }]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred.";
      setAlerts(prev => [...prev, { id: Date.now(), type: 'error', message: `Failed to submit data: ${message}`, timestamp: new Date().toLocaleTimeString() }]);
    }
  };

  const inputClass = `w-full p-2 border rounded-lg text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`;
  const labelClass = `block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`;

  if (!user) return <LoginScreen setAlerts={setAlerts} />;

  return (
    <div className={`min-h-screen p-4 ${darkMode ? 'bg-gray-900 text-white' : 'bg-blue-50'}`}>
      <div className={`max-w-md mx-auto rounded-2xl shadow-xl overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">SafeDrive</h1>
              <p className="text-blue-100">Welcome, {userProfile.firstName || user.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={toggleDarkMode} className="p-2 rounded-lg bg-blue-700 hover:bg-blue-800">
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button onClick={handleLogout} className="p-2 rounded-lg bg-red-600 hover:bg-red-700">
                  <LogOut size={20} />
              </button>
              <Shield className="h-10 w-10" />
            </div>
          </div>
          <div className="flex mt-4 space-x-1 bg-blue-700 rounded-lg p-1">
            <button onClick={() => setCurrentScreen('dashboard')} className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${currentScreen === 'dashboard' ? 'bg-white text-blue-700' : 'text-blue-100'}`}><Car size={16}/>Drive</button>
            <button onClick={() => setCurrentScreen('profile')} className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${currentScreen === 'profile' ? 'bg-white text-blue-700' : 'text-blue-100'}`}><User size={16}/>Profile</button>
            <button onClick={() => setCurrentScreen('vehicle')} className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${currentScreen === 'vehicle' ? 'bg-white text-blue-700' : 'text-blue-100'}`}><Settings size={16}/>Vehicle</button>
          </div>
        </div>

        <div className="max-h-[30rem] overflow-y-auto p-4">
          {currentScreen === 'dashboard' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Navigation</h3>
                <div className="flex gap-2">
                  <button onClick={() => connectToMaps('waze')} className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 ${mapProvider === 'waze' ? 'bg-blue-600 text-white' : (darkMode ? 'bg-gray-700' : 'bg-gray-100')}`}><Navigation size={16} /> Waze</button>
                  <button onClick={() => connectToMaps('gmaps')} className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 ${mapProvider === 'gmaps' ? 'bg-green-600 text-white' : (darkMode ? 'bg-gray-700' : 'bg-gray-100')}`}><MapPin size={16} /> Google Maps</button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                  <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <label className={labelClass}>Current Speed</label>
                    <div className="text-2xl font-bold text-blue-500">{currentSpeed} mph</div>
                  </div>
                  <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <label htmlFor="speed-limit-input" className={labelClass}>Speed Limit</label>
                    <input id="speed-limit-input" type="number" value={speedLimit} onChange={e => setSpeedLimit(Number(e.target.value))}
                           className={`${inputClass} text-2xl font-bold text-orange-500 bg-transparent`}/>
                  </div>
              </div>

              <div className="flex gap-3">
                  <button onClick={startTrip} disabled={isTracking} className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2"><CheckCircle size={16}/>{isTracking ? 'Tracking...' : 'Start Trip'}</button>
                  <button onClick={endTrip} disabled={!isTracking} className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold">End Trip</button>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Trip Analytics</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>Distance: <span className="font-medium">{tripData.distance.toFixed(1)} mi</span></div>
                    <div>Duration: <span className="font-medium">{Math.floor(tripData.duration / 60)}:{(tripData.duration % 60).toString().padStart(2, '0')}</span></div>
                    <div>Safety Score: <span className={`font-medium ${tripData.safetyScore > 90 ? 'text-green-500' : 'text-yellow-500'}`}>{tripData.safetyScore.toFixed(0)}%</span></div>
                    <div>Speed Violations: <span className="font-medium text-red-500">{tripData.speedViolations}</span></div>
                </div>
              </div>
              
              <button onClick={exportData} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2">
                  <TrendingUp size={16} /> Export Trip Data
              </button>

              <div>
                <h3 className="font-semibold mb-2">Live Alerts</h3>
                <div className="space-y-2 max-h-24 overflow-y-auto">
                  {alerts.length === 0 ? <p className="text-sm text-gray-500">No alerts.</p> :
                    alerts.map(a => (
                      <div key={a.id} className={`p-2 rounded text-sm flex items-center gap-2 ${a.type === 'speed' ? 'bg-red-100 text-red-800' : a.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                        <AlertTriangle size={16}/> {a.message} <span className="text-xs opacity-75 ml-auto">{a.timestamp}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          )}

          {currentScreen === 'profile' && (
            <div className="space-y-4">
              <h3 className="font-semibold">Driver Profile</h3>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelClass}>First Name</label><input type="text" value={userProfile.firstName} onChange={e => setUserProfile(p => ({...p, firstName: e.target.value}))} className={inputClass} /></div>
                <div><label className={labelClass}>Last Name</label><input type="text" value={userProfile.lastName} onChange={e => setUserProfile(p => ({...p, lastName: e.target.value}))} className={inputClass} /></div>
              </div>
              <div><label className={labelClass}>Email</label><input type="email" value={userProfile.email} onChange={e => setUserProfile(p => ({...p, email: e.target.value}))} className={inputClass} /></div>
              <div><label className={labelClass}>Phone</label><input type="tel" value={userProfile.phone} onChange={e => setUserProfile(p => ({...p, phone: e.target.value}))} className={inputClass} /></div>
              
              <h3 className="font-semibold pt-4 border-t border-gray-200">Insurance Information</h3>
              <div>
                <label className={labelClass}>Insurance Provider</label>
                <select value={insuranceInfo.provider} onChange={e => setInsuranceInfo(p => ({...p, provider: e.target.value}))} className={inputClass}>
                  <option value="">Select Provider</option>
                  {insuranceProviders.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div><label className={labelClass}>Policy Number</label><input type="text" value={insuranceInfo.policyNumber} onChange={e => setInsuranceInfo(p => ({...p, policyNumber: e.target.value}))} className={inputClass} /></div>

              <button onClick={saveProfile} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold">Save Profile Information</button>
            </div>
          )}

          {currentScreen === 'vehicle' && (
            <div className="space-y-4">
              <h3 className="font-semibold">Vehicle Information</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className={labelClass}>Make</label>
                    <select value={vehicleInfo.make} onChange={e => setVehicleInfo(p => ({...p, make: e.target.value}))} className={inputClass}>
                      <option value="">Select Make</option>
                      {carMakes.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
                <div><label className={labelClass}>Model</label><input type="text" value={vehicleInfo.model} onChange={e => setVehicleInfo(p => ({...p, model: e.target.value}))} className={inputClass} /></div>
                <div><label className={labelClass}>Year</label><input type="number" value={vehicleInfo.year} onChange={e => setVehicleInfo(p => ({...p, year: e.target.value}))} className={inputClass} /></div>
                <div><label className={labelClass}>License Plate</label><input type="text" value={vehicleInfo.licensePlate} onChange={e => setVehicleInfo(p => ({...p, licensePlate: e.target.value}))} className={inputClass} /></div>
              </div>
              <div><label className={labelClass}>VIN</label><input type="text" value={vehicleInfo.vin} onChange={e => setVehicleInfo(p => ({...p, vin: e.target.value}))} className={inputClass} /></div>
              <button onClick={saveProfile} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold">Save Vehicle Information</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const LoginScreen = ({ setAlerts }: { setAlerts: React.Dispatch<React.SetStateAction<Alert[]>> }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);

  const handleAuthAction = async () => {
    try {
      if (isSigningUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred.";
      setAlerts(prev => [...prev, { id: Date.now(), type: 'error', message, timestamp: new Date().toLocaleTimeString() }]);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-sm w-full p-8 space-y-6 bg-white rounded-2xl shadow-xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">SafeDrive</h1>
          <p className="text-gray-600">Your partner in safe driving.</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 mt-1 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 mt-1 border rounded-lg" />
          </div>
        </div>
        <div className="space-y-3">
           <button onClick={handleAuthAction} className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold">
            {isSigningUp ? 'Sign Up' : 'Log In'}
          </button>
          <button onClick={() => setIsSigningUp(!isSigningUp)} className="w-full py-2 text-sm text-blue-600 hover:underline">
            {isSigningUp ? 'Already have an account? Log In' : 'Need an account? Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SafeDriveApp;
