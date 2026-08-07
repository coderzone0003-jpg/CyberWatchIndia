import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../components/Navbar';

describe('Navbar Component', () => {
  const mockLogout = jest.fn();

  test('renders public navigation links when not authenticated', () => {
    render(
      <BrowserRouter>
        <Navbar authUser={null} onLogout={mockLogout} />
      </BrowserRouter>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Report Crime')).toBeInTheDocument();
    expect(screen.getByText('Track Complaint')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
  });

  test('renders dashboard link when authenticated as user', () => {
    render(
      <BrowserRouter>
        <Navbar 
          authUser={{ role: 'user', name: 'Test User' }} 
          onLogout={mockLogout} 
        />
      </BrowserRouter>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
  });

  test('renders dashboard link when authenticated as admin', () => {
    render(
      <BrowserRouter>
        <Navbar 
          authUser={{ role: 'admin', name: 'Admin User' }} 
          onLogout={mockLogout} 
        />
      </BrowserRouter>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  test('calls logout function when logout button is clicked', () => {
    render(
      <BrowserRouter>
        <Navbar 
          authUser={{ role: 'user', name: 'Test User' }} 
          onLogout={mockLogout} 
        />
      </BrowserRouter>
    );

    const logoutButton = screen.getByText('Logout');
    logoutButton.click();
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});