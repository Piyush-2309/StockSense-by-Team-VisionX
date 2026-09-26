import { useState, useEffect } from 'react';
import { Download, ScrollText, ExternalLink } from 'lucide-react';
import { cn } from '../../utils/cn';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { type Column } from '../../components/data-display/DataTable';
import Button from '../../components/common/Button';
import SearchBar from '../../components/forms/SearchBar';
import FilterBar from '../../components/forms/FilterBar';
import EmptyState from '../../components/common/EmptyState';
import StatusBadge from '../../components/common/StatusBadge';
import { ledgerApi } from '../../api/ledger';
import type { StockMove } from '../../types/move';
import { useApi } from '../../hooks/useApi';
import { formatDateTime, formatNumber } from '../../utils/formatters';

export default function LedgerList() {
  const [moves, setMoves] = useState<StockMove[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const size = 20;

  const { execute, isLoading } = useApi(ledgerApi.list, {
    onSuccess: (data) => {
      setMoves(data.content);
      setTotal(data.totalElements);
    }
  });

  useEffect(() => {
    execute({ page, size, search: search || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const columns: Column<StockMove>[] = [
    {
      key: 'createdAt',
      header: 'Date & Time',
      render: (row) => <span className="text-gray-900 whitespace-nowrap">{formatDateTime(row.createdAt)}</span>,
    },
    {
      key: 'reference',
      header: 'Reference',
      render: (row) => (
        <div className="flex items-center gap-2 group cursor-pointer">
          <span className="font-medium text-primary-600 group-hover:underline">{row.reference}</span>
          <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      ),
    },
    {
      key: 'product',
      header: 'Product',
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.productName}</div>
          <div className="text-xs text-gray-500">SKU: {row.sku}</div>
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'Movement',
      align: 'right',
      render: (row) => {
        let color = 'text-gray-900';
        let prefix = '';
        if (row.type === 'RECEIPT') { color = 'text-green-600'; prefix = '+'; }
        else if (row.type === 'DELIVERY') { color = 'text-red-600'; prefix = '-'; }
        else if (row.type === 'ADJUSTMENT') { 
          color = row.quantity > 0 ? 'text-green-600' : row.quantity < 0 ? 'text-red-600' : 'text-gray-900';
          prefix = row.quantity > 0 ? '+' : '';
        }

        return (
          <div className="flex flex-col items-end">
            <span className={cn('font-semibold', color)}>
              {prefix}{formatNumber(row.quantity)} {row.unitOfMeasure}
            </span>
            {row.resultingQuantity !== undefined && (
              <span className="text-xs text-gray-500 mt-0.5">
                Balance: {formatNumber(row.resultingQuantity)}
              </span>
            )}
          </div>
        );
      }
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => (
        <span className={cn(
          'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
          row.type === 'RECEIPT' ? 'bg-green-100 text-green-800' :
          row.type === 'DELIVERY' ? 'bg-red-100 text-red-800' :
          row.type === 'INTERNAL' ? 'bg-blue-100 text-blue-800' :
          'bg-amber-100 text-amber-800'
        )}>
          {row.type}
        </span>
      ),
    },
    {
      key: 'user',
      header: 'User',
      render: (row) => <span className="text-sm text-gray-600">{row.userName}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Ledger"
        subtitle="Immutable audit trail of all inventory movements."
        actions={
          <Button variant="secondary" icon={<Download className="w-4 h-4" />}>
            Export Log
          </Button>
        }
      />

      <div className="bg-white rounded-card shadow-card border border-gray-100 overflow-hidden">
        <FilterBar>
          <div className="w-full md:w-72">
            <SearchBar
              placeholder="Search by reference, product, or user..."
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
          data={moves}
          loading={isLoading}
          pagination={{
            page,
            size,
            total,
            onPageChange: setPage,
          }}
          emptyState={
            <EmptyState
              icon={<ScrollText className="w-8 h-8 text-gray-400" />}
              title="No movements recorded"
              message="The stock ledger is currently empty."
            />
          }
        />
      </div>
    </div>
  );
}
