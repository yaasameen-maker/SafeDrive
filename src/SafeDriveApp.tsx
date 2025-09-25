import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Shield, TrendingUp, AlertTriangle, CheckCircle, Car, User, Settings, Moon, Sun } from 'lucide-react';

// Alert type must be declared outside JSX so TSX parser doesn't treat it as a JSX element
type Alert = {
  id: number;
  type: 'speed' | 'success' | 'info';
  message: string;
  timestamp: string;
};

// Provide a minimal JSX IntrinsicElements declaration so TS doesn't complain in projects
// that don't have a global JSX type setup (keeps this file self-contained).
declare global {
  namespace JSX {
    interface IntrinsicElements {
      // allow any intrinsic element with any props
      [elemName: string]: any;
    }
  }
}

const SafeDriveApp = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [speedLimit, setSpeedLimit] = useState(35);
  
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
    safetyScore: 95
  });
  
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [location, setLocation] = useState({ lat: 40.7128, lng: -74.0060 }); // NYC
  const [mapProvider, setMapProvider] = useState('waze');
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isTracking) {
      intervalRef.current = setInterval(() => {
        const newSpeed = Math.max(0, currentSpeed + (Math.random() - 0.5) * 10);
        setCurrentSpeed(Math.round(newSpeed));
        
        setTripData((prev: any) => ({
          ...prev,
          distance: prev.distance + (newSpeed / 3600),
          duration: prev.duration + 1,
          maxSpeed: Math.max(prev.maxSpeed, newSpeed),
          averageSpeed: Math.round((prev.averageSpeed + newSpeed) / 2),
          speedViolations: newSpeed > speedLimit ? prev.speedViolations + 1 : prev.speedViolations,
          safetyScore: Math.max(60, 100 - (prev.speedViolations * 2) - (prev.hardBraking * 3))
        }));

        if (newSpeed > speedLimit + 5) {
          setAlerts((prev: Alert[]) => [...prev.slice(-4), {
            id: Date.now(),
            type: 'speed',
            message: `Speed Alert: ${newSpeed} mph in ${speedLimit} mph zone`,
            timestamp: new Date().toLocaleTimeString()
          }]);
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isTracking, currentSpeed, speedLimit]);

  const startTrip = () => {
    setIsTracking(true);
    setCurrentSpeed(25);
    setAlerts([]);
    setTripData({
      distance: 0,
      duration: 0,
      averageSpeed: 0,
      maxSpeed: 0,
      speedViolations: 0,
      hardBraking: 0,
      rapidAcceleration: 0,
      safetyScore: 100
    });
  };

  const endTrip = () => {
    setIsTracking(false);
    setCurrentSpeed(0);
  };

  const connectToMaps = (provider: string) => {
    setMapProvider(provider);
    setAlerts((prev: Alert[]) => [...prev, {
      id: Date.now(),
      type: 'info',
      message: `Connected to ${provider === 'waze' ? 'Waze' : 'Google Maps'}` ,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const exportData = () => {
    const exportDataObj = {
      tripId: `trip_${Date.now()}` ,
      startTime: new Date().toISOString(),
      userProfile: userProfile,
      vehicleInfo: vehicleInfo,
      insuranceInfo: insuranceInfo,
      tripData: tripData,
      alerts: alerts,
      mapProvider: mapProvider,
      darkMode: darkMode,
      location: location
    };
    
    console.log('Exporting to Insurance API:', exportDataObj);
    setAlerts((prev: Alert[]) => [...prev, {
      id: Date.now(),
      type: 'success',
      message: 'Complete profile and trip data exported',
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const saveProfile = () => {
    setAlerts((prev: Alert[]) => [...prev, {
      id: Date.now(),
      type: 'success',
      message: 'Profile information saved successfully',
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const inputClass = `w-full p-2 border rounded-lg text-sm ${
    darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'
  }`;

  const labelClass = `block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`;

  return (
    <div className={`min-h-screen p-4 ${darkMode ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
      <div className={`max-w-md mx-auto rounded-2xl shadow-xl overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">SafeDrive</h1>
              <p className="text-blue-100">Insurance Analytics</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg bg-blue-700 hover:bg-blue-800 transition-colors"
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <Shield className="h-10 w-10" />
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex mt-4 space-x-1 bg-blue-700 rounded-lg p-1">
            <button
              onClick={() => setCurrentScreen('dashboard')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                currentScreen === 'dashboard' ? 'bg-white text-blue-700' : 'text-blue-100 hover:text-white'
              }`}
            >
              <Car className="h-4 w-4 mx-auto mb-1" />
              Drive
            </button>
            <button
              onClick={() => setCurrentScreen('profile')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                currentScreen === 'profile' ? 'bg-white text-blue-700' : 'text-blue-100 hover:text-white'
              }`}
            >
              <User className="h-4 w-4 mx-auto mb-1" />
              Profile
            </button>
            <button
              onClick={() => setCurrentScreen('vehicle')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                currentScreen === 'vehicle' ? 'bg-white text-blue-700' : 'text-blue-100 hover:text-white'
              }`}
            >
              <Settings className="h-4 w-4 mx-auto mb-1" />
              Vehicle
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="max-h-96 overflow-y-auto">
          {currentScreen === 'dashboard' && (
            <div>
              {/* Navigation Integration */}
              <div className={`p-4 border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                <h3 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Navigation Integration</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => connectToMaps('waze')}
                    className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 ${
                      mapProvider === 'waze' ? 'bg-blue-600 text-white' : 
                      darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    <Navigation className="h-4 w-4" />
                    Waze
                  </button>
                  <button
                    onClick={() => connectToMaps('gmaps')}
                    className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 ${
                      mapProvider === 'gmaps' ? 'bg-green-600 text-white' : 
                      darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    <MapPin className="h-4 w-4" />
                    Google Maps
                  </button>
                </div>
              </div>

              {/* Speed Display */}
              <div className={`p-4 border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Car className="h-5 w-5 text-blue-600" />
                      <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Current Speed</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">{currentSpeed} mph</div>
                  </div>
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Speed Limit</span>
                    </div>
                    <div className="text-2xl font-bold text-orange-600">{speedLimit} mph</div>
                  </div>
                </div>
              </div>

              {/* Trip Controls */}
              <div className={`p-4 border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                <div className="flex gap-3">
                  <button
                    onClick={startTrip}
                    disabled={isTracking}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="h-5 w-5" />
                    {isTracking ? 'Tracking...' : 'Start Trip'}
                  </button>
                  <button
                    onClick={endTrip}
                    disabled={!isTracking}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-semibold"
                  >
                    End Trip
                  </button>
                </div>
              </div>

              {/* Trip Analytics */}
              <div className={`p-4 border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                <h3 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Trip Analytics</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Distance:</span>
                    <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{tripData.distance.toFixed(1)} mi</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Duration:</span>
                    <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{Math.floor(tripData.duration / 60)}:{(tripData.duration % 60).toString().padStart(2, '0')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Safety Score:</span>
                    <span className={`font-medium ${tripData.safetyScore >= 90 ? 'text-green-600' : tripData.safetyScore >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {tripData.safetyScore}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Violations:</span>
                    <span className="font-medium text-red-600">{tripData.speedViolations}</span>
                  </div>
                </div>
              </div>

              {/* Live Alerts */}
              <div className={`p-4 border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                <h3 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Live Alerts</h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {alerts.length === 0 ? (
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No alerts</p>
                  ) : (
                    alerts.slice(-3).map((alert: Alert) => (
                      <div key={alert.id} className={`p-2 rounded text-sm ${
                        alert.type === 'speed' ? 'bg-red-100 text-red-800' :
                        alert.type === 'success' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        <div className="flex justify-between">
                          <span>{alert.message}</span>
                          <span className="text-xs opacity-75">{alert.timestamp}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Insurance Integration */}
              <div className="p-4">
                <h3 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Insurance Integration</h3>
                <div className="bg-green-50 p-3 rounded-lg mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      Connected to {insuranceInfo.provider || 'Insurance Provider'}
                    </span>
                  </div>
                  <p className="text-xs text-green-700">Real-time data sharing enabled</p>
                </div>
                <button
                  onClick={exportData}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg font-semibold flex items-center justify-center gap-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  Export Complete Profile & Trip Data
                </button>
              </div>
            </div>
          )}

          {currentScreen === 'profile' && (
            <div className="p-4 space-y-6">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Driver Profile</h3>
              
                <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Last Name</label>
                    <input
                      type="text"
                      value={userProfile.lastName}
                      onChange={(e) => setUserProfile(prev => ({...prev, lastName: e.target.value}))}
                      className={inputClass}
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Email</label>
                  <input
                    type="email"
                    value={userProfile.email}
                    onChange={(e) => setUserProfile(prev => ({...prev, email: e.target.value}))}
                    className={inputClass}
                    placeholder="john.doe@email.com"
                  />
                </div>

                <div>
                  <label className={labelClass}>Phone</label>
                  <input
                    type="tel"
                    value={userProfile.phone}
                    onChange={(e) => setUserProfile(prev => ({...prev, phone: e.target.value}))}
                    className={inputClass}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <h3 className={`text-lg font-semibold pt-4 border-t ${darkMode ? 'text-white border-gray-600' : 'text-gray-900 border-gray-200'}`}>Insurance Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Insurance Provider</label>
                  <select
                    value={insuranceInfo.provider}
                    onChange={(e) => setInsuranceInfo(prev => ({...prev, provider: e.target.value}))}
                    className={inputClass}
                  >
                    <option value="">Select Provider</option>
                    {insuranceProviders.map(provider => (
                      <option key={provider} value={provider}>{provider}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Policy Number</label>
                    <input
                      type="text"
                      value={insuranceInfo.policyNumber}
                      onChange={(e) => setInsuranceInfo(prev => ({...prev, policyNumber: e.target.value}))}
                      className={inputClass}
                      placeholder="POL123456789"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Deductible</label>
                    <select
                      value={insuranceInfo.deductible}
                      onChange={(e) => setInsuranceInfo(prev => ({...prev, deductible: e.target.value}))}
                      className={inputClass}
                    >
                      <option value="250">$250</option>
                      <option value="500">$500</option>
                      <option value="1000">$1,000</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                onClick={saveProfile}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg font-semibold"
              >
                Save Profile Information
              </button>
            </div>
          )}

          {currentScreen === 'vehicle' && (
            <div className="p-4 space-y-6">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Vehicle Information</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Make</label>
                    <select
                      value={vehicleInfo.make}
                      onChange={(e) => setVehicleInfo(prev => ({...prev, make: e.target.value}))}
                      className={inputClass}
                    >
                      <option value="">Select Make</option>
                      {carMakes.map(make => (
                        <option key={make} value={make}>{make}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Model</label>
                    <input
                      type="text"
                      value={vehicleInfo.model}
                      onChange={(e) => setVehicleInfo(prev => ({...prev, model: e.target.value}))}
                      className={inputClass}
                      placeholder="Camry"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Year</label>
                    <input
                      type="number"
                      value={vehicleInfo.year}
                      onChange={(e) => setVehicleInfo(prev => ({...prev, year: e.target.value}))}
                      className={inputClass}
                      placeholder="2022"
                      min="1990"
                      max="2025"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>License Plate</label>
                    <input
                      type="text"
                      value={vehicleInfo.licensePlate}
                      onChange={(e) => setVehicleInfo(prev => ({...prev, licensePlate: e.target.value.toUpperCase()}))}
                      className={inputClass}
                      placeholder="ABC1234"
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>VIN</label>
                  <input
                    type="text"
                    value={vehicleInfo.vin}
                    onChange={(e) => setVehicleInfo(prev => ({...prev, vin: e.target.value.toUpperCase()}))}
                    className={`${inputClass} font-mono`}
                    placeholder="1HGCM82633A123456"
                    maxLength="17"
                  />
                  <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>17-character Vehicle Identification Number</p>
                </div>
              </div>

              {(vehicleInfo.make || vehicleInfo.model || vehicleInfo.year) && (
                <div className={`p-4 rounded-lg border ${
                  darkMode ? 'bg-blue-900 border-blue-700' : 'bg-blue-50 border-blue-200'
                }`}>
                  <h4 className={`font-semibold mb-2 ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>Vehicle Summary</h4>
                  <p className={darkMode ? 'text-blue-200' : 'text-blue-700'}>
                    {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}
                  </p>
                  {vehicleInfo.licensePlate && (
                    <p className={`text-sm mt-1 ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                      Plate: {vehicleInfo.licensePlate}
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={saveProfile}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg font-semibold"
              >
                Save Vehicle Information
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Development Notes */}
      <div className={`max-w-md mx-auto mt-6 border rounded-lg p-4 ${
        darkMode ? 'bg-gray-800 border-yellow-600 text-yellow-400' : 'bg-yellow-50 border-yellow-200 text-yellow-700'
      }`}>
        <h4 className={`font-semibold mb-2 ${darkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>Development & Backend Integration Notes:</h4>
        <ul className="text-sm space-y-1">
          <li>• Real GPS integration needed for production</li>
          <li>• Waze/Google Maps API integration required</li>
          <li>• Insurance partner API endpoints to implement</li>
          <li>• User profiles stored in secure database</li>
          <li>• Vehicle info with VIN validation</li>
          <li>• Insurance policy verification API</li>
          <li>• Encrypted data transmission to insurers</li>
          <li>• GDPR/CCPA compliant data handling</li>
          <li>• Real-time trip data + profile context</li>
          <li>• Dark/Light mode preference saved per user</li>
          <li>• Enhanced AI for road condition detection</li>
          <li>• Privacy controls and data consent management</li>
        </ul>
      </div>
    </div>
  );
};

export default SafeDriveApp;
