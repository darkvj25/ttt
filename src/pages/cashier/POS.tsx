import React, { useState, useEffect } from 'react';
import { PosCard } from '@/components/ui/pos-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart,
  CreditCard,
  Banknote,
  Receipt,
  X
} from 'lucide-react';
import { productStorage, salesStorage, CartItem, Product } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { settingsStorage } from '@/lib/storage';

const POS: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'other'>('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (searchQuery.trim()) {
      const results = productStorage.search(searchQuery);
      setSearchResults(results.slice(0, 10)); // Limit to 10 results
    } else {
      // Show popular/recent products when no search
      const allProducts = productStorage.getAll().filter(p => p.isActive);
      setSearchResults(allProducts.slice(0, 8));
    }
  }, [searchQuery]);

  const addToCart = (product: Product, variantId?: string) => {
    const existingItem = cart.find(item => 
      item.productId === product.id && item.variantId === variantId
    );

    if (existingItem) {
      updateCartQuantity(existingItem.productId, existingItem.quantity + 1, variantId);
    } else {
      const variant = product.variants?.find(v => v.id === variantId);
      const price = variant ? variant.price : product.price;
      const name = variant ? `${product.name} - ${variant.name}` : product.name;
      
      const newItem: CartItem = {
        productId: product.id,
        variantId,
        name,
        price,
        quantity: 1,
        total: price
      };
      
      setCart(prev => [...prev, newItem]);
    }

    toast({
      title: "Added to cart",
      description: `${product.name} added successfully`,
    });
  };

  const updateCartQuantity = (productId: string, quantity: number, variantId?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantId);
      return;
    }

    setCart(prev => prev.map(item => {
      if (item.productId === productId && item.variantId === variantId) {
        return {
          ...item,
          quantity,
          total: item.price * quantity
        };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string, variantId?: string) => {
    setCart(prev => prev.filter(item => 
      !(item.productId === productId && item.variantId === variantId)
    ));
  };

  const clearCart = () => {
    setCart([]);
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateTax = (subtotal: number) => {
    const settings = settingsStorage.get();
    return subtotal * settings.taxRate;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax(subtotal);
    return subtotal + tax;
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Add items to cart before checkout",
        variant: "destructive",
      });
      return;
    }
    setShowCheckout(true);
  };

  const processSale = async () => {
    if (!user) return;

    setIsProcessing(true);

    try {
      const subtotal = calculateSubtotal();
      const tax = calculateTax(subtotal);
      const total = calculateTotal();
      const paid = parseFloat(amountPaid) || 0;

      if (paymentMethod === 'cash' && paid < total) {
        toast({
          title: "Insufficient payment",
          description: "Please enter the correct amount",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      const sale = salesStorage.add({
        items: cart,
        subtotal,
        tax,
        discount: 0,
        total,
        paymentMethod,
        amountPaid: paid,
        change: paymentMethod === 'cash' ? Math.max(0, paid - total) : 0,
        cashierId: user.id,
        cashierName: user.username,
        receiptPrinted: false
      });

      setLastSale(sale);
      setShowCheckout(false);
      setShowReceiptDialog(true);
      clearCart();
      setAmountPaid('');

      toast({
        title: "Sale completed",
        description: `Transaction ${sale.id} processed successfully`,
      });

    } catch (error) {
      toast({
        title: "Error processing sale",
        description: "Please try again",
        variant: "destructive",
      });
    }

    setIsProcessing(false);
  };

  const handlePrintReceipt = () => {
    if (lastSale) {
      // Update sale to mark receipt as printed
      const sales = salesStorage.getAll();
      const updatedSales = sales.map(s => 
        s.id === lastSale.id ? { ...s, receiptPrinted: true } : s
      );
      salesStorage.save(updatedSales);

      // Generate and print receipt
      printReceipt(lastSale);
    }
    setShowReceiptDialog(false);
    setLastSale(null);
  };

  const printReceipt = (sale: any) => {
    const receiptWindow = window.open('', '_blank');
    if (!receiptWindow) return;

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.4; margin: 20px; max-width: 300px; }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .item-row { display: flex; justify-content: space-between; margin: 2px 0; }
            .total-row { border-top: 1px dashed #000; padding-top: 5px; margin-top: 10px; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; border-top: 1px dashed #000; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>SARI-SARI STORE</h2>
            <p>123 Main Street<br>+63 123 456 7890</p>
            <p>Date: ${new Date(sale.timestamp).toLocaleString()}</p>
            <p>Receipt #: ${sale.id}</p>
            <p>Cashier: ${sale.cashierName}</p>
          </div>
          
          <div class="items">
            ${sale.items.map((item: CartItem) => `
              <div class="item-row">
                <span>${item.name}</span>
                <span>₱${item.price.toFixed(2)}</span>
              </div>
              <div class="item-row" style="margin-left: 20px; font-size: 10px;">
                <span>${item.quantity} x ₱${item.price.toFixed(2)}</span>
                <span>₱${item.total.toFixed(2)}</span>
              </div>
            `).join('')}
          </div>
          
          <div class="total-row">
            <div class="item-row">
              <span>Subtotal:</span>
              <span>₱${sale.subtotal.toFixed(2)}</span>
            </div>
            <div class="item-row">
              <span>Tax (${(settingsStorage.get().taxRate * 100).toFixed(0)}%):</span>
              <span>₱${sale.tax.toFixed(2)}</span>
            </div>
            <div class="item-row">
              <span>TOTAL:</span>
              <span>₱${sale.total.toFixed(2)}</span>
            </div>
            ${sale.paymentMethod === 'cash' ? `
              <div class="item-row">
                <span>Cash:</span>
                <span>₱${sale.amountPaid.toFixed(2)}</span>
              </div>
              <div class="item-row">
                <span>Change:</span>
                <span>₱${sale.change.toFixed(2)}</span>
              </div>
            ` : `
              <div class="item-row">
                <span>Payment:</span>
                <span>${sale.paymentMethod.toUpperCase()}</span>
              </div>
            `}
          </div>
          
          <div class="footer">
            <p>Thank you for your purchase!</p>
            <p>Come again soon!</p>
          </div>
        </body>
      </html>
    `;

    receiptWindow.document.write(receiptHtml);
    receiptWindow.document.close();
    receiptWindow.print();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Product Search & Selection */}
      <div className="lg:col-span-2 space-y-4">
        <PosCard title="Product Search" description="Search and add products to cart">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by name, code, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {searchResults.map((product) => (
                <div
                  key={product.id}
                  className="border border-border rounded-lg p-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{product.name}</h4>
                      <p className="text-xs text-muted-foreground">{product.code}</p>
                      <p className="text-xs text-muted-foreground">{product.category}</p>
                    </div>
                    <Badge variant={product.stock > product.minStock ? 'secondary' : 'destructive'}>
                      {product.stock} left
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-primary">
                      {formatCurrency(product.price)}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => addToCart(product)}
                      disabled={product.stock === 0}
                      className="flex items-center space-x-1"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {searchResults.length === 0 && searchQuery && (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No products found</p>
              </div>
            )}
          </div>
        </PosCard>
      </div>

      {/* Shopping Cart */}
      <div className="space-y-4">
        <PosCard title="Shopping Cart" description={`${cart.length} items`}>
          <div className="space-y-3">
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Cart is empty</p>
              </div>
            ) : (
              <>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {cart.map((item, index) => (
                    <div key={`${item.productId}-${item.variantId || 'default'}`} className="border border-border rounded p-2">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{item.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(item.price)} each
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.productId, item.variantId)}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateCartQuantity(item.productId, item.quantity - 1, item.variantId)}
                            className="h-6 w-6 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-medium w-8 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateCartQuantity(item.productId, item.quantity + 1, item.variantId)}
                            className="h-6 w-6 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="font-bold text-sm">
                          {formatCurrency(item.total)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Cart Summary */}
                <div className="border-t border-border pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(calculateSubtotal())}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax ({(settingsStorage.get().taxRate * 100).toFixed(0)}%):</span>
                    <span>{formatCurrency(calculateTax(calculateSubtotal()))}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t border-border pt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={clearCart}
                    className="flex items-center space-x-1"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Clear</span>
                  </Button>
                  <Button
                    onClick={handleCheckout}
                    className="flex items-center space-x-1"
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Checkout</span>
                  </Button>
                </div>
              </>
            )}
          </div>
        </PosCard>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Sale</DialogTitle>
            <DialogDescription>
              Process payment for this transaction
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Order Summary */}
            <div className="bg-muted rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatCurrency(calculateSubtotal())}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax ({(settingsStorage.get().taxRate * 100).toFixed(0)}%):</span>
                <span>{formatCurrency(calculateTax(calculateSubtotal()))}</span>
              </div>
              <div className="flex justify-between font-bold border-t border-border pt-2">
                <span>Total:</span>
                <span>{formatCurrency(calculateTotal())}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Amount Paid (for cash) */}
            {paymentMethod === 'cash' && (
              <div className="space-y-2">
                <Label>Amount Paid</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="0.00"
                />
                {parseFloat(amountPaid) > 0 && parseFloat(amountPaid) >= calculateTotal() && (
                  <p className="text-sm text-success">
                    Change: {formatCurrency(parseFloat(amountPaid) - calculateTotal())}
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="flex space-x-2">
            <Button variant="outline" onClick={() => setShowCheckout(false)}>
              Cancel
            </Button>
            <Button onClick={processSale} disabled={isProcessing}>
              {isProcessing ? 'Processing...' : 'Complete Sale'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Receipt className="h-5 w-5" />
              <span>Sale Completed</span>
            </DialogTitle>
            <DialogDescription>
              Do you want to print a receipt for this transaction?
            </DialogDescription>
          </DialogHeader>

          {lastSale && (
            <div className="bg-muted rounded-lg p-3">
              <div className="text-center space-y-1">
                <p className="text-lg font-bold">{formatCurrency(lastSale.total)}</p>
                <p className="text-sm text-muted-foreground">
                  Transaction #{lastSale.id}
                </p>
                <p className="text-sm text-muted-foreground">
                  {lastSale.items.length} items • {lastSale.paymentMethod.toUpperCase()}
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex space-x-2">
            <Button variant="outline" onClick={() => setShowReceiptDialog(false)}>
              No, Skip Receipt
            </Button>
            <Button onClick={handlePrintReceipt}>
              Yes, Print Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default POS;