'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, Input, Textarea, Button } from '@digital-order/ui';
import { useCategories, useCreateCategory, useCreateMenuItem, useUpdateMenuItem, useMenuItems } from '@/hooks/useMenu';
import { ImageUpload } from './ImageUpload';

interface MenuItem {
  id?: string;
  name: string;
  description: string;
  basePrice: number;
  categoryId: string;
  prepTime: number;
  allergens: string[];
  dietaryTags: string[];
  imageUrl?: string;
  suggestedItems?: { suggestedItem: { id: string; name: string } }[];
}

interface MenuItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  item?: MenuItem | null;
  onSuccess?: () => void;
}

export const MenuItemForm: React.FC<MenuItemFormProps> = ({
  open,
  onOpenChange,
  tenantId,
  item,
  onSuccess,
}) => {
  const { data: categories } = useCategories(tenantId);
  const { data: menuItems } = useMenuItems(tenantId);
  const createMutation = useCreateMenuItem(tenantId);
  const updateMutation = useUpdateMenuItem(tenantId);
  const createCategoryMutation = useCreateCategory(tenantId);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const suggestedItemsDropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<MenuItem>({
    name: '',
    description: '',
    basePrice: 0,
    categoryId: '',
    prepTime: 15,
    allergens: [],
    dietaryTags: [],
    imageUrl: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [allergenInput, setAllergenInput] = useState('');
  const [dietaryTagInput, setDietaryTagInput] = useState('');
  const [selectedDietaryTags, setSelectedDietaryTags] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [relatedItemsDropdownOpen, setRelatedItemsDropdownOpen] = useState(false);
  const [relatedItemsSearch, setRelatedItemsSearch] = useState('');
  const [selectedSuggestedItemIds, setSelectedSuggestedItemIds] = useState<string[]>([]);

  useEffect(() => {
    if (item) {
      setFormData({
        ...item,
        basePrice: typeof item.basePrice === 'number' ? item.basePrice : Number(item.basePrice),
      });
      setSelectedDietaryTags(item.dietaryTags || []);
    } else {
      setFormData({
        name: '',
        description: '',
        basePrice: 0,
        categoryId: categories?.[0]?.id || '',
        prepTime: 15,
        allergens: [],
        dietaryTags: [],
        imageUrl: '',
      });
      setSelectedDietaryTags([]);
    }
    setDietaryTagInput('');
    setNewCategoryName('');
    setCategoryDropdownOpen(false);
    setRelatedItemsDropdownOpen(false);
    setRelatedItemsSearch('');
    setSelectedSuggestedItemIds(
      item?.suggestedItems?.map((s: any) => s.suggestedItem?.id).filter(Boolean) ?? []
    );
    setSubmitError(null);
    setErrors({});
  }, [item, categories, open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setCategoryDropdownOpen(false);
      }
      if (suggestedItemsDropdownRef.current && !suggestedItemsDropdownRef.current.contains(e.target as Node)) {
        setRelatedItemsDropdownOpen(false);
      }
    };
    if (categoryDropdownOpen || relatedItemsDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [categoryDropdownOpen, relatedItemsDropdownOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }
    if (formData.basePrice <= 0) {
      newErrors.basePrice = 'Price must be greater than 0';
    }
    if (formData.prepTime <= 0) {
      newErrors.prepTime = 'Prep time must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted', { formData, selectedDietaryTags });

    if (!validate()) {
      console.log('Validation failed', errors);
      return;
    }

    // Clean the data - remove fields that shouldn't be sent to API
    const { id, tenantId, createdAt, updatedAt, category, availability, active, variants, modifierGroups, suggestedItems, ...cleanData } = formData as any;
    
    const submitData = {
      ...cleanData,
      dietaryTags: selectedDietaryTags,
      suggestedItemIds: selectedSuggestedItemIds,
    };

    console.log('Submitting data:', submitData);

    try {
      setSubmitError(null);
      if (item?.id) {
        console.log('Updating item:', item.id);
        await updateMutation.mutateAsync({ itemId: item.id, itemData: submitData });
      } else {
        console.log('Creating new item');
        await createMutation.mutateAsync(submitData);
      }
      console.log('Success!');
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to save menu item:', error);
      console.error('Error response:', error.response);
      setSubmitError(
        error.response?.data?.message || 
        error.message || 
        'Failed to save menu item. Please try again.'
      );
    }
  };

  const handleAddAllergen = () => {
    if (allergenInput.trim() && !formData.allergens.includes(allergenInput.trim())) {
      setFormData({
        ...formData,
        allergens: [...formData.allergens, allergenInput.trim()],
      });
      setAllergenInput('');
    }
  };

  const handleRemoveAllergen = (allergen: string) => {
    setFormData({
      ...formData,
      allergens: formData.allergens.filter((a) => a !== allergen),
    });
  };

  const handleAddDietaryTag = () => {
    const tag = dietaryTagInput.trim().toLowerCase();
    if (tag && !selectedDietaryTags.includes(tag)) {
      setSelectedDietaryTags((prev) => [...prev, tag]);
      setDietaryTagInput('');
    }
  };

  const handleRemoveDietaryTag = (tag: string) => {
    setSelectedDietaryTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleCreateCategory = async () => {
    const name = newCategoryName.trim();
    if (!name || createCategoryMutation.isPending) return;
    try {
      const newCategory = await createCategoryMutation.mutateAsync({ name });
      setFormData((prev) => ({ ...prev, categoryId: newCategory.id }));
      setNewCategoryName('');
      setCategoryDropdownOpen(false);
    } catch {
      // Error handled by mutation
    }
  };

  const handleToggleRelatedItem = (menuItemId: string) => {
    setSelectedSuggestedItemIds((prev) =>
      prev.includes(menuItemId)
        ? prev.filter((id) => id !== menuItemId)
        : [...prev, menuItemId]
    );
  };

  const filteredRelatedItems = (menuItems || [])
    .filter((i: any) => i.id !== item?.id) // Exclude current item when editing
    .filter((i: any) => {
      const q = relatedItemsSearch.trim().toLowerCase();
      if (!q) return true;
      return (
        i.name?.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q) ||
        i.category?.name?.toLowerCase().includes(q)
      );
    })
    .slice(0, 12);

  const categoryOptions = categories?.map((cat: any) => ({
    value: cat.id,
    label: cat.name,
  })) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{item ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Multiselect: related items shown on item details page */}
          <div ref={suggestedItemsDropdownRef} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Related items</label>
            <p className="text-xs text-gray-500 mb-2">
              Items to show on this item&apos;s detail page. Select multiple.
            </p>
            <button
              type="button"
              onClick={() => setRelatedItemsDropdownOpen((o) => !o)}
              className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:bg-gray-50"
            >
              <span className="text-gray-500">
                {selectedSuggestedItemIds.length > 0
                  ? `${selectedSuggestedItemIds.length} item(s) selected`
                  : 'Select related items...'}
              </span>
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {selectedSuggestedItemIds.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedSuggestedItemIds.map((id) => {
                  const mi = (menuItems || []).find((i: any) => i.id === id);
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {mi?.name ?? id}
                      <button
                        type="button"
                        onClick={() => handleToggleRelatedItem(id)}
                        className="hover:text-blue-900"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
            {relatedItemsDropdownOpen && (
              <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
                <div className="p-2 border-b border-gray-200">
                  <input
                    type="text"
                    placeholder="Search by name, description, or category..."
                    value={relatedItemsSearch}
                    onChange={(e) => setRelatedItemsSearch(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
                <div className="max-h-48 overflow-auto py-1">
                  {filteredRelatedItems.length > 0 ? (
                    filteredRelatedItems.map((opt: any) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleToggleRelatedItem(opt.id)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                            selectedSuggestedItemIds.includes(opt.id)
                              ? 'bg-blue-500 border-blue-500 text-white'
                              : 'border-gray-300'
                          }`}
                        >
                          {selectedSuggestedItemIds.includes(opt.id) && (
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                        <span className="font-medium">{opt.name}</span>
                        {opt.category?.name && (
                          <span className="ml-2 text-gray-500 text-xs">({opt.category.name})</span>
                        )}
                      </button>
                    ))
                  ) : (
                    <p className="px-3 py-4 text-sm text-gray-500">No matching items found</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {submitError && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">{submitError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Item Name"
              placeholder="e.g., Margherita Pizza"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={errors.name}
              required
            />

            <div ref={categoryDropdownRef} className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <button
                type="button"
                onClick={() => setCategoryDropdownOpen((o) => !o)}
                className={`flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.categoryId ? 'border-red-500' : 'border-gray-300'
                } bg-white`}
              >
                <span className={formData.categoryId ? 'text-gray-900' : 'text-gray-500'}>
                  {formData.categoryId
                    ? categories?.find((c: any) => c.id === formData.categoryId)?.name ?? 'Select category'
                    : 'Select category'}
                </span>
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {categoryDropdownOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
                  <div className="max-h-48 overflow-auto py-1">
                    {categoryOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, categoryId: opt.value });
                          setCategoryDropdownOpen(false);
                        }}
                        className={`block w-full px-3 py-2 text-left text-sm ${
                          formData.categoryId === opt.value
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-gray-200 px-2 py-2 space-y-2">
                    <input
                      type="text"
                      placeholder="New category name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCreateCategory();
                        }
                      }}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCreateCategory}
                      disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
                      isLoading={createCategoryMutation.isPending}
                      className="w-full"
                    >
                      Create
                    </Button>
                  </div>
                </div>
              )}
              {errors.categoryId && <p className="mt-1 text-sm text-red-600">{errors.categoryId}</p>}
            </div>
          </div>

          <Textarea
            label="Description"
            placeholder="Describe this menu item..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Price ($)"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.basePrice || ''}
              onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })}
              error={errors.basePrice}
              required
            />

            <Input
              label="Prep Time (minutes)"
              type="number"
              min="1"
              placeholder="15"
              value={formData.prepTime || ''}
              onChange={(e) => setFormData({ ...formData, prepTime: parseInt(e.target.value) || 15 })}
              error={errors.prepTime}
              required
            />
          </div>

          <ImageUpload
            label="Item Image"
            value={formData.imageUrl}
            onChange={(url) => setFormData({ ...formData, imageUrl: url })}
          />

          {/* Dietary Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dietary Tags</label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Add tag (e.g., vegetarian, gluten-free)"
                value={dietaryTagInput}
                onChange={(e) => setDietaryTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddDietaryTag();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={handleAddDietaryTag}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedDietaryTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveDietaryTag(tag)}
                    className="hover:text-blue-900"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Allergens */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Allergens</label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Add allergen (e.g., peanuts)"
                value={allergenInput}
                onChange={(e) => setAllergenInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddAllergen();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={handleAddAllergen}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.allergens.map((allergen) => (
                <span
                  key={allergen}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
                >
                  {allergen}
                  <button
                    type="button"
                    onClick={() => handleRemoveAllergen(allergen)}
                    className="hover:text-red-900"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {item ? 'Update Item' : 'Create Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
