import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminActions from '../AdminActions';
import * as adminApi from '../../../api/admin';

// Mock auth store to be admin
vi.mock('../../../store/authStore', () => {
  const state = { user: { id: 'admin_01', role: 'admin' }, isAuthenticated: true };
  const store = (selector) => (typeof selector === 'function' ? selector(state) : state);
  store.getState = () => state;
  return { default: store };
});

vi.mock('../../../api/admin');

describe('AdminActions', () => {
  beforeEach(() => vi.resetAllMocks());

  it('suspends and unsuspends a user via modal flow', async () => {
    adminApi.suspendUser.mockResolvedValue({ ok: true });

    render(<AdminActions userId="u1" />);

    // click suspend
    fireEvent.click(screen.getByText(/Suspender/));

    // modal should appear
    expect(screen.getByText(/Razón/)).toBeInTheDocument();

    // enter reason and confirm
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Policy violation' } });
    fireEvent.click(screen.getByText(/Enviar/));

    await waitFor(() => expect(adminApi.suspendUser).toHaveBeenCalledWith('u1', true, 'Policy violation'));
  });
});
