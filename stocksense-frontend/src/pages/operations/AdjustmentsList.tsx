import { useState, useEffect } from 'react';
import { Plus, Eye, CheckCircle, ClipboardCheck } from 'lucide-react';
import { cn } from '../../utils/cn';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { type Column } from '../../components/data-display/DataTable';
import Button from '../../components/common/Button';
import SearchBar from '../../components/forms/SearchBar';
import FilterBar from '../../components/forms/FilterBar';
import EmptyState from '../../components/common/EmptyState';
import StatusBadge from '../../components/common/StatusBadge';
import { adjustmentApi } from '../../api/adjustments';
import type { Adjustment } from '../../types/adjustment';
import { useApi } from '../../hooks/useApi';
import { formatDateTime, formatNumber } from '../../utils/formatters';
import { ADJUSTMENT_REASONS } from '../../utils/constants';
import { useToast } from '../../context/ToastContext';

export default function AdjustmentsList() {
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const size = 20;
  const { success } = useToast();

  const { execute: loadAdjustments, isLoading } = useApi(adjustmentApi.list, {
    onSuccess: (data) => {
      setAdjustments(data.content);
      setTotal(data.totalElements);
    }
  });

  const { execute: applyAdjustment, isLoading: isApplying } = useApi(adjustmentApi.apply, {
    onSuccess: () => {
      success('Adjustment Applied', 'Inventory levels have been updated.');
      loadAdjustments({ page, size, search: search || undefined });
    }
  });

  useEffect(() => {
    loadAdjustments({ page, size, search: search || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const handleApply = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    applyAdjustment(id);
  };

  const columns: Column<Adjustment>[] = [
    {
      key: 'reference',
      header: 'Reference',
      render: (row) => <span className="font-medium text-amber-600">{row.reference}</span>,
    },
    {
      key: 'product',
      header: 'Product & Location',
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.productName}</div>
          <div className="text-xs text-gray-500">
            {row.locationName} • {row.warehouseName}
          </div>
        </div>
      ),
    },
    {
      key: 'variance',
      header: 'Variance',
      align: 'right',
      render: (row) => (
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 line-through">{formatNumber(row.systemQuantity)}</span>
            <span className="text-sm font-medium text-gray-900">→ {formatNumber(row.physicalQuantity)}</span>
          </div>
          <div
            className={cn(
              'text-xs font-semibold mt-0.5',
              row.delta > 0 ? 'text-green-600' : row.delta < 0 ? 'text-red-600' : 'text-gray-500'
            )}
          >
            {row.delta > 0 ? '+' : ''}{formatNumber(row.delta)} {row.unitOfMeasure}
          </div>
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
          {ADJUSTMENT_REASONS[row.reason]}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
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
              onClick={(e) => handleApply(e, row.id)}
              loading={isApplying}
            >
              Apply
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
        title="Adjustments"
        subtitle="Reconcile system stock with physical counts."
        actions={
          <Button icon={<Plus className="w-4 h-4" />}>
            New Adjustment
          </Button>
        }
      />

      <div className="bg-white rounded-card shadow-card border border-gray-100 overflow-hidden">
        <FilterBar>
          <div className="w-full md:w-72">
            <SearchBar
              placeholder="Search by reference or product..."
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
          data={adjustments}
          loading={isLoading}
          pagination={{
            page,
            size,
            total,
            onPageChange: setPage,
          }}
          emptyState={
            <EmptyState
              icon={<ClipboardCheck className="w-8 h-8 text-gray-400" />}
              title="No adjustments found"
              message="Create a new adjustment to correct stock discrepancies."
              action={
                !search ? (
                  <Button variant="secondary" icon={<Plus className="w-4 h-4" />}>
                    New Adjustment
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
