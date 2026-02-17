'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useTables } from '@/hooks/useTables';
import { Spinner, Button, Input } from '@digital-order/ui';
import { AuthGuard } from '@/components/AuthGuard';
import { useAuth } from '@/contexts/AuthContext';

export default function TablesPage() {
  const params = useParams();
  const urlTenantId = params?.tenantId as string;
  const { tenantId: authTenantId, user } = useAuth();
  const tenantId = urlTenantId || authTenantId || (user?.role === 'SUPER_ADMIN' ? 'demo-tenant' : null);
  const {
    data: tables,
    isLoading,
    error,
    refetch,
    createTable,
    deleteTable,
    regenerateQrCode,
    isCreating,
    isDeleting,
    isRegenerating,
  } = useTables(tenantId);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ tableNumber: '', capacity: 4, location: '' });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  const isAborted =
    error &&
    ((error instanceof Error && error.name === 'AbortError') || (error as any)?.code === 'ERR_CANCELED');
  const showError = error && !isAborted;

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !formData.tableNumber.trim()) return;
    try {
      await createTable({
        tableNumber: formData.tableNumber.trim(),
        capacity: formData.capacity,
        location: formData.location.trim() || undefined,
      });
      setIsFormOpen(false);
      setFormData({ tableNumber: '', capacity: 4, location: '' });
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to create table');
    }
  };

  const handleDeleteTable = async (tableId: string) => {
    if (!tenantId) return;
    try {
      await deleteTable(tableId);
      setDeleteConfirmId(null);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete table');
    }
  };

  const handleRegenerateQr = async (tableId: string) => {
    if (!tenantId) return;
    setRegeneratingId(tableId);
    try {
      await regenerateQrCode(tableId);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to regenerate QR code');
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleDownloadQr = (table: { tableNumber: string; qrCode: string }) => {
    if (!table.qrCode.startsWith('data:')) return;
    const link = document.createElement('a');
    link.href = table.qrCode;
    link.download = `table-${table.tableNumber}-qr.png`;
    link.click();
  };

  const handlePrintQr = (table: { tableNumber: string; qrCode: string }) => {
    if (!table.qrCode.startsWith('data:')) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html>
        <head><title>Table ${table.tableNumber} QR Code</title></head>
        <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;font-family:sans-serif;">
          <h1 style="margin-bottom:16px;">Table ${table.tableNumber}</h1>
          <img src="${table.qrCode}" alt="QR Code" style="width:256px;height:256px;" />
          <p style="margin-top:16px;color:#666;">Scan to order</p>
        </body>
      </html>
    `);
    win.document.close();
    win.print();
    win.close();
  };

  const isValidQrCode = (qrCode: string) => qrCode.startsWith('data:');

  if (!tenantId || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] bg-gradient-to-br from-slate-50 to-slate-100 px-4">
        <Spinner size="lg" />
        <p className="mt-4 text-slate-600">Loading tables...</p>
      </div>
    );
  }

  if (showError) {
    const err = error as any;
    const is404 = err?.response?.status === 404;
    const isTimeout = err?.code === 'ECONNABORTED';
    const isNetwork = isTimeout || err?.message === 'Network Error' || !err?.response;
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center max-w-md p-8 bg-white rounded-xl shadow-lg border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Failed to load tables</h2>
          <p className="text-slate-600 text-sm mb-4">
            {is404
              ? `Tenant "${tenantId}" was not found.`
              : isNetwork
                ? 'Could not connect to the API.'
                : err?.response?.data?.message || 'An error occurred.'}
          </p>
          <Button onClick={() => refetch()}>Try again</Button>
        </div>
      </div>
    );
  }

  const tableList = Array.isArray(tables) ? tables : (tables as any)?.tables ?? tables ?? [];

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-20 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Table Management</h1>
                <p className="text-slate-600 mt-1">Manage tables and QR codes for contactless ordering</p>
              </div>
              <Button onClick={() => setIsFormOpen(true)} disabled={isCreating}>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Table
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {tableList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {tableList.map((table: any) => (
                <div
                  key={table.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-4 flex flex-col items-center">
                    <div className="w-32 h-32 flex items-center justify-center bg-slate-50 rounded-lg mb-4">
                      {isValidQrCode(table.qrCode) ? (
                        <img
                          src={table.qrCode}
                          alt={`Table ${table.tableNumber} QR`}
                          className="w-28 h-28 object-contain"
                        />
                      ) : (
                        <div className="text-center text-slate-400 text-sm p-2">
                          <p>QR not generated</p>
                          <p className="text-xs mt-1">Click Regenerate</p>
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-900">Table {table.tableNumber}</h3>
                    <p className="text-sm text-slate-500">
                      Capacity: {table.capacity} {table.location && `· ${table.location}`}
                    </p>
                    <span
                      className={`mt-2 inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        table.status === 'AVAILABLE'
                          ? 'bg-green-100 text-green-800'
                          : table.status === 'OCCUPIED'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {table.status}
                    </span>
                    <div className="mt-4 flex flex-wrap gap-2 justify-center">
                      {isValidQrCode(table.qrCode) && (
                        <>
                          <button
                            onClick={() => handleDownloadQr(table)}
                            className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                          >
                            Download
                          </button>
                          <button
                            onClick={() => handlePrintQr(table)}
                            className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                          >
                            Print
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleRegenerateQr(table.id)}
                        disabled={regeneratingId === table.id || isRegenerating}
                        className="px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-100 rounded-lg hover:bg-amber-200 transition-colors disabled:opacity-50"
                      >
                        {regeneratingId === table.id ? 'Regenerating...' : 'Regenerate QR'}
                      </button>
                      {deleteConfirmId === table.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleDeleteTable(table.id)}
                            disabled={isDeleting}
                            className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(table.id)}
                          className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">No tables yet</h3>
              <p className="text-slate-600 mb-4">Add tables to generate QR codes for contactless ordering</p>
              <Button onClick={() => setIsFormOpen(true)}>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add First Table
              </Button>
            </div>
          )}
        </div>

        {isFormOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Add Table</h2>
              <form onSubmit={handleCreateTable} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Table Number</label>
                  <Input
                    value={formData.tableNumber}
                    onChange={(e) => setFormData((p) => ({ ...p, tableNumber: e.target.value }))}
                    placeholder="e.g. 1 or T1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Capacity</label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.capacity}
                    onChange={(e) => setFormData((p) => ({ ...p, capacity: parseInt(e.target.value, 10) || 1 }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Location (optional)</label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
                    placeholder="e.g. Main Dining, Patio"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={isCreating || !formData.tableNumber.trim()}>
                    {isCreating ? 'Creating...' : 'Create Table'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsFormOpen(false);
                      setFormData({ tableNumber: '', capacity: 4, location: '' });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
