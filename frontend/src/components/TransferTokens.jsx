import React, { useState } from 'react';

const TransferTokens = ({ mintAddress }) => {
  const [formData, setFormData] = useState({
    recipientAddress: '',
    amount: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/token/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          mintAddress
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to transfer tokens');
      }

      // Reset form after successful transfer
      setFormData({
        recipientAddress: '',
        amount: ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="transfer-tokens-container">
      <h2>Step 4: Transfer Tokens</h2>
      <p>Distribute tokens to recipients.</p>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleTransfer}>
        <div className="form-group">
          <label htmlFor="recipientAddress">Recipient Address:</label>
          <input
            type="text"
            id="recipientAddress"
            name="recipientAddress"
            value={formData.recipientAddress}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="amount">Amount:</label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            min="1"
            required
          />
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="primary-button"
        >
          {loading ? 'Transferring...' : 'Transfer Tokens'}
        </button>
      </form>
    </div>
  );
};

export default TransferTokens;