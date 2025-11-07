import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminActionModal from '../AdminActionModal';

describe('AdminActionModal', () => {
  it('validates reason and calls onConfirm', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onCancel = vi.fn();

    render(<AdminActionModal title="Test" actionLabel="Do" onCancel={onCancel} onConfirm={onConfirm} />);

    // Try to submit empty reason -> should show validation
    fireEvent.click(screen.getByText(/Do/));
    expect(await screen.findByText(/proporciona una razón/i)).toBeInTheDocument();

    // enter valid reason
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'This is a valid reason' } });
    fireEvent.click(screen.getByText(/Do/));

    // onConfirm should be called with reason
    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith('This is a valid reason'));
  });
});
