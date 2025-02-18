import mongoose from 'mongoose';

const voterSchema = new mongoose.Schema({
  ATA: {
    type: String,
    required: true,
    unique: true
  },
  tokensReceived: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  dateOfBirth: {
    type: Date,
    required: true,
  },
  nationalId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  address: {
    type: String,
    required: true,
    trim: true,
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^\+?[\d\s-]{10,}$/.test(v); // Basic phone number validation
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  // Replace the fingerprintTemplate field with:
  fingerprintData: {
    hash: {
      type: Buffer,
      required: function() {
        return this.registrationStatus === 'biometric' || this.registrationStatus === 'completed';
      }
    },
    template: {
      type: Buffer,
      required: function() {
        return this.registrationStatus === 'biometric' || this.registrationStatus === 'completed';
      }
    }
  },
  // Update the walletDetails schema
  walletDetails: {
    publicKey: {
      type: String,
      unique: true,
      sparse: true,
      validate: {
        validator: function (key) {
          return (
            typeof key === "string" &&
            key.length >= 32 &&
            /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(key)
          );
        },
        message: "Invalid Solana public key format",
      },
    },
    encryptedPrivateKey: {
      type: String,
      required: function () {
        return !!this.walletDetails?.publicKey;
      },
    },
    iv: {
      type: String,
      required: function () {
        return !!this.walletDetails?.publicKey;
      },
    },
    encryptionKey: {
      type: String,
      required: function () {
        return !!this.walletDetails?.publicKey;
      },
    },
    encryptionMethod: {
      type: String,
      enum: ["NACL_SECRETBOX", "AES-256-GCM"],
      default: "NACL_SECRETBOX",
    },
  },
  rfidTagId: {
    type: String,
    unique: true,
    sparse: true,
    validate: {
      validator: function (tag) {
        return typeof tag === "string" && tag.length >= 8;
      },
      message: "Invalid RFID tag format",
    },
  },
  registrationStatus: {
    type: String,
    enum: ["basic-details", "biometric", "wallet", "completed"],
    default: "basic-details",
  },
  registrationDate: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Voter', voterSchema); 