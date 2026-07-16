// src/pages/admin/ProductManagement.jsx
import { useState } from "react";
import ProductCreateForm from "../../components/admin/products/ProductCreateForm";
import CategoryCreateForm from "../../components/admin/products/CategoryCreateForm";
import CategoryProductsBoard from "../../components/admin/products/CategoryProductsBoard";
import CategoryManagementBoard from "../../components/admin/products/CategoryManagementBoard";
import ProductEditModal from "../../components/admin/products/ProductEditModal";
import CategoryEditModal from "../../components/admin/products/CategoryEditModal";

const TABS = [
    { key: "product", label: "New product" },
    { key: "category", label: "New category" }
];

export default function ProductManagement() {
    const [activeTab, setActiveTab] = useState("product");
    const [refreshKey, setRefreshKey] = useState(0);
    const bumpRefresh = () => setRefreshKey((k) => k + 1);

    const [editingProduct, setEditingProduct] = useState(null);
    const [editingCategory, setEditingCategory] = useState(null);

    const handleEditProduct = (product) => setEditingProduct(product);
    const handleProductUpdated = () => {
        setEditingProduct(null);
        bumpRefresh();
    };

    const handleEditCategory = (category) => setEditingCategory(category);
    // Category details/status changes don't close the modal — the admin
    // may want to keep editing fields right after. Only a delete closes it.
    const handleCategoryUpdated = () => bumpRefresh();
    const handleCategoryDeleted = () => {
        setEditingCategory(null);
        bumpRefresh();
    };

    return (
        <div className="space-y-8 p-6">
            <div>
                <h1 className="text-xl font-semibold text-slate-900">Products</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                    Create products and categories, and manage your existing catalog.
                </p>
            </div>

            <div>
                <div className="flex gap-1 border-b border-slate-200 mb-4">
                    {TABS.map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                                activeTab === tab.key
                                    ? "border-indigo-600 text-indigo-700"
                                    : "border-transparent text-slate-500 hover:text-slate-700"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === "product" ? (
                    <ProductCreateForm onCreated={bumpRefresh} />
                ) : (
                    <CategoryCreateForm onCreated={bumpRefresh} />
                )}
            </div>

            <div className="border-t border-slate-200 pt-8">
                <h2 className="text-base font-semibold text-slate-800 mb-3">Categories</h2>
                <CategoryManagementBoard refreshKey={refreshKey} onEditCategory={handleEditCategory} />
            </div>

            <div className="border-t border-slate-200 pt-8">
                <CategoryProductsBoard refreshKey={refreshKey} onEditProduct={handleEditProduct} />
            </div>

            {editingProduct && (
                <ProductEditModal product={editingProduct} onClose={() => setEditingProduct(null)} onUpdated={handleProductUpdated} />
            )}

            {editingCategory && (
                <CategoryEditModal
                    category={editingCategory}
                    onClose={() => setEditingCategory(null)}
                    onUpdated={handleCategoryUpdated}
                    onDeleted={handleCategoryDeleted}
                />
            )}
        </div>
    );
}