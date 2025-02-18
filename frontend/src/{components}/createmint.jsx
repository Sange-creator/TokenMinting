import React, { useState } from 'react';
import axios from 'axios';

const CreateMint = ({ onMintCreated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateMint = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/mint/create`);
      onMintCreated(response.data);
    } catch (err) {
      setError('Failed to create mint: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="card">
      <h2>Create Token Mint</h2>
      {error && <p className="error">{error}</p>}
      <button 
        onClick={handleCreateMint}
        disabled={loading}
      >
        {loading ? 'Creating...' : 'Create Mint'}
      </button>
    </div>
  );
};

export default CreateMint;