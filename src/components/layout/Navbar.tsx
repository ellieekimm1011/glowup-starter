"use client";
// components/layout/Navbar.tsx
// The navigation bar shown on authenticated pages (dashboard, upload, etc.)

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Sparkles, Camera, User, LayoutDashboard, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/upload", label: "New Analysis", icon: Camera },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <nav className="border-b border-nude-200/60 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Sparkles className="w-5 h-5 text-blush-500" />
          <span className="font-display text-xl font-semibold tracking-tight">GlowUp</span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                pathname === href
                  ? "bg-blush-100 text-blush-700"
                  : "text-nude-600 hover:text-gray-900 hover:bg-nude-100"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </div>

        {/* User info + sign out */}
        <div className="flex items-center gap-3">
          {user && (
            <span className="text-sm text-nude-500 hidden md:block">
              {user.email}
            </span>
          )}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-sm text-nude-600 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:block">Sign out</span>
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden border-t border-nude-100 px-4 py-2 flex justify-around">
        {navLinks.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              pathname === href
                ? "text-blush-600"
                : "text-nude-500 hover:text-gray-700"
            )}
          >
            <Icon className="w-5 h-5" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
