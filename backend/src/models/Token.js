import mongoose from 'mongoose';

const tokenSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Token name is required'],
    maxlength: [32, 'Name cannot exceed 32 characters']
  },
  symbol: {
    type: String,
    required: [true, 'Token symbol is required'],
    uppercase: true,
    maxlength: [10, 'Symbol cannot exceed 10 characters']
  },
  logo: {
    type: String,
    required: false
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    minlength: [10, 'Description should be at least 10 characters']
  },
  mintAddress: {
    type: String,
    required: [true, 'Mint address is required'],
    unique: true,
    validate: {
      validator: v => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(v),
      message: 'Invalid Solana mint address format'
    }
  },
  metadataURI: {
    type: String,
    required: [true, 'Metadata URI is required'],
    validate: {
      validator: v => v.startsWith('http'),
      message: 'URI must start with http/https'
    }
  },
  txSignature: {
    type: String,
    required: false
  },
  creatorName: {
    type: String,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Token', tokenSchema);