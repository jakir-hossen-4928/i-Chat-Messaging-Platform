
/**
 * Utility module to help with Vite-related functionality in the browser
 */

/**
 * Check if Vite environment is properly configured
 */
export const checkViteEnvironment = () => {
  try {
    const envInfo = {
      mode: import.meta.env.MODE,
      dev: import.meta.env.DEV,
      prod: import.meta.env.PROD,
      baseUrl: import.meta.env.BASE_URL
    };
    
    console.log('Vite environment information:', envInfo);
    return {
      configured: true,
      info: envInfo
    };
  } catch (error) {
    console.error('Error checking Vite configuration:', error);
    return {
      configured: false,
      error
    };
  }
};

/**
 * Function to detect browser capabilities relevant to the application
 */
export const checkBrowserCompatibility = () => {
  const features = {
    localStorage: typeof localStorage !== 'undefined',
    sessionStorage: typeof sessionStorage !== 'undefined',
    indexedDB: typeof indexedDB !== 'undefined',
    webRTC: typeof RTCPeerConnection !== 'undefined',
    webWorkers: typeof Worker !== 'undefined'
  };
  
  console.log('Browser compatibility check:', features);
  return features;
};

export default {
  checkViteEnvironment,
  checkBrowserCompatibility
};
