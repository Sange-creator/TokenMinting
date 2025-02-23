import React, { useState } from 'react';

const CreateMint = ({ onMintCreated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCreateMint = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/mint/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create mint');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to create mint');
      }

      console.log('Mint created successfully:', data);
      
      onMintCreated({
        mintAddress: data.mintAddress,
        explorerLink: data.explorerLink
      });
    } catch (err) {
      console.error('Mint creation error:', err);
      setError(err.message || 'Failed to create mint. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-mint-container">
      <h2>Step 1: Create Token Mint</h2>
      <p>Create a new token mint on the Solana blockchain.</p>
      
      {error && (
        <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
          Error: {error}
        </div>
      )}

      <button 
        onClick={handleCreateMint}
        disabled={loading}
        className="primary-button"
        style={{
          padding: '10px 20px',
          backgroundColor: loading ? '#ccc' : '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Creating...' : 'Create Mint'}
      </button>
    </div>
  );
};

export default CreateMint;