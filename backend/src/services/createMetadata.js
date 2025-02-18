import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { PROGRAM_ID, createCreateMetadataAccountV3Instruction } from '@metaplex-foundation/mpl-token-metadata';
import { getKeypairFromEnvironment } from '@solana-developers/helpers';
import { getSolanaConnection } from "../utils/solanaConnection.js";

export async function createTokenMetadata(metadataData) {
  try {
    const connection = getSolanaConnection();
    const user = getKeypairFromEnvironment('SECRET_KEY');

    // Validate mint address
    let mintAccount;
    try {
      mintAccount = new PublicKey(metadataData.mintAddress);
      // Verify the mint account exists
      const mintInfo = await connection.getAccountInfo(mintAccount);
      if (!mintInfo) {
        throw new Error('Mint account does not exist');
      }
    } catch (error) {
      throw new Error(`Invalid mint address: ${error.message}`);
    }

    // Derive metadata account PDA
    const [metadataAccount] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        PROGRAM_ID.toBuffer(),
        mintAccount.toBuffer(),
      ],
      PROGRAM_ID
    );

    console.log('Creating metadata for mint:', mintAccount.toString());
    console.log('Metadata account:', metadataAccount.toString());

    // Create metadata data
    const data = {
      name: metadataData.name,
      symbol: metadataData.symbol,
      uri: metadataData.uri,
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

    // Create and send transaction
    const transaction = new Transaction().add(instruction);
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [user],
      { commitment: 'confirmed' }
    );

    console.log('Metadata created successfully:', signature);
    return signature;
  } catch (error) {
    console.error('Failed to create token metadata:', error);
    if (error.logs) {
      console.error('Transaction logs:', error.logs);
    }
    throw new Error(`Metadata creation failed: ${error.message}`);
  }
}