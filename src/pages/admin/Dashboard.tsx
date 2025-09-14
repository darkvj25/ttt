import React, { useState, useEffect } from 'react';
import { PosCard } from '@/components/ui/pos-card';
import { Button } from '@/components/ui/button';
import { salesStorage, productStorage, InventoryAlert } from '@/lib/storage';
import { 
  TrendingUp, 
  ShoppingBag, 
  Package, 
  AlertTriangle,
  DollarSign,
  Users,
  Calendar
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DashboardStats {
  todaySales: number;
  todayTransactions: number;
  todayItems: number;
  lowStockItems: InventoryAlert[];
  totalProducts: number;
  activeProducts: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    todayTransactions: 0,
    todayItems: 0,
    lowStockItems: [],
    totalProducts: 0,
    activeProducts: 0
  });

  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const loadDashboardData = () => {
    const today = new Date().toISOString().split('T')[0];
    const todaySummary = salesStorage.getDailySummary(today);
    const lowStockAlerts = productStorage.getLowStockAlerts();
    const allProducts = productStorage.getAll();

    setStats({
      todaySales: todaySummary.totalSales,
      todayTransactions: todaySummary.totalTransactions,
      todayItems: todaySummary.totalItems,
      lowStockItems: lowStockAlerts,
      totalProducts: allProducts.length,
      activeProducts: allProducts.filter(p => p.isActive).length
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color = 'primary',
    subtitle 
  }: {
    title: string;
    value: string | number;
    icon: any;
    color?: 'primary' | 'secondary' | 'success' | 'warning' | 'destructive';
    subtitle?: string;
  }) => (
    <PosCard className="relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color} text-${color}-foreground`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </PosCard>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's your store overview.
          </p>
        </div>
        <div className="flex space-x-2 mt-4 sm:mt-0">
          {(['today', 'week', 'month'] as const).map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
              className="capitalize"
            >
              {period}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Sales"
          value={formatCurrency(stats.todaySales)}
          icon={DollarSign}
          color="success"
          subtitle={`${stats.todayTransactions} transactions`}
        />
        <StatCard
          title="Items Sold"
          value={stats.todayItems}
          icon={ShoppingBag}
          color="primary"
          subtitle="Today"
        />
        <StatCard
          title="Active Products"
          value={`${stats.activeProducts}/${stats.totalProducts}`}
          icon={Package}
          color="secondary"
          subtitle="In inventory"
        />
        <StatCard
          title="Low Stock Alerts"
          value={stats.lowStockItems.length}
          icon={AlertTriangle}
          color={stats.lowStockItems.length > 0 ? 'warning' : 'success'}
          subtitle={stats.lowStockItems.length > 0 ? 'Need attention' : 'All good'}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <PosCard title="Inventory Alerts" description="Products that need restocking">
          <div className="space-y-3">
            {stats.lowStockItems.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">All products are well stocked!</p>
              </div>
            ) : (
              <>
                {stats.lowStockItems.slice(0, 5).map((alert) => (
                  <div key={alert.productId} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <h4 className="font-medium text-sm">{alert.productName}</h4>
                      <p className="text-xs text-muted-foreground">
                        Stock: {alert.currentStock} (Min: {alert.minStock})
                      </p>
                    </div>
                    <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                      {alert.severity}
                    </Badge>
                  </div>
                ))}
                {stats.lowStockItems.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center">
                    +{stats.lowStockItems.length - 5} more items need attention
                  </p>
                )}
              </>
            )}
          </div>
        </PosCard>

        {/* Quick Actions */}
        <PosCard title="Quick Actions" description="Common administrative tasks">
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-20 flex flex-col space-y-2">
              <Package className="h-6 w-6" />
              <span className="text-sm">Add Product</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2">
              <Users className="h-6 w-6" />
              <span className="text-sm">Manage Users</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2">
              <TrendingUp className="h-6 w-6" />
              <span className="text-sm">View Reports</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2">
              <Calendar className="h-6 w-6" />
              <span className="text-sm">Sales History</span>
            </Button>
          </div>
        </PosCard>
      </div>
    </div>
  );
};

export default Dashboard;