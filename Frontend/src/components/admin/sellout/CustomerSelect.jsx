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
import { IconSearch, IconUser, IconClose } from "../icons/AdminIcons";

const PHONE_REGEX = /^[0-9]{10}$/;

const fieldClasses =
    "w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-stone/60 focus:outline-none focus:ring-2 focus:ring-moss/30 focus:border-moss";

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
        if (next === mode) return;
        setMode(next);
        setSelected(null);
        setQuery("");
        setName("");
        setPhone("");
        onChange(null);
    };

    const toggleClasses = (active) =>
        `px-3.5 py-1 rounded-full text-xs font-medium transition-colors ${
            active ? "bg-card text-ink shadow-sm" : "text-stone hover:text-ink"
        }`;

    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-ink">Customer</label>
                <div className="inline-flex rounded-full p-0.5 bg-linen">
                    <button type="button" onClick={() => switchMode("existing")} className={toggleClasses(mode === "existing")}>
                        Existing
                    </button>
                    <button type="button" onClick={() => switchMode("new")} className={toggleClasses(mode === "new")}>
                        New
                    </button>
                </div>
            </div>

            {mode === "existing" ? (
                selected ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-moss/25 bg-moss/5 px-3 py-2.5">
                        <div className="h-9 w-9 rounded-full bg-moss/10 text-moss font-display text-lg font-semibold flex items-center justify-center shrink-0">
                            {selected.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-ink truncate">{selected.name}</div>
                            <div className="text-xs text-stone">
                                {selected.phone}
                                {selected.pendingBalance > 0 && (
                                    <span className="ml-1.5 text-clay-deep">
                                        · owes ₹{selected.pendingBalance.toLocaleString("en-IN")}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={clearSelection}
                            className="text-stone hover:text-ink hover:bg-linen p-1.5 rounded-full shrink-0 transition-colors"
                            aria-label="Clear customer"
                        >
                            <IconClose className="h-4 w-4" />
                        </button>
                    </div>
                ) : (
                    <div className="relative">
                        <IconSearch className="h-4 w-4 text-stone absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by name or phone…"
                            className={`${fieldClasses} pl-10`}
                        />
                        {searching && <p className="text-xs text-stone mt-1.5">Searching…</p>}
                        {results.length > 0 && (
                            <ul className="absolute z-10 w-full mt-1.5 rounded-2xl border border-line bg-card/95 backdrop-blur-xl shadow-[0_12px_32px_-12px_rgba(42,37,31,0.25)] max-h-52 overflow-auto p-1.5">
                                {results.map((c) => (
                                    <li key={c._id}>
                                        <button
                                            type="button"
                                            onClick={() => pickCustomer(c)}
                                            className="w-full flex items-center gap-2.5 text-left px-3 py-2 text-sm rounded-xl hover:bg-linen"
                                        >
                                            <IconUser className="h-3.5 w-3.5 text-clay shrink-0" />
                                            <span className="text-ink">{c.name}</span>
                                            <span className="text-stone">· {c.phone}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {!searching && query.trim() && results.length === 0 && (
                            <p className="text-xs text-stone mt-1.5">
                                No match — switch to "New" to add {query}.
                            </p>
                        )}
                    </div>
                )
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                            emit(e.target.value, phone);
                        }}
                        placeholder="Full name"
                        className={fieldClasses}
                    />
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                            setPhone(e.target.value);
                            emit(name, e.target.value);
                        }}
                        placeholder="10-digit mobile"
                        className={fieldClasses}
                    />
                    {phone && !PHONE_REGEX.test(phone) && (
                        <p className="sm:col-span-2 text-xs text-red-700">Enter a valid 10-digit mobile number.</p>
                    )}
                </div>
            )}
        </div>
    );
}