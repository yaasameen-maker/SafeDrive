import { useState, useEffect } from 'react';
import { auth, db } from './firebase/config';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const LoginScreen = ({ setIsLoggedIn }: { setIsLoggedIn: (isLoggedIn: boolean) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuthAction = async () => {
    setError(null);
    try {
      if (isSigningUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setIsLoggedIn(true);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">SafeDrive</h1>
          <p className="text-gray-600">Your partner in safe driving.</p>
        </div>
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>}
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

const AppScreen = ({ user, setIsLoggedIn }: { user: FirebaseUser, setIsLoggedIn: (isLoggedIn: boolean) => void }) => {
  const handleLogout = async () => {
    await signOut(auth);
    setIsLoggedIn(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">SafeDrive</h1>
            </div>
            <div>
              <span className="text-gray-600 mr-4">Welcome, {user.email}</span>
              <button onClick={handleLogout} className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold">Logout</button>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h2>
        <div className="bg-white p-8 rounded-lg shadow-md">
          <p className="text-gray-700">This is the main application screen. More features will be added here soon.</p>
        </div>
      </div>
    </div>
  );
}

const SafeDriveApp = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsLoggedIn(true);
      }
    });
    return () => unsubscribe();
  }, []);

  if (!isLoggedIn || !user) {
    return <LoginScreen setIsLoggedIn={setIsLoggedIn} />;
  }

  return <AppScreen user={user} setIsLoggedIn={setIsLoggedIn} />;
};

export default SafeDriveApp;
