import { useState, useEffect } from 'react';
import { Plus, Edit2, Archive, Package } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { type Column } from '../../components/data-display/DataTable';
import Button from '../../components/common/Button';
import SearchBar from '../../components/forms/SearchBar';
import FilterBar from '../../components/forms/FilterBar';
import EmptyState from '../../components/common/EmptyState';
import StockStatusBadge from '../../components/common/StockStatusBadge';
import { productApi } from '../../api/products';
import type { Product } from '../../types/product';
import { useApi } from '../../hooks/useApi';
import { formatNumber } from '../../utils/formatters';

export default function ProductsList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const size = 20;

  const { execute, isLoading } = useApi(productApi.list, {
    onSuccess: (data) => {
      setProducts(data.content);
      setTotal(data.totalElements);
    }
  });

  const loadProducts = () => {
    execute({ page, size, search: search || undefined });
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const columns: Column<Product>[] = [
    {
      key: 'name',
      header: 'Product',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-500">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.name}</div>
            <div className="text-xs text-gray-500">SKU: {row.sku}</div>
          </div>
        </div>
      ),
    },
    { key: 'categoryName', header: 'Category' },
    {
      key: 'currentStock',
      header: 'Stock',
      align: 'right',
      render: (row) => (
        <div>
          <span className="font-medium">{formatNumber(row.currentStock)}</span>
          <span className="text-gray-500 ml-1">{row.unitOfMeasure}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StockStatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: () => (
        <div className="flex items-center justify-end gap-2">
          <button className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors rounded">
            <Edit2 className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-gray-400 hover:text-amber-600 transition-colors rounded">
            <Archive className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        subtitle="Manage your product catalog and view current stock levels."
        actions={
          <Button icon={<Plus className="w-4 h-4" />}>
            Add Product
          </Button>
        }
      />

      <div className="bg-white rounded-card shadow-card border border-gray-100 overflow-hidden">
        <FilterBar>
          <div className="w-full md:w-72">
            <SearchBar
              placeholder="Search products by name or SKU..."
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
          data={products}
          loading={isLoading}
          pagination={{
            page,
            size,
            total,
            onPageChange: setPage,
          }}
          emptyState={
            <EmptyState
              title="No products found"
              message={search ? `No products match "${search}"` : "Get started by adding your first product to the catalog."}
              action={
                !search ? (
                  <Button variant="secondary" icon={<Plus className="w-4 h-4" />}>
                    Add Product
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
