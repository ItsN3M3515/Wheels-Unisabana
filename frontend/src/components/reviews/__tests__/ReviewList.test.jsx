import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ReviewList from '../ReviewList';

// Mock API
import * as reviewApi from '../../../api/review';

vi.mock('../../../api/review');

// Mock auth store module to control auth state
vi.mock('../../../store/authStore', () => ({
  default: {
    getState: () => ({ isAuthenticated: true, user: { id: 'u1', role: 'admin' } })
  }
}));

describe('ReviewList', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders reviews and allows admin to hide/unhide', async () => {
    reviewApi.getDriverReviews.mockResolvedValue({ items: [
      { id: 'r1', rating: 5, author: 'Alice', text: 'Great', createdAt: new Date().toISOString(), tags: [], status: 'visible' }
    ], totalPages: 1 });

    reviewApi.getDriverRatings.mockResolvedValue({ avgRating: 5, count: 1, histogram: {1:0,2:0,3:0,4:0,5:1} });

    const adminSpy = reviewApi.adminSetVisibility.mockResolvedValue({ id: 'r1', visibility: 'hidden' });

    render(<ReviewList driverId="d1" />);

    // wait for review to appear
    await waitFor(() => screen.getByText('Alice'));

    // Report button should be present (authenticated)
    expect(screen.getByText(/Reportar|Reportado/)).toBeInTheDocument();

    // Admin hide button should be present
    const hideBtn = screen.getByText(/Ocultar/);
    expect(hideBtn).toBeInTheDocument();

    // Click hide
    fireEvent.click(hideBtn);

    await waitFor(() => expect(adminSpy).toHaveBeenCalledWith('r1', 'hide', expect.any(String)));

    // After hiding, button should show 'Mostrar'
    await waitFor(() => expect(screen.getByText(/Mostrar/)).toBeInTheDocument());
  });
});
