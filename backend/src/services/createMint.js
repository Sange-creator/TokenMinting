import { createMint } from "@solana/spl-token";
import { getKeypairFromEnvironment, getExplorerLink } from "@solana-developers/helpers";
import { getSolanaConnection } from "../utils/solanaConnection.js";
import { createTokenMetadata } from "./createMetadata.js";

export async function createTokenMint(metadata = {}) {
  const connection = getSolanaConnection();
  const user = getKeypairFromEnvironment("SECRET_KEY");

  // Create the token mint
  const tokenMint = await createMint(
    connection,
    user,
    user.publicKey,
    null,
    2
  );

  const mintAddress = tokenMint.toString();

  // If metadata is provided, create it
  let metadataTxSignature = null;
  if (metadata.name && metadata.symbol) {
    try {
      // Create metadata URI
      const metadataURI = `${process.env.API_URL}/metadata/${mintAddress}`;
      
      metadataTxSignature = await createTokenMetadata({
        name: metadata.name,
        symbol: metadata.symbol,
        uri: metadataURI,
        mintAddress
      });
      
      console.log('Metadata created successfully:', metadataTxSignature);
    } catch (error) {
      console.error('Failed to create metadata:', error);
    }
  }

  return {
    mintAddress,
    metadataTxSignature,
    explorerLink: `https://explorer.solana.com/address/${mintAddress}?cluster=devnet`
  };
}
