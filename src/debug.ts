
/**
 * Debug utility file to help diagnose environment issues
 */

export const checkEnvironment = () => {
  console.log('Environment check:');
  
  // Browser-safe environment checks
  console.log('Environment variables available:', Object.keys(import.meta.env).join(', '));
  
  // Check if running in development mode
  console.log('Development mode:', import.meta.env.DEV ? 'Yes' : 'No');
  
  // Additional build tool information
  console.log('Build tools check:');
  try {
    console.log('Vite environment:', import.meta.env.MODE);
    console.log('Base URL:', import.meta.env.BASE_URL);
    console.log('DEV:', import.meta.env.DEV);
    console.log('PROD:', import.meta.env.PROD);
  } catch (e) {
    console.log('Error accessing build tool information:', e);
  }
};

/**
 * Check if npm packages are properly installed
 * Note: This function is browser-compatible and uses import.meta.env instead of Node.js process
 */
export const checkPackages = () => {
  console.log('Checking for critical packages:');
  
  // We can't directly check installed packages in the browser
  // Instead, we check for features that would indicate presence
  try {
    // Use typeof window checks instead of direct global variable references
    console.log('React available:', typeof window !== 'undefined' && 'React' in window ? 'Yes' : 'No');
    console.log('ReactDOM available:', typeof window !== 'undefined' && 'ReactDOM' in window ? 'Yes' : 'No');
    console.log('Vite env available:', typeof import.meta.env !== 'undefined' ? 'Yes' : 'No');
  } catch (e) {
    console.log('Error checking packages:', e);
  }
};

// Export it as default for easy importing
export default { checkEnvironment, checkPackages };
