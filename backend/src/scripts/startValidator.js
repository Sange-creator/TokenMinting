const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

async function startValidator() {
  const testLedgerPath = path.join(__dirname, '../../test-ledger');

  try {
    // Kill any existing validator process
    try {
      execSync('pkill solana-test-validator');
      console.log('Killed existing validator process');
    } catch (error) {
      // It's okay if no process was running
    }

    // Clean up existing ledger
    if (fs.existsSync(testLedgerPath)) {
      fs.rmSync(testLedgerPath, { recursive: true, force: true });
      console.log('Removed existing test ledger');
    }

    // Create fresh test-ledger directory
    fs.mkdirSync(testLedgerPath, { recursive: true });
    console.log('Created fresh test ledger directory');

    console.log('Starting Solana test validator...');
    
    // Start the validator with specific configuration
    const validatorProcess = execSync(
      'solana-test-validator ' +
      '--reset ' +  // Reset the ledger
      '--rpc-port 8899 ' +  // Set RPC port
      '--ledger test-ledger ' +  // Specify ledger location
      '--quiet',  // Reduce log output
      {
        stdio: 'inherit',
        cwd: path.join(__dirname, '../..')
      }
    );

    console.log('Validator started successfully');
    return validatorProcess;
  } catch (error) {
    console.error('Failed to start validator:', error);
    throw error;
  }
}

if (require.main === module) {
  startValidator()
    .then(() => {
      console.log('Validator setup completed');
    })
    .catch((error) => {
      console.error('Validator setup failed:', error);
      process.exit(1);
    });
}

module.exports = { startValidator }; 