import React, { useState } from 'react';

const MintSupply = ({ onSupplyMinted }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleMintSupply = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/mint/supply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to mint token supply');
      }

      onSupplyMinted(data.txSignature);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mint-supply-container">
      <h2>Step 3: Mint Token Supply</h2>
      <p>Create the initial supply for your token.</p>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <button
        onClick={handleMintSupply}
        disabled={loading}
        className="primary-button"
      >
        {loading ? 'Minting...' : 'Mint Supply'}
      </button>
    </div>
  );
};

export default MintSupply;