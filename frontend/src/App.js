import React, { useState } from 'react';
import { Button, Form, Input, message, Steps, Alert } from 'antd';
import axios from 'axios';
import 'antd/dist/reset.css';

const App = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [mintAddress, setMintAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const steps = [
    {
      title: 'Mint Token',
      content: (
        <Button 
          type="primary" 
          onClick={handleMintToken}
          loading={loading}
        >
          Mint New Token
        </Button>
      )
    },
    {
      title: 'Add Metadata',
      content: (
        <Form form={form} onFinish={handleAddMetadata}>
          <Form.Item label="Token Name" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Token Symbol" name="symbol" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Description" name="description" rules={[{ required: true }]}>
            <Input.TextArea />
          </Form.Item>
          <Form.Item label="Creator Name" name="creatorName" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Submit Metadata
            </Button>
          </Form.Item>
        </Form>
      )
    },
    {
      title: 'Mint Supply',
      content: (
        <Button 
          type="primary" 
          onClick={handleMintSupply}
          loading={loading}
        >
          Mint Required Supply
        </Button>
      )
    },
    {
      title: 'Transfer Tokens',
      content: (
        <Button 
          type="primary" 
          onClick={handleTransferTokens}
          loading={loading}
          danger
        >
          Send Tokens to Voters
        </Button>
      )
    }
  ];

  async function handleMintToken() {
    setLoading(true);
    try {
      const response = await axios.post('/api/workflow/mint-token', {}, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.data.success) {
        setMintAddress(response.data.mintAddress);
        message.success('Token minted successfully!');
        setCurrentStep(1);
      } else {
        throw new Error(response.data.error || 'Failed to mint token');
      }
    } catch (error) {
      console.error('Mint error:', error);
      message.error(error.response?.data?.error || error.message || 'Failed to mint token');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddMetadata(values) {
    setLoading(true);
    try {
      const response = await axios.post('/api/workflow/add-metadata', {
        ...values,
        mintAddress
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.data.success) {
        message.success('Metadata added successfully!');
        setCurrentStep(2);
      } else {
        throw new Error(response.data.error || 'Failed to add metadata');
      }
    } catch (error) {
      console.error('Metadata error:', error);
      message.error(error.response?.data?.error || error.message || 'Failed to add metadata');
    } finally {
      setLoading(false);
    }
  }

  async function handleMintSupply() {
    setLoading(true);
    try {
      const response = await axios.post('/api/workflow/mint-supply', {}, {
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.data.success) {
        message.success(`Minted ${response.data.tokensMinted} tokens successfully!`);
        setCurrentStep(3);
      } else {
        throw new Error(response.data.error || 'Failed to mint supply');
      }
    } catch (error) {
      console.error('Supply error:', error);
      message.error(error.response?.data?.error || error.message || 'Failed to mint supply');
    } finally {
      setLoading(false);
    }
  }

  async function handleTransferTokens() {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:3000/api/workflow/transfer-tokens');
      if (response.data.success) {
        message.success(response.data.message || 'Tokens transferred successfully!');
      } else {
        throw new Error(response.data.error || 'Failed to transfer tokens');
      }
    } catch (error) {
      message.error(error.response?.data?.error || error.message || 'Failed to transfer tokens');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: '2rem auto', padding: '0 1rem' }}>
      <Steps current={currentStep}>
        {steps.map(item => (
          <Steps.Step key={item.title} title={item.title} />
        ))}
      </Steps>
      <div style={{ marginTop: '2rem' }}>
        {steps[currentStep].content}
        {mintAddress && (
          <Alert
            style={{ marginTop: '1rem' }}
            message={loading ? 'Processing...' : `Mint Address: ${mintAddress}`}
            type={loading ? 'warning' : 'info'}
            showIcon
          />
        )}
      </div>
    </div>
  );
};

export default App; 