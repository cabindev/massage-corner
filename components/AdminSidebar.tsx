"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  exact?: boolean;
};

const ICON = {
  dashboard: (
    <path
      d="M4 13h7V4H4v9Zm0 7h7v-5H4v5Zm9 0h7v-9h-7v9Zm0-16v5h7V4h-7Z"
      fill="currentColor"
    />
  ),
  bookings: (
    <path
      d="M7 2v3m10-3v3M3.5 9h17M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
      stroke="currentColor"
      strokeWidth="1.7"
      fill="none"
      strokeLinecap="round"
    />
  ),
  services: (
    <path
      d="M12 21c5-3 8-6.5 8-11a4 4 0 0 0-8-1 4 4 0 0 0-8 1c0 4.5 3 8 8 11Z"
      stroke="currentColor"
      strokeWidth="1.7"
      fill="none"
      strokeLinejoin="round"
    />
  ),
  therapists: (
    <path
      d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21a8 8 0 0 1 16 0"
      stroke="currentColor"
      strokeWidth="1.7"
      fill="none"
      strokeLinecap="round"
    />
  ),
  schedule: (
    <path
      d="M3 10h18M8 3v4m8-4v4M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm3 9h3v3H8z"
      stroke="currentColor"
      strokeWidth="1.6"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
};

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: ICON.dashboard, exact: true },
  { href: "/admin/schedule", label: "Schedule", icon: ICON.schedule },
  { href: "/admin/bookings", label: "Bookings", icon: ICON.bookings },
  { href: "/admin/therapists", label: "Therapists", icon: ICON.therapists },
  { href: "/admin/services", label: "Services", icon: ICON.services },
];

export default function AdminSidebar({ userName }: { userName?: string | null }) {
  const pathname = usePathname();

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <aside className="border-b border-leaf-100 bg-white md:flex md:min-h-screen md:w-64 md:flex-col md:border-b-0 md:border-r">
      <div className="flex items-center gap-2 px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-leaf-100 text-leaf-700">
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
            <path
              d="M20 4C9 4 4 10 4 19m0 0c4-9 9-12 14-13"
              stroke="currentColor"
              strokeWidth="1.6"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <div className="leading-tight">
          <p className="font-semibold text-bark">Massage Corner Sofia</p>
          <p className="text-xs text-bark/50">Admin Panel</p>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:gap-1.5 md:pb-0">
        {NAV.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-leaf-600 text-white shadow-sm shadow-leaf-600/30"
                  : "text-bark/70 hover:bg-leaf-50 hover:text-leaf-700"
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden>
                {item.icon}
              </svg>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 md:mt-auto">
        {userName && (
          <p className="px-4 pb-2 text-xs text-bark/45">
            Signed in as <span className="font-medium text-bark/70">{userName}</span>
          </p>
        )}
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-bark/60 transition hover:bg-leaf-50 hover:text-leaf-700"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
            <path
              d="M9 18l-6-6 6-6m-6 6h18"
              stroke="currentColor"
              strokeWidth="1.7"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to site
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
          className="mt-1 flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
            <path
              d="M16 17l5-5-5-5m5 5H9M12 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"
              stroke="currentColor"
              strokeWidth="1.7"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  );
}
