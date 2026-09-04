'use client';

import { useCallback, useEffect, useState } from 'react';
import { sizeGroupApi } from '@/lib/api';
import { SizeGroup, SizeStock } from '@/types';
import { useConfirmStore } from '@/store/confirmStore';

interface SizesAndStockEditorProps {
  value: SizeStock[];
  onChange: (next: SizeStock[]) => void;
}

export default function SizesAndStockEditor({ value, onChange }: SizesAndStockEditorProps) {
  const [groups, setGroups] = useState<SizeGroup[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [stockInput, setStockInput] = useState('');
  const [sizeError, setSizeError] = useState<string | null>(null);
  const [newSizeByGroup, setNewSizeByGroup] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const loadGroups = useCallback(async () => {
    try {
      const res = await sizeGroupApi.getAll(true);
      const list: SizeGroup[] = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setGroups(list);
      setLoadError(null);
    } catch (err) {
      console.error('Failed to load size groups:', err);
      setLoadError('Could not load size groups. Refresh the page to try again.');
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const total = value.reduce((sum, s) => sum + s.stock, 0);
  const addedSizes = new Set(value.map((s) => s.size.toLowerCase()));

  const toggleKey = (key: string) => {
    setSelectedKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const addSelectedSizes = () => {
    if (selectedKeys.length === 0) {
      setSizeError('Select at least one size');
      return;
    }
    const stock = Math.max(0, parseInt(stockInput, 10) || 0);
    const rows = selectedKeys
      .map((key) => key.slice(key.indexOf('::') + 2))
      .filter((size) => !addedSizes.has(size.toLowerCase()))
      .map((size) => ({ size, stock }));
    onChange([...value, ...rows]);
    setSelectedKeys([]);
    setStockInput('');
    setSizeError(null);
  };

  const updateQty = (size: string, stock: number) => {
    onChange(value.map((s) => (s.size === size ? { ...s, stock: Math.max(0, stock) } : s)));
  };

  const removeRow = (size: string) => {
    onChange(value.filter((s) => s.size !== size));
  };

  const addSizeToGroup = async (group: SizeGroup) => {
    const raw = (newSizeByGroup[group._id] || '').trim();
    if (!raw || busy) return;
    setBusy(true);
    setSizeError(null);
    try {
      await sizeGroupApi.addSize(group._id, raw);
      setNewSizeByGroup((prev) => ({ ...prev, [group._id]: '' }));
      await loadGroups();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not add that size.';
      setSizeError(message);
    } finally {
      setBusy(false);
    }
  };

  const removeSizeFromGroup = async (group: SizeGroup, size: string) => {
    const ok = await useConfirmStore.getState().confirm({
      title: `Remove "${size}" from ${group.name}?`,
      description:
        'It will no longer be offered when creating or editing products. Products that already use it keep it.',
      confirmLabel: 'Remove',
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await sizeGroupApi.removeSize(group._id, size);
      await loadGroups();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not remove that size.';
      setSizeError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Sizes &amp; Stock *</label>
      <p className="text-xs text-gray-500 mb-3">
        Tick one or more sizes, set a stock quantity, then Add — every ticked size is created with
        that stock. Type in the &ldquo;+ size&rdquo; box to add a custom size to a group, or use
        &times; on a size to remove it. New sizes are saved and appear on every product form.
      </p>

      {loadError && <p className="mb-3 text-sm text-red-600">{loadError}</p>}

      <div className="space-y-4 mb-4">
        {groups.map((group) => (
          <div key={group._id}>
            <div className="flex items-baseline gap-2 mb-1">
              <p className="text-xs font-semibold text-gray-700">{group.name}</p>
              {group.measurement && (
                <span className="text-[10px] uppercase tracking-wide text-gray-400">
                  {group.measurement}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {group.sizes.map((size) => {
                const alreadyAdded = addedSizes.has(size.toLowerCase());
                const key = `${group._id}::${size}`;
                const isSelected = selectedKeys.includes(key);
                return (
                  <span
                    key={size}
                    className={`inline-flex items-center rounded-md border text-xs font-medium transition-colors ${
                      alreadyAdded
                        ? 'border-gray-200 bg-gray-50 text-gray-300'
                        : isSelected
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    <button
                      type="button"
                      disabled={alreadyAdded}
                      onClick={() => toggleKey(key)}
                      className="min-w-[2.5rem] px-2.5 py-1.5 disabled:cursor-not-allowed"
                    >
                      {size}
                      {alreadyAdded ? ' ✓' : ''}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSizeFromGroup(group, size)}
                      disabled={busy}
                      title={`Remove ${size} from ${group.name}`}
                      className={`px-1.5 py-1.5 text-sm leading-none ${
                        isSelected ? 'text-indigo-100 hover:text-white' : 'text-gray-300 hover:text-red-500'
                      }`}
                    >
                      ×
                    </button>
                  </span>
                );
              })}
              <span className="inline-flex items-center gap-1">
                <input
                  type="text"
                  value={newSizeByGroup[group._id] || ''}
                  onChange={(e) =>
                    setNewSizeByGroup((prev) => ({ ...prev, [group._id]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSizeToGroup(group);
                    }
                  }}
                  placeholder="+ size"
                  className="w-24 px-2 py-1.5 border border-dashed border-gray-300 rounded-md text-xs text-black focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => addSizeToGroup(group)}
                  disabled={busy || !(newSizeByGroup[group._id] || '').trim()}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-40"
                >
                  Add
                </button>
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-2">
        <input
          type="number"
          min="0"
          value={stockInput}
          onChange={(e) => setStockInput(e.target.value)}
          className="text-black w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Stock"
        />
        <button
          type="button"
          onClick={addSelectedSizes}
          disabled={selectedKeys.length === 0}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          Add{selectedKeys.length > 0 ? ` ${selectedKeys.length} Size${selectedKeys.length > 1 ? 's' : ''}` : ''}
        </button>
      </div>
      {sizeError && <p className="mb-2 text-sm text-red-600">{sizeError}</p>}

      {value.length > 0 && (
        <p className="mb-2 text-xs text-gray-500">
          Total stock: <span className="font-medium text-gray-700">{total}</span>
        </p>
      )}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((entry) => (
            <div
              key={entry.size}
              className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md"
            >
              <span className="text-sm font-medium text-gray-900">{entry.size}</span>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  value={entry.stock}
                  onChange={(e) => updateQty(entry.size, parseInt(e.target.value) || 0)}
                  className="text-black w-24 px-2 py-1 border border-gray-300 rounded-md text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeRow(entry.size)}
                  className="text-red-600 hover:text-red-900 text-sm"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
