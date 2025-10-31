import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const usePaymentStore = create(
  persist(
    (set, get) => ({
      // State
      transactions: [],
      currentPaymentIntent: null,
      isLoading: false,
      error: null,
      
      // Actions
      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error }),
      
      clearError: () => set({ error: null }),
      
      setCurrentPaymentIntent: (paymentIntent) => set({ 
        currentPaymentIntent: paymentIntent 
      }),
      
      clearCurrentPaymentIntent: () => set({ 
        currentPaymentIntent: null 
      }),
      
      setTransactions: (transactions) => set({ transactions }),
      
      addTransaction: (transaction) => set((state) => ({
        transactions: [transaction, ...state.transactions]
      })),
      
      updateTransaction: (transactionId, updates) => set((state) => ({
        transactions: state.transactions.map(t => 
          t.id === transactionId ? { ...t, ...updates } : t
        )
      })),
      
      // API Actions
      createPaymentIntent: async (bookingId) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch('/api/passengers/payments/intents', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content || ''
            },
            body: JSON.stringify({ bookingId })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create payment intent');
          }
          
          const paymentIntent = await response.json();
          set({ 
            currentPaymentIntent: paymentIntent,
            isLoading: false 
          });
          
          return paymentIntent;
        } catch (error) {
          set({ 
            error: error.message,
            isLoading: false 
          });
          throw error;
        }
      },
      
      getTransactions: async (filters = {}) => {
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
          
          const response = await fetch(`/api/passengers/transactions?${queryParams}`, {
            credentials: 'include'
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch transactions');
          }
          
          const data = await response.json();
          set({ 
            transactions: data.items,
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
      
      // Helper methods
      getTransactionById: (id) => {
        return get().transactions.find(t => t.id === id);
      },
      
      getTransactionsByStatus: (status) => {
        return get().transactions.filter(t => t.status === status);
      },
      
      getTotalAmount: () => {
        return get().transactions
          .filter(t => t.status === 'succeeded')
          .reduce((total, t) => total + t.amount, 0);
      }
    }),
    {
      name: 'payment-store',
      partialize: (state) => ({
        transactions: state.transactions,
        currentPaymentIntent: state.currentPaymentIntent
      })
    }
  )
);

export default usePaymentStore;
