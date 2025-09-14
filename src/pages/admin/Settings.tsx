import React, { useState, useEffect } from 'react';
import { PosCard } from '@/components/ui/pos-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Save,
  Download,
  Upload,
  Trash2,
  Store,
  Settings as SettingsIcon,
  Database,
  AlertTriangle,
  CheckCircle,
  FileText
} from 'lucide-react';
import { settingsStorage, dataManager } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface StoreSettings {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeEmail: string;
  taxRate: number;
  currency: string;
  receiptFooter: string;
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<StoreSettings>({
    storeName: '',
    storeAddress: '',
    storePhone: '',
    storeEmail: '',
    taxRate: 0.12,
    currency: 'PHP',
    receiptFooter: ''
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const currentSettings = settingsStorage.get() as any;
    console.log('Loaded settings:', currentSettings);
    setSettings({
      storeName: currentSettings.storeName || 'Sari-sari Store',
      storeAddress: currentSettings.storeAddress || '123 Main Street',
      storePhone: currentSettings.storePhone || '+63 123 456 7890',
      storeEmail: currentSettings.storeEmail || '',
      taxRate: currentSettings.taxRate || 0.12,
      currency: currentSettings.currency || 'PHP',
      receiptFooter: currentSettings.receiptFooter || 'Thank you for your purchase!'
    });
    setHasChanges(false);
  };

  const handleInputChange = (field: keyof StoreSettings, value: string | number) => {
    if (field === 'taxRate') {
      let parsedValue = 0;
      if (typeof value === 'string') {
        const floatVal = parseFloat(value);
        parsedValue = isNaN(floatVal) ? 0 : floatVal / 100;
      } else if (typeof value === 'number') {
        parsedValue = value;
      }
      setSettings(prev => ({
        ...prev,
        taxRate: parsedValue
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [field]: value
      }));
    }
    setHasChanges(true);
  };

  const handleSaveSettings = () => {
    try {
      settingsStorage.save(settings);
      toast({
        title: "Settings saved",
        description: "Your settings have been saved successfully",
      });
      setHasChanges(false);
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save settings",
        variant: "destructive",
      });
    }
  };


  const handleExportData = () => {
    try {
      dataManager.exportData();
      toast({
        title: "Data exported",
        description: "System data has been downloaded as a backup file",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export data",
        variant: "destructive",
      });
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    
    dataManager.importData(file).then((success) => {
      if (success) {
        toast({
          title: "Data imported",
          description: "System data has been restored successfully",
        });
        loadSettings(); // Reload settings after import
      } else {
        toast({
          title: "Import failed",
          description: "Failed to restore data from backup file",
          variant: "destructive",
        });
      }
      setIsImporting(false);
    });

    // Reset file input
    event.target.value = '';
  };

  const handleClearAllData = () => {
    try {
      localStorage.clear();
      toast({
        title: "Data cleared",
        description: "All system data has been removed",
      });
      setShowClearDialog(false);
      
      // Reload page to reinitialize with default data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast({
        title: "Error clearing data",
        description: "Failed to clear system data",
        variant: "destructive",
      });
    }
  };

  const getStorageInfo = () => {
    try {
      const used = new Blob(Object.values(localStorage)).size;
      const usedMB = (used / 1024 / 1024).toFixed(2);
      const totalMB = '5-10'; // LocalStorage typical limit
      
      return { used: usedMB, total: totalMB };
    } catch {
      return { used: 'Unknown', total: '5-10' };
    }
  };

  const storageInfo = getStorageInfo();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage store settings and system data
          </p>
        </div>
        {hasChanges && (
          <Button onClick={handleSaveSettings} className="flex items-center space-x-2 mt-4 sm:mt-0">
            <Save className="h-4 w-4" />
            <span>Save Changes</span>
          </Button>
        )}
      </div>

      {hasChanges && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have unsaved changes. Don't forget to save your settings.
          </AlertDescription>
        </Alert>
      )}

      {/* Store Settings */}
      <PosCard title="Store Information" description="Configure your store details for receipts and reports">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="storeName">Store Name</Label>
            <Input
              id="storeName"
              value={settings.storeName}
              onChange={(e) => handleInputChange('storeName', e.target.value)}
              placeholder="Your Store Name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="storePhone">Phone Number</Label>
            <Input
              id="storePhone"
              value={settings.storePhone}
              onChange={(e) => handleInputChange('storePhone', e.target.value)}
              placeholder="+63 123 456 7890"
            />
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="storeAddress">Store Address</Label>
            <Input
              id="storeAddress"
              value={settings.storeAddress}
              onChange={(e) => handleInputChange('storeAddress', e.target.value)}
              placeholder="123 Main Street, City, Province"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="storeEmail">Email (Optional)</Label>
            <Input
              id="storeEmail"
              type="email"
              value={settings.storeEmail}
              onChange={(e) => handleInputChange('storeEmail', e.target.value)}
              placeholder="store@example.com"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Input
              id="currency"
              value={settings.currency}
              onChange={(e) => handleInputChange('currency', e.target.value)}
              placeholder="PHP"
            />
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="receiptFooter">Receipt Footer Message</Label>
            <Input
              id="receiptFooter"
              value={settings.receiptFooter}
              onChange={(e) => handleInputChange('receiptFooter', e.target.value)}
              placeholder="Thank you for your purchase!"
            />
          </div>
        </div>
      </PosCard>

      {/* Tax Settings */}
      <PosCard title="Tax Configuration" description="Set up tax rates for transactions">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="taxRate">Tax Rate (%)</Label>
            <Input
              id="taxRate"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={settings.taxRate * 100}
              onChange={(e) => handleInputChange('taxRate', e.target.value)}
              placeholder="12"
            />
            <p className="text-xs text-muted-foreground">
              Current: {(settings.taxRate * 100).toFixed(2)}% (VAT)
            </p>
          </div>
          
          <div className="flex items-end">
            <Alert className="flex-1">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Tax is automatically calculated and applied to all transactions
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </PosCard>

      {/* Data Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Backup & Restore */}
        <PosCard title="Data Backup & Restore" description="Manage your system data">
          <div className="space-y-4">
            <div className="space-y-3">
              <Button
                onClick={handleExportData}
                className="w-full flex items-center justify-center space-x-2"
                variant="outline"
              >
                <Download className="h-4 w-4" />
                <span>Export System Data</span>
              </Button>
              
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isImporting}
                />
                <Button
                  className="w-full flex items-center justify-center space-x-2"
                  variant="outline"
                  disabled={isImporting}
                >
                  <Upload className="h-4 w-4" />
                  <span>{isImporting ? 'Importing...' : 'Import System Data'}</span>
                </Button>
              </div>
            </div>
            
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Backup includes all products, users, sales, and settings. 
                Import will overwrite existing data.
              </AlertDescription>
            </Alert>
          </div>
        </PosCard>

        {/* System Information */}
        <PosCard title="System Information" description="Current system status">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Storage Used</p>
                <p className="font-medium">{storageInfo.used} MB</p>
              </div>
              <div>
                <p className="text-muted-foreground">Storage Limit</p>
                <p className="font-medium">{storageInfo.total} MB</p>
              </div>
              <div>
                <p className="text-muted-foreground">Data Source</p>
                <p className="font-medium">LocalStorage</p>
              </div>
              <div>
                <p className="text-muted-foreground">Offline Ready</p>
                <Badge variant="secondary" className="bg-success-light text-success">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Yes
                </Badge>
              </div>
            </div>
            
            <div className="pt-4 border-t border-border">
              <Button
                onClick={() => setShowClearDialog(true)}
                variant="destructive"
                className="w-full flex items-center justify-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Clear All Data</span>
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                ⚠️ This action cannot be undone
              </p>
            </div>
          </div>
        </PosCard>
      </div>

      {/* Clear Data Confirmation Dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span>Clear All Data</span>
            </DialogTitle>
            <DialogDescription>
              This will permanently delete all products, users, sales, and settings. 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Make sure you have exported your data as a backup before proceeding.
            </AlertDescription>
          </Alert>

          <DialogFooter className="flex space-x-2">
            <Button variant="outline" onClick={() => setShowClearDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearAllData}>
              Yes, Clear All Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;