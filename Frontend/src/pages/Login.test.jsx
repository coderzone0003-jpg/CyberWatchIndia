import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../pages/Login';

jest.mock('../utils/api', () => ({
  api: {
    login: jest.fn(),
    getCurrentUser: jest.fn(),
  },
}));

describe('LoginPage Component', () => {
  const mockOnUserLogin = jest.fn();
  const mockOnAdminLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('renders login form', () => {
    render(
      <BrowserRouter>
        <LoginPage onUserLogin={mockOnUserLogin} onAdminLogin={mockOnAdminLogin} />
      </BrowserRouter>
    );

    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  test('shows error message on failed login', async () => {
    const { api } = require('../utils/api');
    api.login.mockRejectedValue(new Error('Invalid credentials'));

    render(
      <BrowserRouter>
        <LoginPage onUserLogin={mockOnUserLogin} onAdminLogin={mockOnAdminLogin} />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'wrongpassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(screen.getByText(/Invalid credentials/)).toBeInTheDocument();
    });
  });

  test('calls onUserLogin with user and token on successful user login', async () => {
    const { api } = require('../utils/api');
    api.login.mockResolvedValue({ token: 'test-token' });
    api.getCurrentUser.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com', role: 'user' },
    });

    render(
      <BrowserRouter>
        <LoginPage onUserLogin={mockOnUserLogin} onAdminLogin={mockOnAdminLogin} />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'TestPass123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(mockOnUserLogin).toHaveBeenCalledWith(
        { id: 'user-123', email: 'test@example.com', role: 'user' },
        'test-token'
      );
    });
    expect(mockOnAdminLogin).not.toHaveBeenCalled();
  });

  test('calls onAdminLogin with user and token on successful admin login', async () => {
    const { api } = require('../utils/api');
    api.login.mockResolvedValue({ token: 'admin-token' });
    api.getCurrentUser.mockResolvedValue({
      user: { id: 'admin-123', email: 'admin@example.com', role: 'admin' },
    });

    render(
      <BrowserRouter>
        <LoginPage onUserLogin={mockOnUserLogin} onAdminLogin={mockOnAdminLogin} />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'admin@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'AdminPass123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(mockOnAdminLogin).toHaveBeenCalledWith(
        { id: 'admin-123', email: 'admin@example.com', role: 'admin' },
        'admin-token'
      );
    });
    expect(mockOnUserLogin).not.toHaveBeenCalled();
  });
});
