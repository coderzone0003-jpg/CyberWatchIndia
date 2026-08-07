import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../pages/Login';

// Mock API
jest.mock('../utils/api', () => ({
  login: jest.fn(),
  getPasswordRequirements: jest.fn(() => Promise.resolve({ requirements: { minLength: 8 } }))
}));

describe('LoginPage Component', () => {
  const mockOnLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders login form', () => {
    render(
      <BrowserRouter>
        <LoginPage onLogin={mockOnLogin} />
      </BrowserRouter>
    );

    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  test('shows error message on failed login', async () => {
    const { login } = require('../utils/api');
    login.mockRejectedValue(new Error('Invalid credentials'));

    render(
      <BrowserRouter>
        <LoginPage onLogin={mockOnLogin} />
      </BrowserRouter>
    );

    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('Password');
    const loginButton = screen.getByText('Login');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText(/Invalid credentials/)).toBeInTheDocument();
    });
  });

  test('disables submit button while loading', async () => {
    const { login } = require('../utils/api');
    login.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <BrowserRouter>
        <LoginPage onLogin={mockOnLogin} />
      </BrowserRouter>
    );

    const loginButton = screen.getByText('Login');
    fireEvent.click(loginButton);

    expect(loginButton).toBeDisabled();
  });

  test('calls onLogin with user and token on successful login', async () => {
    const { login } = require('../utils/api');
    login.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com', role: 'user' },
      token: 'test-token'
    });

    render(
      <BrowserRouter>
        <LoginPage onLogin={mockOnLogin} />
      </BrowserRouter>
    );

    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('Password');
    const loginButton = screen.getByText('Login');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'TestPass123!' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(mockOnLogin).toHaveBeenCalledWith(
        { id: 'user-123', email: 'test@example.com', role: 'user' },
        'test-token'
      );
    });
  });
});