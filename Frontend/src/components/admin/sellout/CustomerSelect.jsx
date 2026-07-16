// src/components/admin/sellout/CustomerSelect.jsx
//
// createSale always takes { customerName, customerPhone } — the backend
// upserts the Customer by phone itself, there's no "existing customer id"
// concept on this endpoint. So both modes here just differ in how the
// admin fills in name/phone:
//  - "existing": search-assisted autofill from an existing customer record
//  - "new": type name + phone directly
//
// onChange receives { customerName, customerPhone } or null.

import { useEffect, useRef, useState } from "react";
import { getAllCustomers } from "../../../api/admin/customers.api";

const PHONE_REGEX = /^[0-9]{10}$/;

export default function CustomerSelect({ onChange }) {
    const [mode, setMode] = useState("existing");
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [selected, setSelected] = useState(null);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const debounceRef = useRef(null);

    useEffect(() => {
        if (mode !== "existing" || selected || !query.trim()) {
            setResults([]);
            return;
        }
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setSearching(true);
            try {
                const { customers } = await getAllCustomers({ search: query.trim(), limit: 8 });
                setResults(customers);
            } catch {
                setResults([]);
            } finally {
                setSearching(false);
            }
        }, 300);
        return () => clearTimeout(debounceRef.current);
    }, [query, mode, selected]);

    const emit = (n, p) => {
        if (n.trim() && PHONE_REGEX.test(p.trim())) {
            onChange({ customerName: n.trim(), customerPhone: p.trim() });
        } else {
            onChange(null);
        }
    };

    const pickCustomer = (customer) => {
        setSelected(customer);
        setResults([]);
        setQuery(customer.name);
        setName(customer.name);
        setPhone(customer.phone);
        onChange({ customerName: customer.name, customerPhone: customer.phone });
    };

    const clearSelection = () => {
        setSelected(null);
        setQuery("");
        setName("");
        setPhone("");
        onChange(null);
    };

    const switchMode = (next) => {
        setMode(next);
        setSelected(null);
        setQuery("");
        setName("");
        setPhone("");
        onChange(null);
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700">Customer</label>
                <button
                    type="button"
                    onClick={() => switchMode(mode === "existing" ? "new" : "existing")}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                >
                    {mode === "existing" ? "+ New customer" : "Search existing"}
                </button>
            </div>

            {mode === "existing" ? (
                selected ? (
                    <div className="flex items-center justify-between rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm">
                        <span>
                            {selected.name} · {selected.phone}
                            {selected.pendingBalance > 0 && (
                                <span className="ml-2 text-amber-600">
                                    (owes ₹{selected.pendingBalance.toLocaleString("en-IN")})
                                </span>
                            )}
                        </span>
                        <button type="button" onClick={clearSelection} className="text-slate-400 hover:text-slate-600">
                            ×
                        </button>
                    </div>
                ) : (
                    <div className="relative">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by name or phone…"
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        />
                        {searching && <p className="text-xs text-slate-400 mt-1">Searching…</p>}
                        {results.length > 0 && (
                            <ul className="absolute z-10 w-full mt-1 rounded-md border border-slate-200 bg-white shadow-sm max-h-48 overflow-auto">
                                {results.map((c) => (
                                    <li key={c._id}>
                                        <button
                                            type="button"
                                            onClick={() => pickCustomer(c)}
                                            className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
                                        >
                                            {c.name} · {c.phone}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {!searching && query.trim() && results.length === 0 && (
                            <p className="text-xs text-slate-400 mt-1">
                                No match — switch to "New customer" to add {query}.
                            </p>
                        )}
                    </div>
                )
            ) : (
                <div className="grid grid-cols-2 gap-3">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                            emit(e.target.value, phone);
                        }}
                        placeholder="Full name"
                        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                            setPhone(e.target.value);
                            emit(name, e.target.value);
                        }}
                        placeholder="10-digit mobile"
                        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                    {phone && !PHONE_REGEX.test(phone) && (
                        <p className="col-span-2 text-xs text-red-500">Enter a valid 10-digit mobile number.</p>
                    )}
                </div>
            )}
        </div>
    );
}