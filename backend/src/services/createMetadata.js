import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { PROGRAM_ID, createCreateMetadataAccountV3Instruction } from '@metaplex-foundation/mpl-token-metadata';
import { getSolanaConnection } from "../utils/solanaConnection.js";

export async function createTokenMetadata(metadataData) {
  try {
    console.log('Starting metadata creation process...');
    const connection = getSolanaConnection();
    
    // Convert private key from environment
    let privateKeyUint8Array;
    try {
      console.log('Parsing private key...');
      const privateKeyArray = JSON.parse(process.env.PRIVATE_KEY);
      privateKeyUint8Array = new Uint8Array(privateKeyArray);
    } catch (error) {
      console.error('Private key parsing error:', error);
      throw new Error('Invalid PRIVATE_KEY format in environment variables');
    }
    
    const user = Keypair.fromSecretKey(privateKeyUint8Array);
    console.log('User public key:', user.publicKey.toString());

    // Validate mint address
    let mintAccount;
    try {
      console.log('Validating mint address:', metadataData.mintAddress);
      mintAccount = new PublicKey(metadataData.mintAddress);
      // Verify the mint account exists
      const mintInfo = await connection.getAccountInfo(mintAccount);
      if (!mintInfo) {
        throw new Error('Mint account does not exist');
      }
      console.log('Mint account exists and is valid');
    } catch (error) {
      console.error('Mint account validation error:', error);
      throw new Error(`Invalid mint address: ${error.message}`);
    }

    // Check if metadata account already exists
    const [metadataAccount] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        PROGRAM_ID.toBuffer(),
        mintAccount.toBuffer(),
      ],
      PROGRAM_ID
    );

    console.log('Metadata PDA:', metadataAccount.toString());
    
    // Check if metadata account already exists
    const existingMetadata = await connection.getAccountInfo(metadataAccount);
    if (existingMetadata) {
      console.log('Metadata account already exists');
      throw new Error('Metadata account already exists for this mint');
    }

    // Validate metadata fields
    if (!metadataData.name || !metadataData.symbol) {
      throw new Error('Name and symbol are required for metadata');
    }

    if (metadataData.name.length > 32) {
      throw new Error('Name must be 32 characters or less');
    }

    if (metadataData.symbol.length > 10) {
      throw new Error('Symbol must be 10 characters or less');
    }

    // Ensure URI is set
    const uri = metadataData.uri || `${process.env.API_URL}/metadata/${metadataData.mintAddress}`;
    console.log('Using metadata URI:', uri);

    // Create metadata data
    const data = {
      name: metadataData.name,
      symbol: metadataData.symbol,
      uri,
      sellerFeeBasisPoints: 0,
      creators: [
        {
          address: user.publicKey,
          verified: true,
          share: 100,
        },
      ],
      collection: null,
      uses: null,
    };

    console.log('Creating metadata instruction with data:', JSON.stringify(data, null, 2));

    // Create metadata instruction
    const instruction = createCreateMetadataAccountV3Instruction(
      {
        metadata: metadataAccount,
        mint: mintAccount,
        mintAuthority: user.publicKey,
        payer: user.publicKey,
        updateAuthority: user.publicKey,
      },
      {
        createMetadataAccountArgsV3: {
          data,
          isMutable: true,
          collectionDetails: null,
        },
      }
    );

    // Check account balances
    const balance = await connection.getBalance(user.publicKey);
    console.log('Account balance:', balance / 1e9, 'SOL');

    if (balance < 10000000) { // 0.01 SOL
      throw new Error('Insufficient funds for transaction. Need at least 0.01 SOL');
    }

    // Create and send transaction
    const transaction = new Transaction().add(instruction);
    
    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = user.publicKey;

    console.log('Sending transaction...');
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [user],
      { 
        commitment: 'confirmed',
        preflightCommitment: 'confirmed',
        maxRetries: 5
      }
    );

    console.log('Metadata created successfully:', signature);
    console.log('Transaction explorer URL:', `https://explorer.solana.com/tx/${signature}?cluster=devnet`);
    
    return {
      signature,
      metadataAccount: metadataAccount.toString(),
      explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`
    };
  } catch (error) {
    console.error('Failed to create token metadata:', error);
    if (error.logs) {
      console.error('Transaction logs:', error.logs);
    }
    // Check for specific error types
    if (error.message.includes('0x1')) {
      throw new Error('Insufficient balance for transaction');
    } else if (error.message.includes('blockhash')) {
      throw new Error('Transaction timed out, please try again');
    } else if (error.message.includes('0x0')) {
      throw new Error('Invalid instruction data passed');
    }
    throw new Error(`Metadata creation failed: ${error.message}`);
  }
}