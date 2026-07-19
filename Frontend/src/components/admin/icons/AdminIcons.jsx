// src/components/admin/icons/AdminIcons.jsx
// Small stroke-icon set shared across the admin shell. Keeping these in one
// file means the sidebar, topbar, and home page always draw from the same
// visual language instead of drifting into mismatched icon styles.

const base = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round",
    strokeLinejoin: "round"
};

export const IconMenu = (props) => (
    <svg {...base} {...props}>
        <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);

export const IconClose = (props) => (
    <svg {...base} {...props}>
        <path d="M6 6l12 12M18 6L6 18" />
    </svg>
);

export const IconOverview = (props) => (
    <svg {...base} {...props}>
        <path d="M4 13h6V4H4v9ZM14 20h6v-9h-6v9ZM14 4v3h6V4h-6ZM4 20h6v-3H4v3Z" />
    </svg>
);

export const IconProducts = (props) => (
    <svg {...base} {...props}>
        <path d="M21 8 12 3 3 8l9 5 9-5Z" />
        <path d="M3 8v8l9 5 9-5V8M12 13v8" />
    </svg>
);

export const IconSellOut = (props) => (
    <svg {...base} {...props}>
        <path d="M3 6h2l1.6 9.6a2 2 0 0 0 2 1.4h8a2 2 0 0 0 2-1.6L20 8H6" />
        <circle cx="9.5" cy="20" r="1.3" fill="currentColor" stroke="none" />
        <circle cx="17" cy="20" r="1.3" fill="currentColor" stroke="none" />
    </svg>
);

export const IconAnalytics = (props) => (
    <svg {...base} {...props}>
        <path d="M4 20V10M12 20V4M20 20v-7" />
    </svg>
);

export const IconPaymentsDue = (props) => (
    <svg {...base} {...props}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 2" />
    </svg>
);

export const IconPaymentHistory = (props) => (
    <svg {...base} {...props}>
        <path d="M6 3.5h9L19 8v12.5H6V3.5Z" />
        <path d="M14 3.5V8h5M9 12.5h6M9 15.5h6" />
    </svg>
);

export const IconSalesHistory = (props) => (
    <svg {...base} {...props}>
        <path d="M4 4v6h6" />
        <path d="M4.6 10a8 8 0 1 1 1.7 8.4" />
        <path d="M12 8v4.5l3 2" />
    </svg>
);

export const IconChevronRight = (props) => (
    <svg {...base} {...props}>
        <path d="M9 6l6 6-6 6" />
    </svg>
);

export const IconLogout = (props) => (
    <svg {...base} {...props}>
        <path d="M15 17.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v2.5" />
        <path d="M9 12h11.5M17 8.5 21 12l-4 3.5" />
    </svg>
);

export const IconSales = (props) => (
    <svg {...base} {...props}>
        <path d="M3 9.5 12 4l9 5.5" />
        <path d="M5 10v9h14v-9M9.5 19v-5h5v5" />
    </svg>
);

export const IconRevenue = (props) => (
    <svg {...base} {...props}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M9.5 15.5h3.2a1.8 1.8 0 0 0 0-3.6H11a1.8 1.8 0 0 1 0-3.6h3.2M12 7v1.3M12 15.7V17" />
    </svg>
);

export const IconProfit = (props) => (
    <svg {...base} {...props}>
        <path d="M4 16.5 9.5 11l3.5 3.5L20 7" />
        <path d="M14.5 7H20v5.5" />
    </svg>
);

export const IconPending = (props) => (
    <svg {...base} {...props}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 2" />
    </svg>
);

export const IconStock = (props) => (
    <svg {...base} {...props}>
        <path d="M21 8 12 3 3 8l9 5 9-5Z" />
        <path d="M3 8v8l9 5 9-5V8M12 13v8" />
    </svg>
);

export const IconSearch = (props) => (
    <svg {...base} {...props}>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m20 20-4.8-4.8" />
    </svg>
);

export const IconTrash = (props) => (
    <svg {...base} {...props}>
        <path d="M5 7h14M9 7V4.5h6V7M7 7l1 12.5a1.5 1.5 0 0 0 1.5 1.4h5a1.5 1.5 0 0 0 1.5-1.4L17 7" />
        <path d="M10 11v6M14 11v6" />
    </svg>
);

export const IconEdit = (props) => (
    <svg {...base} {...props}>
        <path d="M4 20h4l10.5-10.5a2 2 0 0 0-4-4L4 16v4Z" />
        <path d="M13 6.5 17.5 11" />
    </svg>
);

export const IconChevronLeft = (props) => (
    <svg {...base} {...props}>
        <path d="M15 6 9 12l6 6" />
    </svg>
);

export const IconInbox = (props) => (
    <svg {...base} {...props}>
        <path d="M4 12.5 6.5 5h11L20 12.5" />
        <path d="M4 12.5V18a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 18v-5.5" />
        <path d="M4 12.5h5l1 2h4l1-2h5" />
    </svg>
);

export const IconCalendar = (props) => (
    <svg {...base} {...props}>
        <rect x="4" y="5.5" width="16" height="14.5" rx="2" />
        <path d="M4 10h16M8 3.5v3M16 3.5v3" />
    </svg>
);

export const IconFilterX = (props) => (
    <svg {...base} {...props}>
        <path d="M4 5h16M7 12h10M10 19h4" />
    </svg>
);

export const IconChevronDown = (props) => (
    <svg {...base} {...props}>
        <path d="M6 9l6 6 6-6" />
    </svg>
);

export const IconPlus = (props) => (
    <svg {...base} {...props}>
        <path d="M12 5v14M5 12h14" />
    </svg>
);

export const IconMinus = (props) => (
    <svg {...base} {...props}>
        <path d="M5 12h14" />
    </svg>
);

export const IconUser = (props) => (
    <svg {...base} {...props}>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20c0-3.6 3.1-6.5 7-6.5s7 2.9 7 6.5" />
    </svg>
);