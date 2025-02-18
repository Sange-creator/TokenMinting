import { distributeTokensToAllVoters } from '../services/distributeTokens.js';

export const distributeTokens = async (req, res) => {
    try {
        const result = await distributeTokensToAllVoters();
        res.json(result);
    } catch (error) {
        console.error('Error in distributeTokens controller:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to distribute tokens'
        });
    }
}; 