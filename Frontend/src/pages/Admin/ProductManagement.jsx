// src/pages/admin/ProductManagement.jsx
import { useState } from "react";
import ProductCreateForm from "../../components/admin/products/ProductCreateForm";
import CategoryCreateForm from "../../components/admin/products/CategoryCreateForm";
import CategoryProductsBoard from "../../components/admin/products/CategoryProductsBoard";
import CategoryManagementBoard from "../../components/admin/products/CategoryManagementBoard";
import ProductEditModal from "../../components/admin/products/ProductEditModal";
import CategoryEditModal from "../../components/admin/products/CategoryEditModal";
import { IconProducts } from "../../components/admin/icons/AdminIcons";

const TABS = [
    { key: "product", label: "New product" },
    { key: "category", label: "New category" }
];

// Shared glass card shell used by every section on the page.
const glassCard =
    "relative rounded-[28px] border border-white/60 bg-gradient-to-b from-white/70 via-white/55 to-white/40 " +
    "backdrop-blur-xl shadow-[0_20px_50px_-28px_rgba(42,37,31,0.4),inset_0_1px_0_rgba(255,255,255,0.9)]";

function SectionHeader({ eyebrow, title, description, children }) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-5">
            <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-clay">{eyebrow}</p>
                <h2 className="font-display text-xl sm:text-2xl font-semibold text-ink mt-1">{title}</h2>
                {description && <p className="text-sm text-stone mt-1">{description}</p>}
            </div>
            {children}
        </div>
    );
}

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
        <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8 text-ink">
            {/* Page header */}
            <div className="flex items-center gap-4">
                <div
                    className="flex h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-gradient-to-br from-moss to-moss/80 text-card items-center justify-center shrink-0
                        shadow-[0_12px_24px_-12px_rgba(57,58,34,0.85),inset_0_1px_0_rgba(255,255,255,0.3)]"
                >
                    <IconProducts className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                    <h1 className="font-display text-2xl sm:text-4xl font-semibold text-ink leading-tight">Products</h1>
                    <p className="text-sm sm:text-[15px] text-stone mt-0.5">
                        Create products and categories, and manage your existing catalog.
                    </p>
                </div>
            </div>

            {/* Create section */}
            <section className={`${glassCard} p-4 sm:p-7`}>
                <SectionHeader
                    eyebrow="Create"
                    title={activeTab === "product" ? "Add a new product" : "Add a new category"}
                    description={
                        activeTab === "product"
                            ? "Fill in the details to add a piece to your catalog."
                            : "Group your products so customers can browse them easily."
                    }
                >
                    {/* Segmented control */}
                    <div
                        role="tablist"
                        className="inline-flex self-start sm:self-auto p-1 rounded-full bg-ink/5 border border-white/70 shadow-[inset_0_1px_2px_rgba(42,37,31,0.08)]"
                    >
                        {TABS.map((tab) => {
                            const active = activeTab === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    role="tab"
                                    aria-selected={active}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`px-4 sm:px-5 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all duration-200 ${
                                        active
                                            ? "bg-gradient-to-br from-moss to-moss/85 text-card shadow-[0_8px_18px_-8px_rgba(57,58,34,0.85),inset_0_1px_0_rgba(255,255,255,0.25)]"
                                            : "text-ink/70 hover:text-ink hover:bg-white/60"
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </SectionHeader>

                <div className="h-px bg-gradient-to-r from-transparent via-line to-transparent mb-5" />

                {activeTab === "product" ? (
                    <ProductCreateForm onCreated={bumpRefresh} />
                ) : (
                    <CategoryCreateForm onCreated={bumpRefresh} />
                )}
            </section>

            {/* Categories */}
            <section className={`${glassCard} p-4 sm:p-7`}>
                <SectionHeader
                    eyebrow="Organise"
                    title="Categories"
                    description="Edit, reorder or disable the categories shown in your store."
                />
                <CategoryManagementBoard refreshKey={refreshKey} onEditCategory={handleEditCategory} />
            </section>

            {/* Products by category */}
            <section className={`${glassCard} p-4 sm:p-7 overflow-hidden`}>
                <SectionHeader
                    eyebrow="Catalog"
                    title="Products by category"
                    description="Browse every product grouped by its category and edit it in place."
                />
                <CategoryProductsBoard refreshKey={refreshKey} onEditProduct={handleEditProduct} />
            </section>

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