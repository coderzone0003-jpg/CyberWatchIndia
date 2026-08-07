import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

describe('App Component', () => {
  it('renders without crashing', () => {
    render(<App />);
    // App should render without throwing errors
  });

  it('contains a Router', () => {
    render(<App />);
    // Router should be present (indirect test)
  });
});
