import React from 'react';
import TokenWorkflow from './components/TokenWorkflow';
import './App.css';

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Token Minting Platform</h1>
        <p>Solana Token Creation Workflow</p>
      </header>
      <main>
        <TokenWorkflow />
      </main>
    </div>
  );
}

export default App;