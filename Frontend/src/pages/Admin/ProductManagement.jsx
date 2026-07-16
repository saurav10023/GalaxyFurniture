// src/pages/admin/ProductManagement.jsx
import { useState } from "react";
import ProductCreateForm from "../../components/admin/products/ProductCreateForm";
import CategoryCreateForm from "../../components/admin/products/CategoryCreateForm";
import CategoryProductsBoard from "../../components/admin/products/CategoryProductsBoard";

const TABS = [
    { key: "product", label: "New product" },
    { key: "category", label: "New category" }
];

export default function ProductManagement() {
    const [activeTab, setActiveTab] = useState("product");
    const [refreshKey, setRefreshKey] = useState(0);
    const bumpRefresh = () => setRefreshKey((k) => k + 1);

    // Stub — swap for real navigation/modal once ProductEditForm exists.
    const handleEditProduct = (product) => {
        console.log("TODO: open edit form for", product._id);
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
                <CategoryProductsBoard refreshKey={refreshKey} onEditProduct={handleEditProduct} />
            </div>
        </div>
    );
}