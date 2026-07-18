'use client';

import { useEffect, useState } from 'react';
import { settingsApi } from '@/lib/api';

export default function HomepageSettingsPage() {
  const [countdownEnabled, setCountdownEnabled] = useState(false);
  const [countdownEndDate, setCountdownEndDate] = useState('');
  const [countdownLabel, setCountdownLabel] = useState('Mega Sale');
  const [announcementBarEnabled, setAnnouncementBarEnabled] = useState(false);
  const [announcementBarText, setAnnouncementBarText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    settingsApi
      .getHomepage()
      .then((res) => {
        const data = res.data;
        setCountdownEnabled(data.countdownEnabled || false);
        setCountdownEndDate(data.countdownEndDate ? new Date(data.countdownEndDate).toISOString().slice(0, 16) : '');
        setCountdownLabel(data.countdownLabel || 'Mega Sale');
        setAnnouncementBarEnabled(data.announcementBarEnabled || false);
        setAnnouncementBarText(data.announcementBarText || '');
      })
      .catch((err) => {
        console.error('Failed to load homepage settings:', err);
        setError('Failed to load settings.');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (countdownEnabled && countdownEndDate && new Date(countdownEndDate).getTime() <= Date.now()) {
      setError('The countdown end date is in the past. Pick a future date, or turn the countdown off, before saving.');
      return;
    }

    setIsSaving(true);
    try {
      await settingsApi.updateHomepage({
        countdownEnabled,
        countdownEndDate: countdownEndDate ? new Date(countdownEndDate).toISOString() : undefined,
        countdownLabel,
        announcementBarEnabled,
        announcementBarText,
      });
      setSuccessMessage('Homepage settings saved.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to save homepage settings:', err);
      setError('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Homepage Settings</h1>
        <p className="mt-2 text-sm text-gray-600">
          Controls for homepage display elements that aren&apos;t tied to a specific offer or product.
        </p>
      </div>

      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
      )}

      <form onSubmit={handleSave} className="bg-white shadow rounded-lg p-6 max-w-xl">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Countdown Timer</h2>

        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="countdownEnabled"
            checked={countdownEnabled}
            onChange={(e) => setCountdownEnabled(e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="countdownEnabled" className="ml-2 block text-sm text-gray-900">
            Show countdown timer on homepage
          </label>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
          <input
            type="text"
            value={countdownLabel}
            onChange={(e) => setCountdownLabel(e.target.value)}
            placeholder="Mega Sale"
            className="text-black w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Ends At</label>
          <input
            type="datetime-local"
            value={countdownEndDate}
            onChange={(e) => setCountdownEndDate(e.target.value)}
            className="text-black w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
          {countdownEnabled && countdownEndDate && new Date(countdownEndDate).getTime() <= Date.now() && (
            <p className="mt-1 text-xs text-amber-600">
              This date has already passed — the countdown won&apos;t show on the homepage until you set a future date.
            </p>
          )}
        </div>

        <h2 className="text-lg font-medium text-gray-900 mb-4 pt-4 border-t border-gray-100">Announcement Bar</h2>

        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="announcementBarEnabled"
            checked={announcementBarEnabled}
            onChange={(e) => setAnnouncementBarEnabled(e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="announcementBarEnabled" className="ml-2 block text-sm text-gray-900">
            Show announcement bar above the hero banner
          </label>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Text</label>
          <input
            type="text"
            value={announcementBarText}
            onChange={(e) => setAnnouncementBarText(e.target.value)}
            placeholder="UP TO 90% OFF BEST-SELLING ITEMS"
            className="text-black w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
