// src/pages/admin/ProductManagement.jsx
//
// Composes the products & categories admin components into one page.
// Mobile: a tabbed layout (Products / Add product / Categories) since
// there's no room to show the board and the forms side by side.
// Desktop: board + forms live in a two-column layout, tabs collapse into
// a segmented control that only switches the left rail's content.
//
// This file wasn't in the original set of components shared — it's a
// suggested shell so CategoryCreateForm, ProductCreateForm,
// CategoryProductsBoard, CategoryManagementBoard, and ProductEditModal
// all have a consistent, responsive home. Adjust the import paths/routes
// to match wherever this actually lives in the app.

import { useState } from "react";
import CategoryCreateForm from "../../components/admin/products/CategoryCreateForm";
import CategoryManagementBoard from "../../components/admin/products/CategoryManagementBoard";
import CategoryEditModal from "../../components/admin/products/CategoryEditModal";
import ProductCreateForm from "../../components/admin/products/ProductCreateForm";
import CategoryProductsBoard from "../../components/admin/products/CategoryProductsBoard";
import ProductEditModal from "../../components/admin/products/ProductEditModal";

const TABS = [
    { key: "products", label: "Products" },
    { key: "add-product", label: "Add product" },
    { key: "categories", label: "Categories" }
];

export default function ProductManagement() {
    const [activeTab, setActiveTab] = useState("products");
    const [refreshKey, setRefreshKey] = useState(0);
    const [editingProduct, setEditingProduct] = useState(null);
    const [editingCategory, setEditingCategory] = useState(null);

    const bump = () => setRefreshKey((k) => k + 1);

    return (
        <div className="mx-auto max-w-6xl space-y-6 p-4 text-ink sm:p-6 lg:p-8">
            <div className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-clay-deep">Catalog</span>
                <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Products &amp; categories</h1>
                <p className="text-sm text-stone">Manage everything customers see in your store.</p>
            </div>

            {/* Segmented tab control — same everywhere, but content below reflows per breakpoint */}
            <div className="flex gap-1.5 overflow-x-auto rounded-full bg-linen p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:inline-flex sm:w-auto">
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition ${
                            activeTab === tab.key
                                ? "bg-moss text-card"
                                : "text-stone hover:text-ink"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === "products" && (
                <CategoryProductsBoard refreshKey={refreshKey} onEditProduct={setEditingProduct} />
            )}

            {activeTab === "add-product" && (
                <div className="mx-auto max-w-3xl">
                    <ProductCreateForm
                        onCreated={() => {
                            bump();
                            setActiveTab("products");
                        }}
                    />
                </div>
            )}

            {activeTab === "categories" && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                    <div className="lg:col-span-2">
                        <CategoryCreateForm onCreated={bump} />
                    </div>
                    <div className="space-y-3 lg:col-span-3">
                        <h2 className="font-display text-xl font-semibold text-ink">Existing categories</h2>
                        <CategoryManagementBoard refreshKey={refreshKey} onEditCategory={setEditingCategory} />
                    </div>
                </div>
            )}

            {editingProduct && (
                <ProductEditModal
                    product={editingProduct}
                    onClose={() => setEditingProduct(null)}
                    onUpdated={() => {
                        bump();
                        setEditingProduct(null);
                    }}
                />
            )}

            {editingCategory && (
                <CategoryEditModal
                    category={editingCategory}
                    onClose={() => setEditingCategory(null)}
                    onUpdated={() => {
                        bump();
                        setEditingCategory(null);
                    }}
                    onDeleted={() => {
                        bump();
                        setEditingCategory(null);
                    }}
                />
            )}
        </div>
    );
}