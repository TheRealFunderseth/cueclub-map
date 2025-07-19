'use client'

import React, { useState, useEffect } from 'react';

export default function DiagnosticPage() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // If you see this message in the console on your Vercel site,
    // it means the basic React/Next.js setup is working correctly.
    console.log("Diagnostic component mounted successfully.");
  }, []);

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h1>Diagnostic Test Page</h1>
      <p>If you can see this, the basic Next.js and React rendering is working.</p>
      <p>Current count: {count}</p>
      <button 
        onClick={() => setCount(c => c + 1)}
        style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}
      >
        Click Me
      </button>
      <p style={{ marginTop: '20px', color: '#666' }}>
        Please check your browser's developer console for a success message.
      </p>
    </div>
  );
}
