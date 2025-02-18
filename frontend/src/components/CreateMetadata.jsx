import React, { useState } from 'react';
import axios from 'axios';

const CreateMetadata = ({ mintAddress, onMetadataCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    description: '',
    logo: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Validate mint address
      if (!mintAddress) {
        throw new Error('Mint address is required');
      }

      const formPayload = new FormData();
      formPayload.append('name', formData.name);
      formPayload.append('symbol', formData.symbol);
      formPayload.append('purpose', formData.description);
      formPayload.append('logo', formData.logo);
      formPayload.append('mintAddress', mintAddress);
      formPayload.append('creatorName', 'Admin');

      console.log('Submitting metadata with mint address:', mintAddress);

      const response = await axios.post(
        '/api/workflow/add-metadata',
        formPayload,
        { 
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 30000 // 30 second timeout
        }
      );

      if (response.data.success) {
        console.log('Metadata created successfully:', response.data);
        onMetadataCreated(response.data);
      } else {
        throw new Error(response.data.error || 'Failed to create metadata');
      }
    } catch (err) {
      console.error('Metadata creation error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to create metadata');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Create Metadata</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Token Name"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
        />
        <input
          type="text"
          placeholder="Token Symbol"
          value={formData.symbol}
          onChange={(e) => setFormData({...formData, symbol: e.target.value})}
          required
        />
        <textarea
          placeholder="Description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          required
        />
        <input
          type="file"
          onChange={(e) => setFormData({...formData, logo: e.target.files[0]})}
          accept="image/*"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Metadata'}
        </button>
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <p>Please make sure you have enough SOL in your wallet and try again.</p>
          </div>
        )}
      </form>
    </div>
  );
};

export default CreateMetadata;