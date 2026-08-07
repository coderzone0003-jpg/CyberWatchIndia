import React from 'react';

// Test component to trigger Error Boundary
// Remove this file after testing
function ErrorTest() {
  throw new Error('This is a test error to verify Error Boundary works!');
  return <div>This should never render</div>;
}

export default ErrorTest;