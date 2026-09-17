// Thin wrapper around PayU's Bolt Web SDK. The backend is the source of truth for
// payment status — bolt's callbacks only tell us the modal is done so we can poll.

interface BoltLaunchData {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  surl: string;
  furl: string;
  hash: string;
  udf1?: string;
}

interface BoltGlobal {
  launch: (
    data: BoltLaunchData,
    handlers: {
      responseHandler: (bolt: { response: Record<string, unknown> }) => void;
      catchException: (bolt: { message?: string }) => void;
    },
  ) => void;
}

declare global {
  interface Window {
    bolt?: BoltGlobal;
  }
}

let loader: Promise<BoltGlobal> | null = null;

function loadBolt(scriptUrl: string): Promise<BoltGlobal> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('PayU Bolt can only load in the browser'));
  }
  if (window.bolt) return Promise.resolve(window.bolt);
  if (loader) return loader;

  loader = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = 'payu-bolt-sdk';
    script.src = scriptUrl;
    script.async = true;
    script.onload = () => {
      if (window.bolt) resolve(window.bolt);
      else reject(new Error('PayU Bolt SDK loaded but window.bolt is missing'));
    };
    script.onerror = () => {
      loader = null;
      reject(new Error('Failed to load PayU Bolt SDK'));
    };
    document.head.appendChild(script);
  });
  return loader;
}

export type BoltOutcome = 'SUCCESS' | 'FAILED' | 'CANCEL' | 'EXCEPTION';

// Resolves once the Bolt modal closes, with a normalized outcome. Always resolves
// (never rejects) so the caller can fall through to polling backend status.
export async function launchBoltCheckout(
  scriptUrl: string,
  data: BoltLaunchData,
): Promise<{ outcome: BoltOutcome; response?: Record<string, unknown>; message?: string }> {
  const bolt = await loadBolt(scriptUrl);

  return new Promise((resolve) => {
    bolt.launch(data, {
      responseHandler: (b) => {
        const status = String(b?.response?.txnStatus || '').toUpperCase();
        const outcome: BoltOutcome =
          status === 'SUCCESS' || status === 'FAILED' || status === 'CANCEL'
            ? (status as BoltOutcome)
            : 'EXCEPTION';
        resolve({ outcome, response: b?.response });
      },
      catchException: (b) => {
        resolve({ outcome: 'EXCEPTION', message: b?.message });
      },
    });
  });
}
