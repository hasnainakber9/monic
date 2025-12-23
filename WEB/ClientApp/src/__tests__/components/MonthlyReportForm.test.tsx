/**
 * Unit Tests for MonthlyReportForm Component
 * Uses Jest + React Testing Library
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MonthlyReportForm from '../../components/MonthlyReportForm';
import * as MonthlyReportAPI from '../../services/seicApi';

jest.mock('../../services/seicApi');

describe('MonthlyReportForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders form with all sections', () => {
    render(<MonthlyReportForm startupId={123} />);
    
    expect(screen.getByText(/Monthly Progress Report/i)).toBeInTheDocument();
    expect(screen.getByText(/Section 1: Identity & Compliance/i)).toBeInTheDocument();
  });

  test('displays progress bar and section tabs', () => {
    render(<MonthlyReportForm startupId={123} />);
    
    const progressBar = screen.getByText(/Section 1 of 5/);
    expect(progressBar).toBeInTheDocument();
    
    expect(screen.getByText(/Identity & Compliance/i)).toBeInTheDocument();
    expect(screen.getByText(/Financial Performance/i)).toBeInTheDocument();
  });

  test('allows section navigation', async () => {
    render(<MonthlyReportForm startupId={123} />);
    
    // Click next button to go to section 2
    const nextButton = screen.getByRole('button', { name: /Next Section/i });
    fireEvent.click(nextButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Section 2 of 5/)).toBeInTheDocument();
    });
  });

  test('validates required fields', async () => {
    (MonthlyReportAPI.MonthlyReportAPI.submit as jest.Mock).mockRejectedValue(
      new Error('Validation failed')
    );

    render(<MonthlyReportForm startupId={123} />);
    
    // Navigate to last section
    const nextButtons = screen.getAllByRole('button', { name: /Next Section/i });
    for (let i = 0; i < 4; i++) {
      fireEvent.click(nextButtons[0]);
    }

    // Try to submit without filling required fields
    const submitButton = screen.getByRole('button', { name: /Submit Report/i });
    fireEvent.click(submitButton);

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/Error:/i)).toBeInTheDocument();
    });
  });

  test('submits form successfully', async () => {
    const mockData = {
      monthlyRevenuePKR: 100000,
      monthlBurnRatePKR: 50000,
      currentRunwayMonths: 6,
    };

    (MonthlyReportAPI.MonthlyReportAPI.submit as jest.Mock).mockResolvedValue({
      data: mockData,
    });

    const onSuccess = jest.fn();
    render(<MonthlyReportForm startupId={123} onSubmitSuccess={onSuccess} />);

    // Fill form with valid data
    const revenueInput = screen.getByPlaceholderText(/0 if pre-revenue/);
    await userEvent.type(revenueInput, '100000');

    // Navigate and submit
    const nextButtons = screen.getAllByRole('button', { name: /Next Section/i });
    for (let i = 0; i < 4; i++) {
      fireEvent.click(nextButtons[0]);
    }

    const submitButton = screen.getByRole('button', { name: /Submit Report/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(mockData);
    });
  });

  test('shows success message after submission', async () => {
    (MonthlyReportAPI.MonthlyReportAPI.submit as jest.Mock).mockResolvedValue({
      data: {},
    });

    render(<MonthlyReportForm startupId={123} />);

    // Navigate to last section and submit
    const nextButtons = screen.getAllByRole('button', { name: /Next Section/i });
    for (let i = 0; i < 4; i++) {
      fireEvent.click(nextButtons[0]);
    }

    const submitButton = screen.getByRole('button', { name: /Submit Report/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Report submitted successfully/i)).toBeInTheDocument();
    });
  });

  test('calls onCancel when cancel button clicked', async () => {
    const onCancel = jest.fn();
    render(<MonthlyReportForm startupId={123} onCancel={onCancel} />);

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });
});
