import { setupTokenMetadataProgram } from './deployPrograms.js';
import { fileURLToPath } from 'url';

export async function setup() {
  try {
    console.log('Starting Token Metadata Program setup...');
    
    // Setup the Token Metadata Program
    const programId = await setupTokenMetadataProgram();
    
    console.log('Setup completed successfully!');
    console.log('Token Metadata Program ID:', programId);
    console.log('\nMake sure your Solana test validator is running with the --bpf-program flag:');
    console.log(`solana-test-validator --bpf-program ${programId} /path/to/token_metadata.so\n`);
    
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  setup()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { setup }; 