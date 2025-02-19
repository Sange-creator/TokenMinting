import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  transfer,
  getMint,
} from '@solana/spl-token';
import { 
  createCreateMetadataAccountV3Instruction,
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID 
} from '@metaplex-foundation/mpl-token-metadata';
import { updateVoterTokenStatus } from './voterController.js';

// Initialize connection to Solana network
if (!process.env.SOLANA_RPC_URL) {
  throw new Error('SOLANA_RPC_URL is required in environment variables');
}

if (!process.env.PRIVATE_KEY) {
  throw new Error('PRIVATE_KEY is required in environment variables');
}

const connection = new Connection(process.env.SOLANA_RPC_URL, 'confirmed');

// Convert private key string to Uint8Array
let privateKeyUint8Array;
try {
  // Check if the private key is a base58 string
  if (process.env.PRIVATE_KEY.match(/^[1-9A-HJ-NP-Za-km-z]{43,44}$/)) {
    // If it's base58, we'll need to decode it first
    const bs58 = await import('bs58');
    privateKeyUint8Array = bs58.decode(process.env.PRIVATE_KEY);
  } else {
    // Try parsing as a JSON array of numbers
    const privateKeyArray = JSON.parse(process.env.PRIVATE_KEY);
    privateKeyUint8Array = new Uint8Array(privateKeyArray);
  }
} catch (error) {
  throw new Error('Invalid PRIVATE_KEY format in environment variables. Must be either a base58 string or JSON array of numbers.');
}

const payer = Keypair.fromSecretKey(privateKeyUint8Array);

// Create Mint Account
export async function createMintAccount() {
  try {
    console.log('Creating new mint account...');
    console.log('Mint authority will be:', payer.publicKey.toString());

    // Create the mint account
    const mint = await createMint(
      connection,
      payer,           // Payer
      payer.publicKey, // Mint Authority
      payer.publicKey, // Freeze Authority (optional)
      0               // Decimals (0 for voting tokens)
    );
    
    const mintAddress = mint.toBase58();
    console.log('Mint account created successfully:', mintAddress);
    
    // Verify the mint account
    const mintInfo = await connection.getAccountInfo(mint);
    if (!mintInfo) {
      throw new Error('Failed to verify mint account creation');
    }

    // Verify mint authority
    const mintState = await getMint(
      connection,
      mint
    );

    console.log('Verifying mint authority...');
    console.log('Expected authority:', payer.publicKey.toString());
    console.log('Actual authority:', mintState.mintAuthority.toString());

    if (!mintState.mintAuthority.equals(payer.publicKey)) {
      throw new Error('Mint authority verification failed');
    }

    // Return only the mint address string in the mintAddress field
    return {
      success: true,
      mintAddress: mintAddress, // Ensure this is a string
      mintAuthority: payer.publicKey.toString(),
      explorerUrl: `https://explorer.solana.com/address/${mintAddress}?cluster=devnet`
    };
  } catch (error) {
    console.error('Error creating mint account:', error);
    throw new Error(`Failed to create mint account: ${error.message}`);
  }
}

