'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';
import { trackDeleteProduct } from '@/lib/ganalytics';

interface Product {
  _id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  keywords: string[];
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        fetchProducts(user);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchProducts = async (currentUser: any) => {
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch('/api/products', {
        headers: {
          'x-firebase-uid': currentUser.uid,
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const productToDelete = products.find(p => p._id === id);
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: {
          'x-firebase-uid': user.uid,
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        if (productToDelete) {
          trackDeleteProduct(productToDelete.name, productToDelete.category);
        }
        setProducts(products.filter((p) => p._id !== id));
      }
    } catch (error) {
      console.error('Error deleting product:', error);
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
          <p className="mt-2 text-gray-600">Manage your product catalog</p>
        </div>
        <Link
          href="/products/new"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Add Product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center border border-gray-200">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
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
          <p className="mt-1 text-sm text-gray-500">
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
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-500">{product.category}</p>
                </div>
                <p className="text-lg font-bold text-indigo-600">${product.price}</p>
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.description}</p>

              {product.keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {product.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <Link
                  href={`/products/${product._id}/edit`}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(product._id)}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
