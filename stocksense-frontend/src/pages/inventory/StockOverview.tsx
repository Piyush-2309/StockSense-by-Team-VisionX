import { useState, useEffect } from 'react';
import { Download, BarChart3 } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { type Column } from '../../components/data-display/DataTable';
import Button from '../../components/common/Button';
import SearchBar from '../../components/forms/SearchBar';
import FilterBar from '../../components/forms/FilterBar';
import EmptyState from '../../components/common/EmptyState';
import StockStatusBadge from '../../components/common/StockStatusBadge';
import { stockApi } from '../../api/stock';
import type { Stock } from '../../types/stock';
import { useApi } from '../../hooks/useApi';
import { formatNumber } from '../../utils/formatters';

export default function StockOverview() {
  const [stock, setStock] = useState<Stock[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const size = 20;

  const { execute, isLoading } = useApi(stockApi.list, {
    onSuccess: (data) => {
      setStock(data.content);
      setTotal(data.totalElements);
    }
  });

  useEffect(() => {
    execute({ page, size, search: search || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const columns: Column<Stock>[] = [
    {
      key: 'productName',
      header: 'Product',
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.productName}</div>
          <div className="text-xs text-gray-500">SKU: {row.sku}</div>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      render: (row) => (
        <div>
          <div className="text-gray-900">{row.locationName}</div>
          <div className="text-xs text-gray-500">{row.warehouseName}</div>
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'On Hand',
      align: 'right',
      render: (row) => (
        <div>
          <span className="font-medium">{formatNumber(row.quantity)}</span>
          <span className="text-gray-500 ml-1">{row.unitOfMeasure}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StockStatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Overview"
        subtitle="Global view of all inventory across all locations."
        actions={
          <Button variant="secondary" icon={<Download className="w-4 h-4" />}>
            Export CSV
          </Button>
        }
      />

      <div className="bg-white rounded-card shadow-card border border-gray-100 overflow-hidden">
        <FilterBar>
          <div className="w-full md:w-72">
            <SearchBar
              placeholder="Search by product, SKU, or location..."
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
          data={stock}
          loading={isLoading}
          pagination={{
            page,
            size,
            total,
            onPageChange: setPage,
          }}
          emptyState={
            <EmptyState
              icon={<BarChart3 className="w-8 h-8 text-gray-400" />}
              title="No stock found"
              message="No inventory matches your current filters."
            />
          }
        />
      </div>
    </div>
  );
}
