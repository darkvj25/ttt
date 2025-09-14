import React, { useState, useEffect } from 'react';
import { PosCard } from '@/components/ui/pos-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar,
  Download,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Package,
  FileText,
  BarChart3
} from 'lucide-react';
import { salesStorage, productStorage, Sale } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ReportData {
  totalSales: number;
  totalTransactions: number;
  totalItems: number;
  averageTransaction: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
  }>;
  dailyBreakdown: Array<{
    date: string;
    sales: number;
    transactions: number;
    items: number;
  }>;
  paymentMethods: Array<{
    method: string;
    count: number;
    total: number;
  }>;
}

const Reports: React.FC = () => {
  const [reportPeriod, setReportPeriod] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    generateReport();
  }, [reportPeriod]);

  const getDateRange = (): { start: string; end: string } => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    switch (reportPeriod) {
      case 'today':
        return { start: todayStr, end: todayStr };
      
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        return { start: weekStart.toISOString().split('T')[0], end: todayStr };
      
      case 'month':
        const monthStart = new Date(today);
        monthStart.setDate(today.getDate() - 30);
        return { start: monthStart.toISOString().split('T')[0], end: todayStr };
      
      case 'custom':
        return { start: startDate, end: endDate };
      
      default:
        return { start: todayStr, end: todayStr };
    }
  };

  const generateReport = async () => {
    setIsLoading(true);
    
    try {
      const { start, end } = getDateRange();
      
      if (reportPeriod === 'custom' && (!start || !end)) {
        toast({
          title: "Invalid date range",
          description: "Please select both start and end dates",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const sales = salesStorage.getByDateRange(start, end);
      const products = productStorage.getAll();
      
      // Calculate totals
      const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
      const totalTransactions = sales.length;
      const totalItems = sales.reduce((sum, sale) => 
        sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
      );
      const averageTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;

      // Calculate top products
      const productSales = new Map<string, { name: string; quantity: number; revenue: number }>();
      
      sales.forEach(sale => {
        sale.items.forEach(item => {
          const existing = productSales.get(item.productId);
          const product = products.find(p => p.id === item.productId);
          
          if (existing) {
            existing.quantity += item.quantity;
            existing.revenue += item.total;
          } else {
            productSales.set(item.productId, {
              name: product?.name || item.name,
              quantity: item.quantity,
              revenue: item.total
            });
          }
        });
      });

      const topProducts = Array.from(productSales.entries())
        .map(([productId, data]) => ({
          productId,
          productName: data.name,
          quantity: data.quantity,
          revenue: data.revenue
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Calculate daily breakdown
      const dailyData = new Map<string, { sales: number; transactions: number; items: number }>();
      
      sales.forEach(sale => {
        const existing = dailyData.get(sale.date);
        const itemCount = sale.items.reduce((sum, item) => sum + item.quantity, 0);
        
        if (existing) {
          existing.sales += sale.total;
          existing.transactions += 1;
          existing.items += itemCount;
        } else {
          dailyData.set(sale.date, {
            sales: sale.total,
            transactions: 1,
            items: itemCount
          });
        }
      });

      const dailyBreakdown = Array.from(dailyData.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Calculate payment methods
      const paymentData = new Map<string, { count: number; total: number }>();
      
      sales.forEach(sale => {
        const existing = paymentData.get(sale.paymentMethod);
        
        if (existing) {
          existing.count += 1;
          existing.total += sale.total;
        } else {
          paymentData.set(sale.paymentMethod, {
            count: 1,
            total: sale.total
          });
        }
      });

      const paymentMethods = Array.from(paymentData.entries())
        .map(([method, data]) => ({ method, ...data }));

      setReportData({
        totalSales,
        totalTransactions,
        totalItems,
        averageTransaction,
        topProducts,
        dailyBreakdown,
        paymentMethods
      });

    } catch (error) {
      toast({
        title: "Error generating report",
        description: "Please try again",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  const exportReport = () => {
    if (!reportData) return;

    const { start, end } = getDateRange();
    const reportContent = {
      reportPeriod: `${start} to ${end}`,
      generatedAt: new Date().toISOString(),
      summary: {
        totalSales: reportData.totalSales,
        totalTransactions: reportData.totalTransactions,
        totalItems: reportData.totalItems,
        averageTransaction: reportData.averageTransaction
      },
      topProducts: reportData.topProducts,
      dailyBreakdown: reportData.dailyBreakdown,
      paymentMethods: reportData.paymentMethods
    };

    const blob = new Blob([JSON.stringify(reportContent, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${start}-to-${end}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Report exported",
      description: "Sales report has been downloaded",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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
    color?: 'primary' | 'secondary' | 'success' | 'warning';
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
          <h1 className="text-3xl font-bold text-foreground">Sales Reports</h1>
          <p className="text-muted-foreground mt-1">
            Analyze your sales performance and trends
          </p>
        </div>
        {reportData && (
          <Button onClick={exportReport} className="flex items-center space-x-2 mt-4 sm:mt-0">
            <Download className="h-4 w-4" />
            <span>Export Report</span>
          </Button>
        )}
      </div>

      {/* Report Controls */}
      <PosCard title="Report Settings" description="Configure your report parameters">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Report Period</Label>
            <Select
              value={reportPeriod}
              onValueChange={(value: any) => setReportPeriod(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {reportPeriod === 'custom' && (
            <>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="flex items-end">
            <Button onClick={generateReport} disabled={isLoading} className="w-full">
              {isLoading ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </div>
      </PosCard>

      {reportData && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Sales"
              value={formatCurrency(reportData.totalSales)}
              icon={DollarSign}
              color="success"
              subtitle={`${reportData.totalTransactions} transactions`}
            />
            <StatCard
              title="Items Sold"
              value={reportData.totalItems}
              icon={ShoppingBag}
              color="primary"
              subtitle="Total quantity"
            />
            <StatCard
              title="Avg Transaction"
              value={formatCurrency(reportData.averageTransaction)}
              icon={TrendingUp}
              color="secondary"
              subtitle="Per transaction"
            />
            <StatCard
              title="Transactions"
              value={reportData.totalTransactions}
              icon={FileText}
              color="warning"
              subtitle="Total count"
            />
          </div>

          {/* Top Products */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PosCard title="Top Selling Products" description="Best performers by revenue">
              <div className="space-y-3">
                {reportData.topProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No sales data available</p>
                  </div>
                ) : (
                  reportData.topProducts.slice(0, 5).map((product, index) => (
                    <div key={product.productId} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <div>
                          <h4 className="font-medium text-sm">{product.productName}</h4>
                          <p className="text-xs text-muted-foreground">
                            {product.quantity} units sold
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">{formatCurrency(product.revenue)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </PosCard>

            {/* Payment Methods */}
            <PosCard title="Payment Methods" description="Payment breakdown">
              <div className="space-y-3">
                {reportData.paymentMethods.length === 0 ? (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No payment data available</p>
                  </div>
                ) : (
                  reportData.paymentMethods.map((payment) => (
                    <div key={payment.method} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <h4 className="font-medium text-sm capitalize">{payment.method}</h4>
                        <p className="text-xs text-muted-foreground">
                          {payment.count} transactions
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">{formatCurrency(payment.total)}</p>
                        <p className="text-xs text-muted-foreground">
                          {((payment.total / reportData.totalSales) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </PosCard>
          </div>

          {/* Daily Breakdown */}
          {reportData.dailyBreakdown.length > 1 && (
            <PosCard title="Daily Breakdown" description="Day-by-day performance">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2">Date</th>
                      <th className="text-right py-3 px-2">Sales</th>
                      <th className="text-center py-3 px-2">Transactions</th>
                      <th className="text-center py-3 px-2">Items</th>
                      <th className="text-right py-3 px-2">Avg Transaction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.dailyBreakdown.map((day) => (
                      <tr key={day.date} className="border-b border-border hover:bg-muted/50">
                        <td className="py-3 px-2 font-medium">
                          {formatDate(day.date)}
                        </td>
                        <td className="py-3 px-2 text-right font-medium">
                          {formatCurrency(day.sales)}
                        </td>
                        <td className="py-3 px-2 text-center">
                          {day.transactions}
                        </td>
                        <td className="py-3 px-2 text-center">
                          {day.items}
                        </td>
                        <td className="py-3 px-2 text-right">
                          {formatCurrency(day.transactions > 0 ? day.sales / day.transactions : 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </PosCard>
          )}
        </>
      )}
    </div>
  );
};

export default Reports;