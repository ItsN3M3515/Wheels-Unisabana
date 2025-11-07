import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReportReviewModal from '../ReportReviewModal';
import * as reviewApi from '../../../api/review';

vi.mock('../../../api/review');

describe('ReportReviewModal', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('submits report and calls callbacks', async () => {
    const fakeReport = vi.spyOn(reviewApi, 'reportReview').mockResolvedValue({ ok: true });
    const onClose = vi.fn();
    const onReported = vi.fn();

    render(<ReportReviewModal reviewId="r1" onClose={onClose} onReported={onReported} />);

    // choose category and enter reason
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'abuse' } });
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Offensive content' } });

    fireEvent.click(screen.getByText(/Enviar reporte/i));

    await waitFor(() => {
      expect(fakeReport).toHaveBeenCalledWith('r1', expect.objectContaining({ category: 'abuse', reason: 'Offensive content' }));
    });
    // modal should call callbacks
    expect(onReported).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