// Create Metadata Account
export async function createMetadataAccount(mintAddress, metadata) {
  try {
    console.log('Creating metadata account for mint:', mintAddress);
    console.log('Metadata:', metadata);

    // Validate input parameters
    if (!mintAddress) {
      throw new Error('Mint address is required');
    }
    if (!metadata.name || !metadata.symbol) {
      throw new Error('Name and symbol are required for metadata');
    }

    // Validate string lengths
    if (metadata.name.length > 32) {
      throw new Error('Name must be 32 characters or less');
    }
    if (metadata.symbol.length > 10) {
      throw new Error('Symbol must be 10 characters or less');
    }

    // Parse mint address
    let mintPublicKey;
    try {
      mintPublicKey = new PublicKey(mintAddress);
    } catch (error) {
      throw new Error(`Invalid mint address: ${error.message}`);
    }
    
    // Verify mint account exists and is owned by Token Program
    const mintInfo = await connection.getAccountInfo(mintPublicKey);
    if (!mintInfo) {
      throw new Error('Mint account does not exist');
    }

    // Generate metadata URI with fallback
    const uri = metadata.uri || `${process.env.API_URL}/metadata/${mintAddress}`;
    if (!uri.startsWith('http')) {
      throw new Error('Invalid metadata URI format. Must be a valid HTTP(S) URL');
    }
    
    // Create metadata data structure with required fields
    const data = {
      name: metadata.name.trim(),
      symbol: metadata.symbol.trim().toUpperCase(),
      uri,
      sellerFeeBasisPoints: 0,
      creators: [{
        address: payer.publicKey,
        verified: true,
        share: 100,
      }],
      collection: null,
      uses: null,
    };

    console.log('Metadata data structure:', JSON.stringify(data, null, 2));

    // Derive metadata account PDA
    const [metadataAccount] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mintPublicKey.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );

    console.log('Derived metadata account:', metadataAccount.toString());

    // Check if metadata already exists
    const existingMetadata = await connection.getAccountInfo(metadataAccount);
    if (existingMetadata) {
      throw new Error('Metadata already exists for this mint');
    }

    // Verify the payer has enough SOL
    const balance = await connection.getBalance(payer.publicKey);
    if (balance < 10000000) { // 0.01 SOL
      throw new Error('Insufficient SOL balance for metadata creation. Need at least 0.01 SOL');
    }

    // Create metadata instruction
    const instruction = createCreateMetadataAccountV3Instruction(
      {
        metadata: metadataAccount,
        mint: mintPublicKey,
        mintAuthority: payer.publicKey,
        payer: payer.publicKey,
        updateAuthority: payer.publicKey,
      },
      {
        createMetadataAccountArgsV3: {
          data,
          isMutable: true,
          collectionDetails: null,
        },
      }
    );

    // Create and send transaction
    const transaction = new Transaction();
    transaction.add(instruction);
    
    // Get recent blockhash and verify
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    if (!blockhash) {
      throw new Error('Failed to get recent blockhash');
    }
    
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = payer.publicKey;

    // Sign and send transaction with retries
    console.log('Sending metadata creation transaction...');
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [payer],
      { 
        commitment: 'confirmed',
        preflightCommitment: 'confirmed',
        maxRetries: 5
      }
    );

    console.log('Metadata created successfully!');
    console.log('Transaction signature:', signature);
    console.log('Explorer URL:', `https://explorer.solana.com/tx/${signature}?cluster=devnet`);

    // Verify metadata account was created
    const newMetadata = await connection.getAccountInfo(metadataAccount);
    if (!newMetadata) {
      throw new Error('Failed to verify metadata account creation');
    }

    return {
      success: true,
      signature,
      metadataAccount: metadataAccount.toString(),
      explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
      metadata: data
    };

  } catch (error) {
    console.error('Error creating metadata account:', error);
    if (error.logs) {
      console.error('Transaction logs:', error.logs);
    }
    // Provide more specific error messages
    if (error.message.includes('0x1')) {
      throw new Error('Insufficient balance for transaction');
    } else if (error.message.includes('blockhash')) {
      throw new Error('Transaction timed out, please try again');
    } else if (error.message.includes('0x0')) {
      throw new Error('Invalid instruction data passed');
    }
    throw new Error(`Failed to create metadata account: ${error.message}`);
  }
}

