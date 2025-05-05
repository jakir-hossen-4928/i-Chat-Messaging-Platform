
// This is a browser-compatible script that helps detect Vite-related issues

(function() {
  // Function to check if Vite is properly loaded in the browser
  function checkViteInBrowser() {
    console.log('Checking Vite environment in browser...');
    
    const viteSignatures = [
      typeof import !== 'undefined' && typeof import.meta !== 'undefined',
      typeof import !== 'undefined' && typeof import.meta.env !== 'undefined',
      typeof document.querySelector('script[type="module"]') !== null
    ];
    
    const viteDetected = viteSignatures.some(Boolean);
    
    console.log('Vite environment detection:', viteDetected ? 'Detected' : 'Not detected');
    
    if (viteDetected) {
      console.log('Vite environment properties:', {
        mode: import.meta.env.MODE,
        dev: import.meta.env.DEV,
        baseUrl: import.meta.env.BASE_URL
      });
    }
    
    return viteDetected;
  }
  
  // Expose the function to the global scope
  window.checkViteInBrowser = checkViteInBrowser;
  
  // Automatically run the check when the script loads
  if (document.readyState === 'complete') {
    checkViteInBrowser();
  } else {
    window.addEventListener('load', checkViteInBrowser);
  }
})();
