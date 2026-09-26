import { useState, useEffect } from 'react';
import { Plus, Eye, CheckCircle, Ban } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { type Column } from '../../components/data-display/DataTable';
import Button from '../../components/common/Button';
import SearchBar from '../../components/forms/SearchBar';
import FilterBar from '../../components/forms/FilterBar';
import EmptyState from '../../components/common/EmptyState';
import StatusBadge from '../../components/common/StatusBadge';
import { receiptApi } from '../../api/receipts';
import type { Receipt } from '../../types/receipt';
import { useApi } from '../../hooks/useApi';
import { formatDateTime } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

export default function ReceiptsList() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const size = 20;
  const { success } = useToast();

  const { execute: loadReceipts, isLoading } = useApi(receiptApi.list, {
    onSuccess: (data) => {
      setReceipts(data.content);
      setTotal(data.totalElements);
    }
  });

  const { execute: validateReceipt, isLoading: isValidating } = useApi(receiptApi.validate, {
    onSuccess: () => {
      success('Receipt Validated', 'Stock has been successfully added to inventory.');
      loadReceipts({ page, size, search: search || undefined });
    }
  });

  useEffect(() => {
    loadReceipts({ page, size, search: search || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const handleValidate = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    validateReceipt(id);
  };

  const columns: Column<Receipt>[] = [
    {
      key: 'reference',
      header: 'Reference',
      render: (row) => <span className="font-medium text-primary-600">{row.reference}</span>,
    },
    { key: 'supplier', header: 'Supplier' },
    {
      key: 'destination',
      header: 'Destination',
      render: (row) => (
        <div>
          <div className="text-gray-900">{row.destinationLocationName}</div>
          <div className="text-xs text-gray-500">{row.warehouseName}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (row) => <span className="text-gray-500">{formatDateTime(row.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          {row.status === 'READY' && (
            <Button
              variant="primary"
              size="sm"
              icon={<CheckCircle className="w-4 h-4" />}
              onClick={(e) => handleValidate(e, row.id)}
              loading={isValidating}
            >
              Validate
            </Button>
          )}
          <button className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors rounded">
            <Eye className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Receipts"
        subtitle="Manage inbound inventory from suppliers."
        actions={
          <Button icon={<Plus className="w-4 h-4" />}>
            New Receipt
          </Button>
        }
      />

      <div className="bg-white rounded-card shadow-card border border-gray-100 overflow-hidden">
        <FilterBar>
          <div className="w-full md:w-72">
            <SearchBar
              placeholder="Search by reference or supplier..."
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(0);
              }}
            />
          </div>
        </FilterBar>

        <DataTable
          columns={columns}
          data={receipts}
          loading={isLoading}
          pagination={{
            page,
            size,
            total,
            onPageChange: setPage,
          }}
          emptyState={
            <EmptyState
              title="No receipts found"
              message="Create a new receipt to log incoming stock."
              action={
                !search ? (
                  <Button variant="secondary" icon={<Plus className="w-4 h-4" />}>
                    New Receipt
                  </Button>
                ) : undefined
              }
            />
          }
        />
      </div>
    </div>
  );
}
