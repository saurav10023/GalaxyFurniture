// src/pages/admin/PaymentsDue.jsx
import { useState } from "react";
import PaymentsDueTable from "../../components/admin/payments/PaymentsDueTable";
import CustomerDetailDrawer from "../../components/admin/payments/CustomerDetailDrawer";

export default function PaymentsDue() {
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    return (
        <div className="space-y-8 p-6">
            <div>
                <h1 className="text-xl font-semibold text-slate-900">Payments Due</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                    Customers who still owe money on a sale.
                </p>
            </div>

            <PaymentsDueTable refreshKey={refreshKey} onSelectCustomer={setSelectedCustomerId} />

            {selectedCustomerId && (
                <CustomerDetailDrawer
                    customerId={selectedCustomerId}
                    onClose={() => setSelectedCustomerId(null)}
                    onPaymentRecorded={() => setRefreshKey((k) => k + 1)}
                />
            )}
        </div>
    );
}