// Mint Token Supply
export async function mintTokenSupply(totalSupply) {
  try {
    console.log('Starting to mint token supply for', totalSupply, 'voters');

    // Validate total supply
    if (!totalSupply || totalSupply <= 0) {
      throw new Error('Total supply must be greater than 0');
    }

    // Get mint address from environment
    const mintAddress = process.env.TOKEN_MINT_ADDRESS;
    if (!mintAddress) {
      throw new Error('TOKEN_MINT_ADDRESS is required in environment variables');
    }
    
    console.log('Using mint address:', mintAddress);
    const mintPublicKey = new PublicKey(mintAddress);

    // Verify mint account exists and check authority
    const mintInfo = await connection.getAccountInfo(mintPublicKey);
    if (!mintInfo) {
      throw new Error('Mint account does not exist');
    }

    // Get the mint state to verify authority
    const mintState = await getMint(
      connection,
      mintPublicKey
    );

    console.log('Mint authority:', mintState.mintAuthority.toString());
    console.log('Current authority:', payer.publicKey.toString());

    // Verify mint authority matches our keypair
    if (!mintState.mintAuthority.equals(payer.publicKey)) {
      throw new Error(`Mint authority mismatch. Expected: ${payer.publicKey.toString()}, Got: ${mintState.mintAuthority.toString()}`);
    }

    // Check if tokens have already been minted
    console.log('Creating associated token account for admin...');
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mintPublicKey,
      payer.publicKey
    );

    console.log('Admin ATA created:', tokenAccount.address.toString());

    // Check current balance
    const currentBalance = await connection.getTokenAccountBalance(tokenAccount.address);
    console.log('Current token balance:', currentBalance.value.uiAmount);

    if (currentBalance.value.uiAmount > 0) {
      throw new Error(`Tokens have already been minted. Current balance: ${currentBalance.value.uiAmount}`);
    }

    // Mint tokens to admin's ATA
    console.log(`Minting exactly ${totalSupply} tokens to admin's ATA...`);
    console.log('Using mint authority:', payer.publicKey.toString());
    
    const mintTx = await mintTo(
      connection,
      payer,              // Payer
      mintPublicKey,      // Mint Account
      tokenAccount.address, // Destination
      payer,              // Mint Authority
      totalSupply,        // Amount
      [],                 // Additional signers
      {
        commitment: 'confirmed',
        preflightCommitment: 'confirmed'
      }
    );

    // Wait for confirmation
    await connection.confirmTransaction(mintTx, 'confirmed');
    console.log('Mint transaction confirmed:', mintTx);

    // Verify the final token balance
    const finalBalance = await connection.getTokenAccountBalance(tokenAccount.address);
    console.log('Final token balance:', finalBalance.value.uiAmount);

    if (finalBalance.value.uiAmount !== totalSupply) {
      throw new Error(`Token minting verification failed. Expected ${totalSupply} tokens, got ${finalBalance.value.uiAmount}`);
    }

    console.log('Token supply minted and verified successfully');
    console.log('Explorer URL:', `https://explorer.solana.com/tx/${mintTx}?cluster=devnet`);

    return {
      success: true,
      signature: mintTx,
      totalSupply,
      adminAta: tokenAccount.address.toString(),
      explorerUrl: `https://explorer.solana.com/tx/${mintTx}?cluster=devnet`,
      balance: finalBalance.value.uiAmount
    };

  } catch (error) {
    console.error('Error minting token supply:', error);
    if (error.logs) {
      console.error('Transaction logs:', error.logs);
    }
    throw new Error(`Failed to mint token supply: ${error.message}`);
  }
}

