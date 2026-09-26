import { useState, useEffect } from 'react';
import { Plus, Eye, CheckCircle, ArrowLeftRight } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { type Column } from '../../components/data-display/DataTable';
import Button from '../../components/common/Button';
import SearchBar from '../../components/forms/SearchBar';
import FilterBar from '../../components/forms/FilterBar';
import EmptyState from '../../components/common/EmptyState';
import StatusBadge from '../../components/common/StatusBadge';
import { transferApi } from '../../api/transfers';
import type { Transfer } from '../../types/transfer';
import { useApi } from '../../hooks/useApi';
import { formatDateTime } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

export default function TransfersList() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const size = 20;
  const { success } = useToast();

  const { execute: loadTransfers, isLoading } = useApi(transferApi.list, {
    onSuccess: (data) => {
      setTransfers(data.content);
      setTotal(data.totalElements);
    }
  });

  const { execute: validateTransfer, isLoading: isValidating } = useApi(transferApi.validate, {
    onSuccess: () => {
      success('Transfer Validated', 'Stock has been successfully moved.');
      loadTransfers({ page, size, search: search || undefined });
    }
  });

  useEffect(() => {
    loadTransfers({ page, size, search: search || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const handleValidate = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    validateTransfer(id);
  };

  const columns: Column<Transfer>[] = [
    {
      key: 'reference',
      header: 'Reference',
      render: (row) => <span className="font-medium text-blue-600">{row.reference}</span>,
    },
    {
      key: 'route',
      header: 'Route (From → To)',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div>
            <div className="text-gray-900 font-medium">{row.sourceLocationName}</div>
            <div className="text-xs text-gray-500">{row.sourceWarehouseName}</div>
          </div>
          <ArrowLeftRight className="w-4 h-4 text-gray-400 mx-2 flex-shrink-0" />
          <div>
            <div className="text-gray-900 font-medium">{row.destinationLocationName}</div>
            <div className="text-xs text-gray-500">{row.destinationWarehouseName}</div>
          </div>
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
        title="Internal Transfers"
        subtitle="Manage stock movements between your warehouses and locations."
        actions={
          <Button icon={<Plus className="w-4 h-4" />}>
            New Transfer
          </Button>
        }
      />

      <div className="bg-white rounded-card shadow-card border border-gray-100 overflow-hidden">
        <FilterBar>
          <div className="w-full md:w-72">
            <SearchBar
              placeholder="Search by reference..."
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
          data={transfers}
          loading={isLoading}
          pagination={{
            page,
            size,
            total,
            onPageChange: setPage,
          }}
          emptyState={
            <EmptyState
              icon={<ArrowLeftRight className="w-8 h-8 text-gray-400" />}
              title="No transfers found"
              message="Create a new transfer to move stock internally."
              action={
                !search ? (
                  <Button variant="secondary" icon={<Plus className="w-4 h-4" />}>
                    New Transfer
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
