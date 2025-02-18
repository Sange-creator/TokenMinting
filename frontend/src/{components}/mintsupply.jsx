import React, { useState } from 'react';
import axios from 'axios';
import { FiPackage, FiLoader, FiCheckCircle } from 'react-icons/fi';

const MintSupply = ({ mintAddress }) => {
  const [state, setState] = useState({
    loading: false,
    error: null,
    txSignature: null,
    tokensMinted: 0
  });

  const handleMintSupply = async () => {
    try {
      setState({ ...state, loading: true, error: null });
      
      const response = await axios.post('/api/mint-supply', {
        mintAddress
      });

      setState({
        loading: false,
        txSignature: response.data.txSignature,
        tokensMinted: response.data.tokensMinted,
        error: null
      });
    } catch (error) {
      setState({
        ...state,
        loading: false,
        error: error.response?.data?.error || 'Minting failed'
      });
    }
  };

  return (
    <div className="workflow-card">
      <div className="card-header">
        <FiPackage className="icon" />
        <h3>Mint Token Supply</h3>
      </div>
      
      <div className="card-body">
        <p className="info-text">
          Total supply will be minted based on current voter count
        </p>

        <button 
          onClick={handleMintSupply}
          disabled={state.loading || !mintAddress}
          className="primary-btn"
        >
          {state.loading ? (
            <><FiLoader className="spin" /> Processing...</>
          ) : (
            'Mint Required Supply'
          )}
        </button>

        {state.txSignature && (
          <div className="success-message">
            <FiCheckCircle className="success-icon" />
            <p>Successfully minted {state.tokensMinted} tokens!</p>
            <a
              href={`https://explorer.solana.com/tx/${state.txSignature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="explorer-link"
            >
              View Transaction
            </a>
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

export default MintSupply;