// Distribute Tokens
export async function distributeTokens(voterPublicKeys) {
  try {
    console.log('Starting token distribution to', voterPublicKeys.length, 'voters');

    // Get mint address from environment
    const mintAddress = process.env.TOKEN_MINT_ADDRESS;
    if (!mintAddress) {
      throw new Error('TOKEN_MINT_ADDRESS is required in environment variables');
    }

    console.log('Using mint address:', mintAddress);
    const mintPublicKey = new PublicKey(mintAddress);

    // Verify mint account exists
    const mintInfo = await connection.getAccountInfo(mintPublicKey);
    if (!mintInfo) {
      throw new Error('Mint account does not exist');
    }

    // Get admin's token account (source)
    console.log('Getting admin token account...');
    const sourceAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mintPublicKey,
      payer.publicKey
    );
    console.log('Admin token account:', sourceAccount.address.toString());

    // Check admin's token balance
    const adminBalance = Number(sourceAccount.amount);
    console.log('Admin token balance:', adminBalance);
    
    if (adminBalance < voterPublicKeys.length) {
      throw new Error(`Insufficient tokens in admin account. Have ${adminBalance}, need ${voterPublicKeys.length}`);
    }

    const results = [];
    for (const voterPubkey of voterPublicKeys) {
      try {
        console.log(`Processing voter: ${voterPubkey}`);
        
        // Create or get voter's token account
        console.log('Creating/getting voter token account...');
        const destinationAccount = await getOrCreateAssociatedTokenAccount(
          connection,
          payer,
          mintPublicKey,
          new PublicKey(voterPubkey)
        );
        console.log('Voter token account:', destinationAccount.address.toString());

        // Check if voter already has tokens
        const voterBalance = Number(destinationAccount.amount);
        if (voterBalance > 0) {
          console.log(`Voter ${voterPubkey} already has ${voterBalance} tokens. Skipping...`);
          results.push({
            voterPubkey,
            ata: destinationAccount.address.toString(),
            status: 'skipped',
            reason: 'already has tokens',
            success: true
          });
          continue;
        }

        // Transfer 1 token
        console.log('Transferring token...');
        const signature = await transfer(
          connection,
          payer,
          sourceAccount.address,
          destinationAccount.address,
          payer,
          1, // Transfer 1 token to each voter
          [],
          {
            commitment: 'confirmed'
          }
        );

        console.log('Token transferred successfully. Signature:', signature);
        console.log('Explorer URL:', `https://explorer.solana.com/tx/${signature}?cluster=devnet`);

        // Update voter record with ATA
        await updateVoterTokenStatus(
          voterPubkey,
          destinationAccount.address.toString()
        );

        results.push({
          voterPubkey,
          ata: destinationAccount.address.toString(),
          signature,
          status: 'transferred',
          success: true
        });

      } catch (error) {
        console.error(`Error distributing token to voter ${voterPubkey}:`, error);
        results.push({
          voterPubkey,
          error: error.message,
          status: 'failed',
          success: false
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    const skippedCount = results.filter(r => r.status === 'skipped').length;
    const transferredCount = results.filter(r => r.status === 'transferred').length;

    return {
      success: true,
      totalProcessed: voterPublicKeys.length,
      successfulTransfers: successCount,
      failedTransfers: failureCount,
      skippedTransfers: skippedCount,
      actualTransfers: transferredCount,
      adminBalance,
      details: results
    };

  } catch (error) {
    console.error('Error in token distribution:', error);
    if (error.logs) {
      console.error('Transaction logs:', error.logs);
    }
    throw new Error(`Failed to distribute tokens: ${error.message}`);
  }
}

// Request Airdrop
export async function requestAirdrop() {
  try {
    const publicKey = payer.publicKey;
    console.log('Requesting airdrop for wallet:', publicKey.toString());
    
    // Check current balance
    const currentBalance = await connection.getBalance(publicKey);
    console.log('Current balance:', currentBalance / 1000000000, 'SOL');

    // Request 2 SOL airdrop
    const airdropAmount = 2 * 1000000000; // 2 SOL in lamports
    console.log(`Requesting ${airdropAmount / 1000000000} SOL from devnet faucet...`);
    
    const signature = await connection.requestAirdrop(
      publicKey,
      airdropAmount
    );

    // Wait for confirmation with retry
    const latestBlockhash = await connection.getLatestBlockhash();
    
    // Enhanced confirmation with timeout and retry
    const confirmation = await connection.confirmTransaction({
      signature,
      ...latestBlockhash
    }, 'confirmed');

    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${confirmation.value.err}`);
    }

    // Verify the balance increase
    const newBalance = await connection.getBalance(publicKey);
    const solBalance = newBalance / 1000000000; // Convert lamports to SOL
    
    if (newBalance <= currentBalance) {
      throw new Error('Airdrop may have failed - no balance increase detected');
    }

    console.log('Airdrop successful!');
    console.log('New balance:', solBalance, 'SOL');
    console.log('Transaction signature:', signature);
    console.log('Explorer URL:', `https://explorer.solana.com/tx/${signature}?cluster=devnet`);

    return {
      success: true,
      signature,
      previousBalance: currentBalance / 1000000000,
      newBalance: solBalance,
      increase: (newBalance - currentBalance) / 1000000000,
      walletAddress: publicKey.toString(),
      explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`
    };
  } catch (error) {
    console.error('Error requesting airdrop:', error);
    if (error.logs) {
      console.error('Transaction logs:', error.logs);
    }
    throw new Error(`Failed to request airdrop: ${error.message}. Please try again or use https://solfaucet.com`);
  }
} 