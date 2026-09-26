import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Truck, ArrowLeftRight, AlertTriangle, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import KpiCard from '../../components/common/KpiCard';
import { KpiSkeleton, LoadingSkeleton } from '../../components/common/LoadingState';
import StatusBadge from '../../components/common/StatusBadge';
import StockStatusBadge from '../../components/common/StockStatusBadge';
import { dashboardApi, riskApi } from '../../api/dashboard';
import type { DashboardData, RiskItem } from '../../types/dashboard';
import { formatNumber, formatRelativeTime, getGreeting } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [dashRes, riskRes] = await Promise.all([
          dashboardApi.get(),
          riskApi.list(),
        ]);
        setData(dashRes.data);
        setRisks(riskRes.data);
      } catch (err) {
        console.error('Failed to fetch dashboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${getGreeting()}, ${user?.name?.split(' ')[0]} 👋`}
        subtitle="Here's what's happening with your inventory today."
      />

      {loading ? (
        <KpiSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Total Stock Items"
            value={data?.totalStock || 0}
            icon={<Package className="w-5 h-5" />}
            color="info"
            onClick={() => navigate('/stock')}
          />
          <KpiCard
            label="Pending Receipts"
            value={data?.pendingReceipts || 0}
            icon={<ArrowUpRight className="w-5 h-5" />}
            color="success"
            onClick={() => navigate('/receipts')}
          />
          <KpiCard
            label="Pending Deliveries"
            value={data?.pendingDeliveries || 0}
            icon={<Truck className="w-5 h-5" />}
            color="warning"
            onClick={() => navigate('/deliveries')}
          />
          <KpiCard
            label="Active Transfers"
            value={data?.pendingTransfers || 0}
            icon={<ArrowLeftRight className="w-5 h-5" />}
            color="default"
            onClick={() => navigate('/transfers')}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Center Widget */}
        <div className="lg:col-span-2 bg-white rounded-card shadow-card border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-gray-900">Attention Required</h2>
            </div>
            <button
              onClick={() => navigate('/risk')}
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              View Risk Center →
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {loading ? (
              <div className="p-4 space-y-3">
                <LoadingSkeleton className="h-12 w-full" />
                <LoadingSkeleton className="h-12 w-full" />
                <LoadingSkeleton className="h-12 w-full" />
              </div>
            ) : risks.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center">
                <CheckCircle2 className="w-12 h-12 text-green-500 mb-3" />
                <p className="text-gray-900 font-medium">All clear!</p>
                <p className="text-gray-500 text-sm mt-1">No critical stock alerts right now.</p>
              </div>
            ) : (
              risks.slice(0, 5).map((risk) => (
                <div key={`${risk.productId}-${risk.riskCategory}`} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">{risk.productName}</p>
                    <p className="text-sm text-gray-500 flex gap-3 mt-0.5">
                      <span>SKU: {risk.sku}</span>
                      <span>Stock: {formatNumber(risk.currentStock)} {risk.unitOfMeasure}</span>
                    </p>
                  </div>
                  <div>
                    <StockStatusBadge status={risk.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity Widget */}
        <div className="bg-white rounded-card shadow-card border border-gray-100 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-semibold text-gray-900">Recent Movements</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading ? (
              <div className="space-y-4">
                <LoadingSkeleton className="h-16 w-full" />
                <LoadingSkeleton className="h-16 w-full" />
                <LoadingSkeleton className="h-16 w-full" />
              </div>
            ) : data?.recentMovements.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
            ) : (
              data?.recentMovements.map((move) => (
                <div key={move.id} className="flex gap-3">
                  <div className="mt-1">
                    {move.type === 'RECEIPT' && <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">↓</div>}
                    {move.type === 'DELIVERY' && <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">↑</div>}
                    {move.type === 'INTERNAL' && <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">→</div>}
                    {move.type === 'ADJUSTMENT' && <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">±</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {move.reference} • {move.productName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {move.quantity > 0 ? '+' : ''}{move.quantity} {move.unitOfMeasure}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatRelativeTime(move.createdAt)} by {move.userName}
                    </p>
                  </div>
                  <div>
                    <StatusBadge status={move.status} />
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-4 border-t border-gray-100 bg-gray-50 mt-auto">
            <button
              onClick={() => navigate('/ledger')}
              className="w-full text-center text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              View Full Ledger →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
