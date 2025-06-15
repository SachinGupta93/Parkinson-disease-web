// Script to clear Vite cache to resolve persistent HTTP 500 errors
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { execSync } from 'child_process';

// Get the directory of current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define the paths
const nodeModulesPath = path.join(__dirname, '..', 'node_modules', '.vite');
const cacheDirPath = path.join(__dirname, '..', 'node_modules', '.cache');

console.log('Starting Vite cache cleanup...');

// Delete the .vite directory in node_modules if it exists
if (fs.existsSync(nodeModulesPath)) {
  try {
    console.log('Removing Vite cache directory...');
    fs.rmSync(nodeModulesPath, { recursive: true, force: true });
    console.log('Vite cache directory removed successfully.');
  } catch (error) {
    console.error('Error removing Vite cache directory:', error);
  }
} else {
  console.log('No Vite cache directory found.');
}

// Delete the .cache directory in node_modules if it exists
if (fs.existsSync(cacheDirPath)) {
  try {
    console.log('Removing .cache directory...');
    fs.rmSync(cacheDirPath, { recursive: true, force: true });
    console.log('.cache directory removed successfully.');
  } catch (error) {
    console.error('Error removing .cache directory:', error);
  }
} else {
  console.log('No .cache directory found.');
}

console.log('Cache cleanup completed.');

// Exit with success code
process.exit(0);
