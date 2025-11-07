import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReviewForm from './ReviewForm';

describe('ReviewForm', () => {
  it('renders with existing review and submits', async () => {
    const onSubmit = vi.fn();
    const existingReview = { rating: 4, text: 'Good', tags: ['Puntual'] };
    render(<ReviewForm tripId="t1" existingReview={existingReview} onSubmit={onSubmit} onCancel={() => {}} />);

    // Button should show "Actualizar reseña"
    const submitButton = screen.getByRole('button', { name: /actualizar reseña/i });
    expect(submitButton).toBeEnabled();

    // Click submit
    await userEvent.click(submitButton);
    expect(onSubmit).toHaveBeenCalled();
  });

  it('allows toggling tags and shows selected list', async () => {
    const onSubmit = vi.fn();
    render(<ReviewForm tripId="t1" onSubmit={onSubmit} onCancel={() => {}} />);

    const punctual = screen.getByText('Puntual');
    await userEvent.click(punctual);
    expect(screen.getByText(/Seleccionadas:/i)).toBeInTheDocument();
  });
});
