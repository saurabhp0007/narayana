import { create } from 'zustand';

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  isOpen: boolean;
  resolve: ((value: boolean) => void) | null;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  handleConfirm: () => void;
  handleCancel: () => void;
}

/**
 * Promise-based replacement for window.confirm(). Usage:
 *   const ok = await useConfirmStore.getState().confirm({ title: 'Clear cart?' });
 *   if (!ok) return;
 * Rendered once by <ConfirmDialog /> in the root layout.
 */
export const useConfirmStore = create<ConfirmState>((set, get) => ({
  isOpen: false,
  title: '',
  description: undefined,
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  danger: false,
  resolve: null,

  confirm: (options) =>
    new Promise<boolean>((resolve) => {
      set({
        isOpen: true,
        title: options.title,
        description: options.description,
        confirmLabel: options.confirmLabel || 'Confirm',
        cancelLabel: options.cancelLabel || 'Cancel',
        danger: options.danger || false,
        resolve,
      });
    }),

  handleConfirm: () => {
    get().resolve?.(true);
    set({ isOpen: false, resolve: null });
  },

  handleCancel: () => {
    get().resolve?.(false);
    set({ isOpen: false, resolve: null });
  },
}));
