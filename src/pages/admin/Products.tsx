import React, { useState, useEffect } from 'react';
import { PosCard } from '@/components/ui/pos-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Package,
  AlertTriangle,
  Eye,
  EyeOff,
  Save,
  X
} from 'lucide-react';
import { productStorage, Product, ProductVariant } from '@/lib/storage';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: '',
    price: '',
    stock: '',
    minStock: '',
    isActive: true,
    description: ''
  });

  const { toast } = useToast();

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchQuery, products]);

  const loadProducts = () => {
    const allProducts = productStorage.getAll();
    setProducts(allProducts);
    
    // Extract unique categories
    const uniqueCategories = [...new Set(allProducts.map(p => p.category))];
    setCategories(uniqueCategories);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      category: '',
      price: '',
      stock: '',
      minStock: '',
      isActive: true,
      description: ''
    });
    setEditingProduct(null);
  };

  const handleAddProduct = () => {
    resetForm();
    setShowDialog(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      code: product.code,
      category: product.category,
      price: product.price.toString(),
      stock: product.stock.toString(),
      minStock: product.minStock.toString(),
      isActive: product.isActive,
      description: ''
    });
    setShowDialog(true);
  };

  const handleDeleteProduct = (product: Product) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      const success = productStorage.delete(product.id);
      if (success) {
        loadProducts();
        toast({
          title: "Product deleted",
          description: `${product.name} has been removed`,
        });
      }
    }
  };

  const toggleProductStatus = (product: Product) => {
    const success = productStorage.update(product.id, { isActive: !product.isActive });
    if (success) {
      loadProducts();
      toast({
        title: product.isActive ? "Product deactivated" : "Product activated",
        description: `${product.name} is now ${product.isActive ? 'inactive' : 'active'}`,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.code || !formData.category || !formData.price) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const productData = {
      name: formData.name,
      code: formData.code.toUpperCase(),
      category: formData.category,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock) || 0,
      minStock: parseInt(formData.minStock) || 0,
      isActive: formData.isActive
    };

    try {
      if (editingProduct) {
        const success = productStorage.update(editingProduct.id, productData);
        if (success) {
          toast({
            title: "Product updated",
            description: `${productData.name} has been updated`,
          });
        }
      } else {
        // Check if code already exists
        const existingProduct = products.find(p => p.code === productData.code);
        if (existingProduct) {
          toast({
            title: "Code already exists",
            description: "Please use a different product code",
            variant: "destructive",
          });
          return;
        }
        
        productStorage.add(productData);
        toast({
          title: "Product added",
          description: `${productData.name} has been created`,
        });
      }
      
      loadProducts();
      setShowDialog(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save product",
        variant: "destructive",
      });
    }
  };

  const updateStock = (productId: string, newStock: number) => {
    if (newStock < 0) return;
    
    const success = productStorage.update(productId, { stock: newStock });
    if (success) {
      loadProducts();
      toast({
        title: "Stock updated",
        description: "Product stock has been updated",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const getStockStatus = (product: Product) => {
    if (product.stock === 0) return { label: 'Out of Stock', variant: 'destructive' as const };
    if (product.stock <= product.minStock) return { label: 'Low Stock', variant: 'secondary' as const };
    return { label: 'In Stock', variant: 'secondary' as const };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Product Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage your store inventory and product catalog
          </p>
        </div>
        <Button onClick={handleAddProduct} className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Plus className="h-4 w-4" />
          <span>Add Product</span>
        </Button>
      </div>

      {/* Search and Filter */}
      <PosCard>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products by name, code, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex space-x-2">
            <Badge variant="outline">
              Total: {products.length}
            </Badge>
            <Badge variant="secondary">
              Active: {products.filter(p => p.isActive).length}
            </Badge>
            <Badge variant="destructive">
              Low Stock: {products.filter(p => p.stock <= p.minStock).length}
            </Badge>
          </div>
        </div>
      </PosCard>

      {/* Products Table */}
      <PosCard>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2">Product</th>
                <th className="text-left py-3 px-2">Code</th>
                <th className="text-left py-3 px-2">Category</th>
                <th className="text-right py-3 px-2">Price</th>
                <th className="text-center py-3 px-2">Stock</th>
                <th className="text-center py-3 px-2">Status</th>
                <th className="text-center py-3 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product);
                return (
                  <tr key={product.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-2">
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Min: {product.minStock}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 font-mono text-sm">{product.code}</td>
                    <td className="py-3 px-2">
                      <Badge variant="outline">{product.category}</Badge>
                    </td>
                    <td className="py-3 px-2 text-right font-medium">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateStock(product.id, product.stock - 1)}
                          className="h-6 w-6 p-0"
                        >
                          -
                        </Button>
                        <span className="min-w-[2rem] text-center">{product.stock}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateStock(product.id, product.stock + 1)}
                          className="h-6 w-6 p-0"
                        >
                          +
                        </Button>
                      </div>
                      <Badge variant={stockStatus.variant} className="mt-1 text-xs">
                        {stockStatus.label}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        {product.isActive ? (
                          <Eye className="h-4 w-4 text-success" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-xs">
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex justify-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditProduct(product)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleProductStatus(product)}
                          className="h-8 w-8 p-0"
                        >
                          {product.isActive ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteProduct(product)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredProducts.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                {searchQuery ? 'No products found' : 'No products yet'}
              </p>
            </div>
          )}
        </div>
      </PosCard>

      {/* Add/Edit Product Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct ? 'Update product information' : 'Create a new product for your inventory'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Product name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Product Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="PROD-001"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <div className="flex space-x-2">
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select or type category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Or type new category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minStock">Min Stock</Label>
                <Input
                  id="minStock"
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => setFormData(prev => ({ ...prev, minStock: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="isActive">Active Product</Label>
            </div>

            <DialogFooter className="flex space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                {editingProduct ? 'Update' : 'Create'} Product
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Products;