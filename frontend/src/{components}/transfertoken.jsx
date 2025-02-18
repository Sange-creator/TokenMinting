import React, { useState } from 'react';
import axios from 'axios';
import { FiSend, FiLoader, FiCheckCircle } from 'react-icons/fi';

const TransferTokens = ({ mintAddress }) => {
  const [state, setState] = useState({
    loading: false,
    error: null,
    transferred: 0,
    failedTransfers: []
  });

  const handleTransfer = async () => {
    try {
      setState({ ...state, loading: true, error: null });
      
      const response = await axios.post('/api/transfer-tokens', {
        mintAddress
      });

      setState({
        loading: false,
        transferred: response.data.transferred,
        failedTransfers: response.data.errors || [],
        error: null
      });
    } catch (error) {
      setState({
        ...state,
        loading: false,
        error: error.response?.data?.error || 'Token transfer failed'
      });
    }
  };

  return (
    <div className="workflow-card">
      <div className="card-header">
        <FiSend className="icon" />
        <h3>Distribute Tokens to Voters</h3>
      </div>

      <div className="card-body">
        <p className="info-text">
          Transfer one token to each registered voter
        </p>

        <button 
          onClick={handleTransfer}
          disabled={state.loading || !mintAddress}
          className="primary-btn"
        >
          {state.loading ? (
            <><FiLoader className="spin" /> Distributing...</>
          ) : (
            'Send Tokens to Voters'
          )}
        </button>

        {state.transferred > 0 && (
          <div className="success-message">
            <FiCheckCircle className="success-icon" />
            <p>
              Successfully transferred tokens to {state.transferred} voters
              {state.failedTransfers.length > 0 && (
                <span className="partial-success">
                  ({state.failedTransfers.length} failed)
                </span>
              )}
            </p>
          </div>
        )}

        {state.failedTransfers.length > 0 && (
          <div className="transfer-errors">
            <h4>Failed Transfers:</h4>
            <ul>
              {state.failedTransfers.map((failure, index) => (
                <li key={index}>
                  {failure.voter}: {failure.error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {state.error && (
          <div className="error-message">
            <p>{state.error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransferTokens;