'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { categoryApi, footwearSubcategoryApi, shippingRuleApi, shopSubcategoryApi } from '@/lib/api';
import { Category, FootwearSubcategory, ShippingRule, ShopSubcategory } from '@/types';

interface RuleForm {
  name: string;
  priority: number;
  charges: string;
  additionalCharge: number;
  isActive: boolean;
  categoryIds: string[];
  footwearSubcategoryIds: string[];
  shopSubcategoryIds: string[];
}

type TargetKey = 'categoryIds' | 'footwearSubcategoryIds' | 'shopSubcategoryIds';

interface TargetOption {
  id: string;
  label: string;
}

const EMPTY_FORM: RuleForm = {
  name: '',
  priority: 1,
  charges: '',
  additionalCharge: 0,
  isActive: true,
  categoryIds: [],
  footwearSubcategoryIds: [],
  shopSubcategoryIds: [],
};

const parseCharges = (raw: string): number[] =>
  raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map(Number);

const chargeFor = (charges: number[], additional: number, qty: number): number =>
  qty <= charges.length ? charges[qty - 1] : charges[charges.length - 1] + (qty - charges.length) * additional;

const describe = (rule: Pick<ShippingRule, 'charges' | 'additionalCharge'>): string => {
  const steps = rule.charges.map((amount, i) => `${i + 1} = ₹${amount}`).join(', ');
  return `${steps}; then +₹${rule.additionalCharge} each`;
};

const asList = <T,>(data: unknown): T[] =>
  Array.isArray(data) ? (data as T[]) : ((data as { data?: T[] })?.data ?? []);

function TargetPicker({
  title,
  options,
  selected,
  onChange,
}: {
  title: string;
  options: TargetOption[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [query, setQuery] = useState('');
  const visible = options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()));
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-medium text-gray-700">
          {title} <span className="text-gray-400 font-normal">({selected.length} selected)</span>
        </p>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter…"
          className="w-32 px-2 py-1 border border-gray-300 rounded text-xs text-gray-900"
        />
      </div>
      <div className="max-h-36 overflow-y-auto border border-gray-200 rounded-md divide-y divide-gray-100">
        {visible.length === 0 ? (
          <p className="px-3 py-2 text-xs text-gray-400">Nothing matches.</p>
        ) : (
          visible.map((option) => (
            <label key={option.id} className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-50">
              <input
                type="checkbox"
                checked={selected.includes(option.id)}
                onChange={() => toggle(option.id)}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
              {option.label}
            </label>
          ))
        )}
      </div>
    </div>
  );
}

export default function ShippingRulesPage() {
  const [rules, setRules] = useState<ShippingRule[]>([]);
  const [categories, setCategories] = useState<TargetOption[]>([]);
  const [footwearTiles, setFootwearTiles] = useState<TargetOption[]>([]);
  const [shopTiles, setShopTiles] = useState<TargetOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<ShippingRule | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<RuleForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchRules = useCallback(async () => {
    try {
      const res = await shippingRuleApi.getAll();
      setRules(asList<ShippingRule>(res.data));
    } catch (err) {
      console.error('Failed to load shipping rules:', err);
      setError('Failed to load shipping rules. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
    Promise.all([categoryApi.getAll({ limit: 200 }), footwearSubcategoryApi.getAll(), shopSubcategoryApi.getAll()])
      .then(([catRes, footRes, shopRes]) => {
        setCategories(
          asList<Category>(catRes.data).map((c) => ({
            id: c._id,
            label: `${typeof c.genderId === 'object' ? `${c.genderId.name} · ` : ''}${c.name}`,
          })),
        );
        setFootwearTiles(asList<FootwearSubcategory>(footRes.data).map((t) => ({ id: t._id, label: t.name })));
        setShopTiles(
          asList<ShopSubcategory>(shopRes.data).map((t) => ({
            id: t._id,
            label: `${typeof t.shopCategoryId === 'object' ? `${t.shopCategoryId.name} · ` : ''}${t.name}`,
          })),
        );
      })
      .catch((err) => console.error('Failed to load categories/tiles:', err));
  }, [fetchRules]);

  const labelsById = useMemo(
    () => new Map([...categories, ...footwearTiles, ...shopTiles].map((o) => [o.id, o.label])),
    [categories, footwearTiles, shopTiles],
  );

  const targetsOf = (rule: ShippingRule): string => {
    if (rule.isFallback) return 'Everything not matched above';
    const labels = [...rule.categoryIds, ...rule.footwearSubcategoryIds, ...rule.shopSubcategoryIds]
      .map((id) => labelsById.get(id))
      .filter(Boolean);
    return labels.length ? labels.join(', ') : 'Nothing selected yet';
  };

  const openCreate = () => {
    const nextPriority = Math.max(0, ...rules.filter((r) => !r.isFallback).map((r) => r.priority)) + 1;
    setEditing(null);
    setForm({ ...EMPTY_FORM, priority: nextPriority });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEdit = (rule: ShippingRule) => {
    setEditing(rule);
    setForm({
      name: rule.name,
      priority: rule.priority,
      charges: rule.charges.join(', '),
      additionalCharge: rule.additionalCharge,
      isActive: rule.isActive,
      categoryIds: rule.categoryIds,
      footwearSubcategoryIds: rule.footwearSubcategoryIds,
      shopSubcategoryIds: rule.shopSubcategoryIds,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const charges = parseCharges(form.charges);
  const chargesValid = charges.length > 0 && charges.every((c) => Number.isFinite(c) && c >= 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setFormError('Name is required.');
    if (!chargesValid) return setFormError('Enter charges as numbers, e.g. "250" or "150, 300, 400".');

    const payload = editing?.isFallback
      ? { name: form.name.trim(), charges, additionalCharge: form.additionalCharge }
      : { ...form, name: form.name.trim(), charges };

    setIsSaving(true);
    setFormError(null);
    try {
      if (editing) await shippingRuleApi.update(editing._id, payload);
      else await shippingRuleApi.create(payload);
      setIsModalOpen(false);
      await fetchRules();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setFormError((Array.isArray(message) ? message.join(', ') : message) || 'Failed to save the rule.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (rule: ShippingRule) => {
    try {
      await shippingRuleApi.update(rule._id, { isActive: !rule.isActive });
      await fetchRules();
    } catch {
      setError('Failed to update the rule.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await shippingRuleApi.delete(id);
      setDeleteConfirm(null);
      await fetchRules();
    } catch {
      setError('Failed to delete the rule.');
    }
  };

  const setTargets = (key: TargetKey) => (next: string[]) => setForm((prev) => ({ ...prev, [key]: next }));

  return (
    <div>
      <div className="mb-6 flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipping</h1>
          <p className="mt-1 text-sm text-gray-600 max-w-2xl">
            Each cart item is charged by the first rule (lowest priority number) covering its category or tile. Items
            of the same rule are counted together, and the charges of all rules in the cart are added up.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Add Rule
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['#', 'Rule', 'Applies to', 'Charges', 'Status', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    Loading…
                  </td>
                </tr>
              ) : (
                rules.map((rule) => (
                  <tr key={rule._id} className={rule.isFallback ? 'bg-gray-50' : 'hover:bg-gray-50'}>
                    <td className="px-4 py-3 text-gray-500">{rule.isFallback ? '—' : rule.priority}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{rule.name}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-md">
                      <span className="line-clamp-2">{targetsOf(rule)}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{describe(rule)}</td>
                    <td className="px-4 py-3">
                      {rule.isFallback ? (
                        <span className="text-xs text-gray-500">Always on</span>
                      ) : (
                        <button
                          onClick={() => handleToggleActive(rule)}
                          className={`px-2 text-xs leading-5 font-semibold rounded-full ${
                            rule.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap font-medium">
                      <button onClick={() => openEdit(rule)} className="text-indigo-600 hover:text-indigo-900">
                        Edit
                      </button>
                      {!rule.isFallback &&
                        (deleteConfirm === rule._id ? (
                          <span className="ml-4 space-x-2">
                            <button onClick={() => handleDelete(rule._id)} className="text-red-600 hover:text-red-900">
                              Confirm
                            </button>
                            <button onClick={() => setDeleteConfirm(null)} className="text-gray-600">
                              Cancel
                            </button>
                          </span>
                        ) : (
                          <button onClick={() => setDeleteConfirm(rule._id)} className="ml-4 text-red-600 hover:text-red-900">
                            Delete
                          </button>
                        ))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500/75 p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 overflow-y-auto space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editing ? `Edit ${editing.isFallback ? 'fallback rule' : 'rule'}` : 'Add shipping rule'}
              </h3>

              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">{formError}</div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  />
                </div>
                {!editing?.isFallback && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <input
                      type="number"
                      value={form.priority}
                      onChange={(e) => setForm((prev) => ({ ...prev, priority: parseInt(e.target.value, 10) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    />
                  </div>
                )}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Charge for 1, 2, 3… items (₹)</label>
                  <input
                    type="text"
                    value={form.charges}
                    onChange={(e) => setForm((prev) => ({ ...prev, charges: e.target.value }))}
                    placeholder="250   or   150, 300, 400"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  />
                  <p className="mt-1 text-xs text-gray-500">Total charge when the cart has that many items of this rule.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Each extra item (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.additionalCharge}
                    onChange={(e) => setForm((prev) => ({ ...prev, additionalCharge: Math.max(0, Number(e.target.value) || 0) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  />
                </div>
              </div>

              {chargesValid && (
                <div className="flex flex-wrap gap-2 text-xs">
                  {[1, 2, 3, 4, 5].map((qty) => (
                    <span key={qty} className="px-2 py-1 rounded bg-gray-100 text-gray-700">
                      {qty} item{qty > 1 ? 's' : ''}: ₹{chargeFor(charges, form.additionalCharge, qty)}
                    </span>
                  ))}
                </div>
              )}

              {!editing?.isFallback && (
                <>
                  <TargetPicker
                    title="Categories"
                    options={categories}
                    selected={form.categoryIds}
                    onChange={setTargets('categoryIds')}
                  />
                  <TargetPicker
                    title="Footwear tiles"
                    options={footwearTiles}
                    selected={form.footwearSubcategoryIds}
                    onChange={setTargets('footwearSubcategoryIds')}
                  />
                  <TargetPicker
                    title="Shop-by-category tiles"
                    options={shopTiles}
                    selected={form.shopSubcategoryIds}
                    onChange={setTargets('shopSubcategoryIds')}
                  />
                  <label className="flex items-center gap-2 text-sm text-gray-800">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                    Active
                  </label>
                </>
              )}
            </div>

            <div className="px-6 py-3 bg-gray-50 flex justify-end gap-3 rounded-b-lg">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
