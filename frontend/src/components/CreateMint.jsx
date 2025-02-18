import React, { useState } from 'react';

const CreateMint = ({ onMintCreated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCreateMint = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/mint/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create mint');
      }

      onMintCreated({
        mintAddress: data.mintAddress,
        explorerLink: data.explorerLink
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-mint-container">
      <h2>Step 1: Create Token Mint</h2>
      <p>Create a new token mint on the Solana blockchain.</p>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <button 
        onClick={handleCreateMint}
        disabled={loading}
        className="primary-button"
      >
        {loading ? 'Creating...' : 'Create Mint'}
      </button>
    </div>
  );
};

export default CreateMint;