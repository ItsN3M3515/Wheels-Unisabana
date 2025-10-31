import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useBookingStore = create(
  persist(
    (set, get) => ({
      // State
      bookings: [],
      isLoading: false,
      error: null,
      
      // Actions
      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error }),
      
      clearError: () => set({ error: null }),
      
      setBookings: (bookings) => set({ bookings }),
      
      addBooking: (booking) => set((state) => ({
        bookings: [booking, ...state.bookings]
      })),
      
      updateBooking: (bookingId, updates) => set((state) => ({
        bookings: state.bookings.map(booking => 
          booking.id === bookingId ? { ...booking, ...updates } : booking
        )
      })),
      
      removeBooking: (bookingId) => set((state) => ({
        bookings: state.bookings.filter(booking => booking.id !== bookingId)
      })),
      
      // Helper methods
      getBookingById: (id) => {
        return get().bookings.find(booking => booking.id === id);
      },
      
      getBookingsByStatus: (status) => {
        return get().bookings.filter(booking => booking.status === status);
      },
      
      getBookingsByTripId: (tripId) => {
        return get().bookings.filter(booking => booking.tripId === tripId);
      },
      
      // API Actions
      fetchBookings: async (filters = {}) => {
        set({ isLoading: true, error: null });
        
        try {
          const queryParams = new URLSearchParams();
          if (filters.status) {
            if (Array.isArray(filters.status)) {
              filters.status.forEach(s => queryParams.append('status', s));
            } else {
              queryParams.append('status', filters.status);
            }
          }
          if (filters.page) queryParams.append('page', filters.page);
          if (filters.pageSize) queryParams.append('pageSize', filters.pageSize);
          
          const response = await fetch(`/api/passengers/bookings?${queryParams}`, {
            credentials: 'include'
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch bookings');
          }
          
          const data = await response.json();
          set({ 
            bookings: data.items || data.bookings || [],
            isLoading: false 
          });
          
          return data;
        } catch (error) {
          set({ 
            error: error.message,
            isLoading: false 
          });
          throw error;
        }
      },
      
      createBooking: async (bookingData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch('/api/passengers/bookings', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content || ''
            },
            body: JSON.stringify(bookingData)
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create booking');
          }
          
          const booking = await response.json();
          set((state) => ({
            bookings: [booking, ...state.bookings],
            isLoading: false
          }));
          
          return booking;
        } catch (error) {
          set({ 
            error: error.message,
            isLoading: false 
          });
          throw error;
        }
      },
      
      updateBookingStatus: async (bookingId, status, decisionData = {}) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`/api/passengers/bookings/${bookingId}/status`, {
            method: 'PATCH',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content || ''
            },
            body: JSON.stringify({ status, ...decisionData })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update booking status');
          }
          
          const updatedBooking = await response.json();
          set((state) => ({
            bookings: state.bookings.map(booking => 
              booking.id === bookingId ? { ...booking, ...updatedBooking } : booking
            ),
            isLoading: false
          }));
          
          return updatedBooking;
        } catch (error) {
          set({ 
            error: error.message,
            isLoading: false 
          });
          throw error;
        }
      },
      
      cancelBooking: async (bookingId, reason = '') => {
        return get().updateBookingStatus(bookingId, 'canceled_by_passenger', { reason });
      },
      
      // Payment related methods
      markBookingAsPaid: (bookingId) => {
        set((state) => ({
          bookings: state.bookings.map(booking => 
            booking.id === bookingId ? { ...booking, isPaid: true } : booking
          )
        }));
      },
      
      // Statistics
      getBookingStats: () => {
        const bookings = get().bookings;
        return {
          total: bookings.length,
          pending: bookings.filter(b => b.status === 'pending').length,
          accepted: bookings.filter(b => b.status === 'accepted').length,
          declined: bookings.filter(b => b.status === 'declined').length,
          canceled: bookings.filter(b => b.status === 'canceled_by_passenger').length,
          paid: bookings.filter(b => b.isPaid).length
        };
      }
    }),
    {
      name: 'booking-store',
      partialize: (state) => ({
        bookings: state.bookings
      })
    }
  )
);
