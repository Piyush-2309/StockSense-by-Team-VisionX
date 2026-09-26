import { useState } from 'react';
import { MapPin, ChevronRight, ChevronDown, Package } from 'lucide-react';
import { cn } from '../../utils/cn';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import SearchBar from '../../components/forms/SearchBar';
import EmptyState from '../../components/common/EmptyState';
import StockStatusBadge from '../../components/common/StockStatusBadge';
import { formatNumber } from '../../utils/formatters';

// MOCK DATA for tree view (Normally fetched from API)
const mockData = [
  {
    warehouseId: 1,
    warehouseName: 'Main Fulfillment Center',
    locations: [
      {
        locationId: 101,
        locationName: 'Aisle A - Racks 1-10',
        items: [
          { productId: 1, productName: 'Wireless Earbuds', sku: 'WE-001', quantity: 450, unitOfMeasure: 'units', status: 'HEALTHY' as const },
          { productId: 2, productName: 'Smart Watch', sku: 'SW-002', quantity: 20, unitOfMeasure: 'units', status: 'LOW_STOCK' as const },
        ],
      },
      {
        locationId: 102,
        locationName: 'Aisle B - Heavy Goods',
        items: [
          { productId: 3, productName: 'Ergonomic Chair', sku: 'EC-003', quantity: 15, unitOfMeasure: 'units', status: 'HEALTHY' as const },
        ],
      },
    ]
  },
  {
    warehouseId: 2,
    warehouseName: 'Downtown Store Backroom',
    locations: [
      {
        locationId: 201,
        locationName: 'Shelf 1',
        items: [
          { productId: 1, productName: 'Wireless Earbuds', sku: 'WE-001', quantity: 0, unitOfMeasure: 'units', status: 'OUT_OF_STOCK' as const },
        ],
      }
    ]
  }
];

export default function StockByLocation() {
  const [search, setSearch] = useState('');
  const [expandedWarehouses, setExpandedWarehouses] = useState<Set<number>>(new Set([1, 2]));
  const [expandedLocations, setExpandedLocations] = useState<Set<number>>(new Set([101, 102, 201]));

  const toggleWarehouse = (id: number) => {
    const next = new Set(expandedWarehouses);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedWarehouses(next);
  };

  const toggleLocation = (id: number) => {
    const next = new Set(expandedLocations);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedLocations(next);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock by Location"
        subtitle="Drill down into your physical inventory map."
        actions={
          <Button variant="secondary">
            Expand All
          </Button>
        }
      />

      <div className="bg-white rounded-card shadow-card border border-gray-100 overflow-hidden flex flex-col min-h-[500px]">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="w-full md:w-96">
            <SearchBar
              placeholder="Filter locations or products..."
              value={search}
              onChange={setSearch}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {mockData.length === 0 ? (
            <EmptyState
              icon={<MapPin className="w-8 h-8 text-gray-400" />}
              title="No locations configured"
              message="Set up your warehouse locations to map stock."
            />
          ) : (
            <div className="space-y-4">
              {mockData.map((warehouse) => (
                <div key={warehouse.warehouseId} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Warehouse Header */}
                  <button
                    onClick={() => toggleWarehouse(warehouse.warehouseId)}
                    className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                  >
                    {expandedWarehouses.has(warehouse.warehouseId) ? (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    )}
                    <MapPin className="w-5 h-5 text-primary-600" />
                    <span className="font-semibold text-gray-900">{warehouse.warehouseName}</span>
                    <span className="ml-auto text-xs font-medium text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                      {warehouse.locations.length} Locations
                    </span>
                  </button>

                  {/* Warehouse Contents */}
                  {expandedWarehouses.has(warehouse.warehouseId) && (
                    <div className="border-t border-gray-200">
                      {warehouse.locations.map((loc) => (
                        <div key={loc.locationId} className="border-b border-gray-100 last:border-0">
                          {/* Location Header */}
                          <button
                            onClick={() => toggleLocation(loc.locationId)}
                            className="w-full flex items-center gap-3 p-3 pl-10 hover:bg-gray-50 transition-colors text-left"
                          >
                            {expandedLocations.has(loc.locationId) ? (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            )}
                            <span className="font-medium text-gray-700">{loc.locationName}</span>
                            <span className="ml-auto text-xs text-gray-500">
                              {loc.items.length} Products
                            </span>
                          </button>

                          {/* Location Items */}
                          {expandedLocations.has(loc.locationId) && (
                            <div className="bg-white px-4 py-2 pb-4 pl-20">
                              <table className="min-w-full">
                                <thead>
                                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                    <th className="pb-2">Product</th>
                                    <th className="pb-2">SKU</th>
                                    <th className="pb-2 text-right">Qty</th>
                                    <th className="pb-2 pl-4">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                  {loc.items.map((item) => (
                                    <tr key={`${item.productId}-${loc.locationId}`} className="hover:bg-gray-50/50">
                                      <td className="py-2 flex items-center gap-2">
                                        <Package className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm font-medium text-gray-900">{item.productName}</span>
                                      </td>
                                      <td className="py-2 text-sm text-gray-500">{item.sku}</td>
                                      <td className="py-2 text-sm font-medium text-gray-900 text-right">
                                        {formatNumber(item.quantity)} <span className="text-gray-500 text-xs font-normal">{item.unitOfMeasure}</span>
                                      </td>
                                      <td className="py-2 pl-4">
                                        <StockStatusBadge status={item.status} />
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
