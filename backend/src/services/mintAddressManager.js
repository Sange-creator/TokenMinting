import mongoose from 'mongoose';

// Define a schema for storing mint addresses
const mintAddressSchema = new mongoose.Schema({
    address: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create a model if it doesn't exist
const MintAddress = mongoose.models.MintAddress || mongoose.model('MintAddress', mintAddressSchema);

/**
 * Get the current active mint address
 * @returns {Promise<string|null>} The active mint address or null if none exists
 */
export async function getActiveMintAddress() {
    try {
        // Ensure MongoDB is connected
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(process.env.MONGODB_URI);
        }

        const activeMint = await MintAddress.findOne({ isActive: true }).sort({ createdAt: -1 });
        return activeMint ? activeMint.address : null;
    } catch (error) {
        console.error('Error getting active mint address:', error);
        throw error;
    }
}

/**
 * Set a new active mint address
 * @param {string} address - The new mint address to set as active
 */
export async function setActiveMintAddress(address) {
    try {
        // Ensure MongoDB is connected
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(process.env.MONGODB_URI);
        }

        // Deactivate all current active mint addresses
        await MintAddress.updateMany({ isActive: true }, { isActive: false });

        // Create new active mint address
        await MintAddress.create({
            address,
            isActive: true
        });

        return true;
    } catch (error) {
        console.error('Error setting active mint address:', error);
        throw error;
    }
}

// Export an alias for backward compatibility
export const updateActiveMintAddress = setActiveMintAddress; 