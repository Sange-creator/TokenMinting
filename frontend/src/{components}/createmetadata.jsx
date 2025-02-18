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
      const formPayload = new FormData();
      formPayload.append('name', formData.name);
      formPayload.append('symbol', formData.symbol);
      formPayload.append('purpose', formData.description);
      formPayload.append('logo', formData.logo);
      formPayload.append('mintAddress', mintAddress);
      formPayload.append('creatorName', 'Admin');

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/metadata`,
        formPayload,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      onMetadataCreated(response.data);
    } catch (err) {
      setError('Metadata creation failed: ' + err.message);
    }
    setLoading(false);
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
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
};

export default CreateMetadata;