import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminDashboardPage from '../AdminDashboard';
import * as adminApi from '../../../api/admin';

vi.mock('../../../api/admin');

// Mock auth store to be admin
vi.mock('../../../store/authStore', () => {
  const state = { isAuthenticated: true, user: { id: 'admin_01', role: 'admin' } };
  const store = (selector) => (typeof selector === 'function' ? selector(state) : state);
  store.getState = () => state;
  return { default: store };
});

describe('AdminDashboard', () => {
  beforeEach(() => vi.resetAllMocks());

  it('creates a moderation note with evidence upload', async () => {
    // Mock upload URL creation
    adminApi.createModerationUploadUrl.mockResolvedValue({ url: 'https://example.com/upload', headers: { 'content-type': 'image/png' } });
    adminApi.createModerationNote.mockResolvedValue({ ok: true });

    // Mock fetch for PUT upload
    global.fetch = vi.fn().mockResolvedValue({ ok: true });

    const { container } = render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    // set user id and choose a fake file via input - simulate by setting file input value via event
    const file = new File(['dummy'], 'evidence.png', { type: 'image/png' });

    // find file input via container
    const fileInputElement = container.querySelector('input[type=file]');
    expect(fileInputElement).toBeTruthy();
    Object.defineProperty(fileInputElement, 'files', { value: [file] });
    fireEvent.change(fileInputElement);

    // set target user id in input
    const targetInput = screen.getByPlaceholderText(/Target User ID/i);
    fireEvent.change(targetInput, { target: { value: 'u1' } });

    // click create note - opens modal
    fireEvent.click(screen.getByText(/Crear nota/));

    // modal present
    await waitFor(() => screen.getByText(/Razón/));

  const reasonTextarea = screen.getByPlaceholderText(/Describe por qué/i);
  fireEvent.change(reasonTextarea, { target: { value: 'Moderation note reason' } });
  fireEvent.click(screen.getByRole('button', { name: /^Crear$/ }));

    await waitFor(() => expect(adminApi.createModerationUploadUrl).toHaveBeenCalled());
    await waitFor(() => expect(adminApi.createModerationNote).toHaveBeenCalledWith('User', 'u1', 'Moderation note reason', 'https://example.com/upload'));
  });
});
