'use client';

import React, { useState, useRef } from 'react';
import { Input, Button } from '@digital-order/ui';

interface MultiImageUploadProps {
  value?: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  maxImages?: number;
}

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        const MAX_BASE64_BYTES = 400 * 1024;
        const attempts: { maxDimension: number; quality: number }[] = [
          { maxDimension: 800, quality: 0.6 },
          { maxDimension: 600, quality: 0.5 },
          { maxDimension: 480, quality: 0.4 },
        ];

        const tryCompress = (attemptIndex: number) => {
          const { maxDimension, quality } = attempts[attemptIndex];
          let width = img.width;
          let height = img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          const result = canvas.toDataURL('image/jpeg', quality);

          const base64Length = result.length - result.indexOf(',') - 1;
          const estimatedBytes = (base64Length * 3) / 4;
          const isLastAttempt = attemptIndex === attempts.length - 1;
          if (estimatedBytes <= MAX_BASE64_BYTES || isLastAttempt) {
            resolve(result);
          } else {
            tryCompress(attemptIndex + 1);
          }
        };

        tryCompress(0);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

export const MultiImageUpload: React.FC<MultiImageUploadProps> = ({
  value = [],
  onChange,
  label = 'Photos',
  maxImages = 10,
}) => {
  const [inputMode, setInputMode] = useState<'url' | 'upload'>('url');
  const [urlInput, setUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const urls = Array.isArray(value) ? value : value ? [value] : [];
  const canAddMore = urls.length < maxImages;

  const handleAddUrl = () => {
    const url = urlInput.trim();
    if (url && !urls.includes(url) && canAddMore) {
      onChange([...urls, url]);
      setUrlInput('');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !canAddMore) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const toAdd: string[] = [];
      const fileCount = Math.min(files.length, maxImages - urls.length);

      for (let i = 0; i < fileCount; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        if (file.size > 10 * 1024 * 1024) continue;

        const dataUrl = await compressImage(file);
        toAdd.push(dataUrl);
      }

      if (toAdd.length > 0) {
        onChange([...urls, ...toAdd]);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setUploadError('Failed to process image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = (index: number) => {
    onChange(urls.filter((_, i) => i !== index));
  };

  const handleMove = (from: number, to: number) => {
    if (to < 0 || to >= urls.length) return;
    const next = [...urls];
    const [removed] = next.splice(from, 1);
    next.splice(to, 0, removed);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <span className="text-xs text-gray-500">
          {urls.length} / {maxImages}
        </span>
      </div>

      {/* Image grid */}
      {urls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {urls.map((url, index) => (
            <div
              key={`${url.slice(0, 50)}-${index}`}
              className="relative group aspect-square rounded-lg border border-gray-300 overflow-hidden bg-gray-50"
            >
              <img
                src={url}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EError%3C/text%3E%3C/svg%3E';
                }}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleMove(index, index - 1)}
                  disabled={index === 0}
                  className="p-2 bg-white/90 rounded-full hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Move left"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                  title="Remove"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(index, index + 1)}
                  disabled={index === urls.length - 1}
                  className="p-2 bg-white/90 rounded-full hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Move right"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add new image */}
      {canAddMore && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setInputMode('url')}
              className={`text-xs px-2 py-1 rounded ${
                inputMode === 'url' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              URL
            </button>
            <button
              type="button"
              onClick={() => setInputMode('upload')}
              className={`text-xs px-2 py-1 rounded ${
                inputMode === 'upload' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Upload
            </button>
          </div>

          {inputMode === 'url' ? (
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddUrl())}
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={handleAddUrl} disabled={!urlInput.trim()}>
                Add
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Uploading...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Add Photos
                  </>
                )}
              </Button>
              {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-gray-500">
        Add up to {maxImages} photos. First image is the primary thumbnail. Use URL or upload (max 10MB each).
      </p>
    </div>
  );
};
