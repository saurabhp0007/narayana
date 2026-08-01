import { create } from 'zustand';

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ConfirmState {
  isOpen: boolean;
  options: ConfirmOptions | null;
  resolve: ((value: boolean) => void) | null;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  handle: (result: boolean) => void;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  isOpen: false,
  options: null,
  resolve: null,

  confirm: (options: ConfirmOptions) =>
    new Promise<boolean>((resolve) => {
      set({ isOpen: true, options, resolve });
    }),

  handle: (result: boolean) => {
    get().resolve?.(result);
    set({ isOpen: false, options: null, resolve: null });
  },
}));
