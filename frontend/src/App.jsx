import React, { useState } from 'react';
import CreateMint from './components/CreateMint';
import CreateMetadata from './components/CreateMetadata';
import MintSupply from './components/MintSupply';
import TransferTokens from './components/TransferTokens';
import './styles.css';

function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [mintInfo, setMintInfo] = useState(null);
  const [metadataInfo, setMetadataInfo] = useState(null);

  return (
    <div className="app">
      <h1>Token Voting System</h1>
      <div className="progress">
        Step {currentStep} of 4
      </div>

      {currentStep === 1 && (
        <CreateMint 
          onMintCreated={(info) => {
            setMintInfo(info);
            setCurrentStep(2);
          }}
        />
      )}

      {currentStep === 2 && mintInfo && (
        <CreateMetadata
          mintAddress={mintInfo.mintAddress}
          onMetadataCreated={(info) => {
            setMetadataInfo(info);
            setCurrentStep(3);
          }}
        />
      )}

      {currentStep === 3 && (
        <MintSupply 
          onSupplyMinted={() => setCurrentStep(4)}
        />
      )}

      {currentStep === 4 && (
        <TransferTokens 
          mintAddress={mintInfo.mintAddress}
        />
      )}
    </div>
  );
}

export default App;