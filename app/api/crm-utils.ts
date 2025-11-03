/**
 * Utility function for better error messages in CRM API proxy routes
 */
export function getCrmErrorMessage(error: any, serviceUrl: string): string {
  let errorMessage = error.message || 'Unknown error';
  
  if (error.cause?.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
    errorMessage = `Cannot connect to CRM service at ${serviceUrl}. Please ensure the CRM service is running on port 3009. You can start it with: docker-compose up collector-crm`;
  } else if (error.message?.includes('fetch failed') || error.message?.includes('NetworkError')) {
    errorMessage = `Network error connecting to CRM service at ${serviceUrl}. The service may not be running. Start it with: docker-compose up collector-crm`;
  } else if (error.message?.includes('ECONNREFUSED')) {
    errorMessage = `Connection refused to CRM service at ${serviceUrl}. The service is not running or not accessible.`;
  }
  
  return errorMessage;
}

