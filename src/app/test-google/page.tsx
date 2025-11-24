'use client';

import { useAuth, useFirestore } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

export default function TestGoogle() {
  const auth = useAuth();
  const db = useFirestore();

  const handleClick = async () => {
    console.log('Clicked!', { auth, db });
    
    if (!auth) {
      alert('Auth not initialized!');
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      alert('Success! ' + result.user.email);
    } catch (error: any) {
      alert('Error: ' + error.message);
      console.error(error);
    }
  };

  return (
    <div style={{ padding: '50px' }}>
      <h1>Test Google Sign-in</h1>
      <button onClick={handleClick} style={{ padding: '20px', fontSize: '20px' }}>
        Click to test Google
      </button>
      <p>Auth: {auth ? 'YES' : 'NO'}</p>
      <p>DB: {db ? 'YES' : 'NO'}</p>
    </div>
  );
}
