'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { trackDeleteProduct } from '@/lib/ganalytics';
import { useAuth } from '@/components/AuthContext';
import ProductEditModal from '@/components/ProductEditModal';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';

interface Product {
  _id: string;
  name: string;
  description?: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchProducts();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchProducts = async () => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/products', {
        headers: {
          'x-firebase-uid': user.uid,
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data);
        setError('');
      } else {
        const errorMessage = response.status === 401
          ? 'Your session has expired. Please sign in again.'
          : 'Failed to load products. Please refresh the page.';
        setError(errorMessage);
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products. Please check your connection.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;

    const productToDelete = products.find(p => p._id === id);
    if (productToDelete) {
      setDeletingProduct(productToDelete);
    }
  };

  const confirmDelete = async () => {
    if (!user || !deletingProduct) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/products/${deletingProduct._id}`, {
        method: 'DELETE',
        headers: {
          'x-firebase-uid': user.uid,
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        trackDeleteProduct(deletingProduct.name, 'General');
        setProducts(products.filter((p) => p._id !== deletingProduct._id));
        setDeletingProduct(null);
      } else {
        throw new Error('Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
  };

  const closeEditModal = () => {
    setEditingProduct(null);
  };

  const closeDeleteModal = () => {
    setDeletingProduct(null);
  };

  const handleSaveEdit = async (data: { name: string; description: string }) => {
    if (!user || !editingProduct) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/products/${editingProduct._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-firebase-uid': user.uid,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const updatedProduct = await response.json();
        // Optimistic update
        setProducts(products.map(p =>
          p._id === updatedProduct._id ? updatedProduct : p
        ));
      } else {
        throw new Error('Failed to save product');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="mt-2 text-gray-800">Manage your product catalog</p>
        </div>
        <Link
          href="/products/new"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Add Product
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {products.length === 0 && !error ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center border border-gray-200">
          <svg
            className="mx-auto h-12 w-12 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No products</h3>
          <p className="mt-1 text-sm text-gray-700">
            Get started by adding your first product.
          </p>
          <div className="mt-6">
            <Link
              href="/products/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Add Product
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div
              key={product._id}
              className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
            >
              <h3
                className="text-lg font-semibold text-gray-900 mb-2 cursor-pointer hover:text-indigo-600 transition-colors"
                onDoubleClick={() => openEditModal(product)}
                title="Double-click to edit"
              >
                {product.name}
              </h3>

              {product.description && (
                <p
                  className="text-sm text-gray-800 mb-4 line-clamp-2 cursor-pointer hover:text-indigo-600 transition-colors"
                  onDoubleClick={() => openEditModal(product)}
                  title="Double-click to edit"
                >
                  {product.description}
                </p>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <button
                  onClick={() => openEditModal(product)}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(product._id)}
                  className="text-red-700 hover:text-red-800 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingProduct && (
        <ProductEditModal
          key={editingProduct._id}
          product={editingProduct}
          isOpen={!!editingProduct}
          onClose={closeEditModal}
          onSave={handleSaveEdit}
        />
      )}

      {deletingProduct && (
        <DeleteConfirmModal
          product={deletingProduct}
          isOpen={!!deletingProduct}
          onClose={closeDeleteModal}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
