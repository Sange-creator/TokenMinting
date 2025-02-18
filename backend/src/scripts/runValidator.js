import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testLedgerPath = path.join(__dirname, '../../test-ledger');

// Clean up existing ledger
if (fs.existsSync(testLedgerPath)) {
  fs.rmSync(testLedgerPath, { recursive: true, force: true });
  console.log('Removed existing test ledger');
}

// Create fresh directory
fs.mkdirSync(testLedgerPath, { recursive: true });
console.log('Created fresh test ledger directory');

// Start validator as a child process
const validator = spawn('solana-test-validator', [
  '--reset',
  '--no-bpf-jit',
  '--rpc-port', '8899',
  '--faucet-port', '8900',
  '--ledger', testLedgerPath,
  '--rpc-pubsub-enable',  // Enable WebSocket
  '--rpc-pubsub-port', '8901',  // Specify WebSocket port
  '--log', path.join(testLedgerPath, 'validator.log')
], {
  stdio: 'inherit'
});

validator.on('error', (err) => {
  console.error('Failed to start validator:', err);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('Shutting down validator...');
  validator.kill();
  process.exit();
}); 