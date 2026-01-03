"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SearchBar } from "@/components/SearchBar";
import Link from "next/link";
import {
  Search,
  Heart,
  Settings,
  User,
  LogIn,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type TopbarProps = {
  session: unknown;
};

type NavigationLink = {
  href: string;
  icon: React.ElementType;
  label: string;
};

export const Topbar = ({ session }: TopbarProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  const isAuthenticated = !!session;

  const authenticatedLinks: NavigationLink[] = [
    {
      href: "/search",
      icon: Search,
      label: "Search",
    },
    {
      href: "/wishlists",
      icon: Heart,
      label: "Wishlists",
    },
    {
      href: "/settings",
      icon: Settings,
      label: "Settings",
    },
    {
      href: "/profile",
      icon: User,
      label: "Profile",
    },
  ];

  const unauthenticatedLinks: NavigationLink[] = [
    {
      href: "/search",
      icon: Search,
      label: "Search",
    },
  ];

  const authButton = isAuthenticated
    ? {
        href: "/api/auth/logout",
        icon: LogOut,
        label: "Logout",
      }
    : {
        href: "/api/auth/login",
        icon: LogIn,
        label: "Login",
      };

  const displayLinks = isAuthenticated
    ? authenticatedLinks
    : unauthenticatedLinks;

  const handleSearchStart = () => {
    // Optional: handle search start
  };

  const handleSearchComplete = () => {
    // Search complete - results will be shown on the dropdown
    // No need to redirect here, as the SearchBar handles it internally
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-accent-500 text-neutral-800 shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo/Brand */}
            <div className="flex items-center gap-8">
              <Link href="/" className="text-xl font-bold hover:text-neutral-600">
                MovieVote
              </Link>

              {/* Desktop Navigation Links */}
              <div className="hidden md:flex items-center gap-1">
                {displayLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent-400 transition-colors"
                  >
                    <link.icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{link.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-xl">
              <SearchBar
                placeholder="Search for movies..."
                className="w-full"
                onSearchStart={handleSearchStart}
                onSearchComplete={handleSearchComplete}
              />
            </div>

            {/* Auth Button & Mobile Menu Toggle */}
            <div className="flex items-center gap-2">
              {/* Desktop Auth Button */}
              <Link
                href={authButton.href}
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-md bg-neutral-800 text-white hover:bg-neutral-700 transition-colors"
              >
                <authButton.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{authButton.label}</span>
              </Link>

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-accent-500 border-t border-neutral-300">
            <div className="container mx-auto px-4 py-4 space-y-4">
              {/* Mobile Search Bar */}
              <div className="w-full">
                <SearchBar
                  placeholder="Search for movies..."
                  className="w-full"
                  onSearchStart={handleSearchStart}
                  onSearchComplete={handleSearchComplete}
                />
              </div>

              {/* Mobile Navigation Links */}
              <div className="flex flex-col space-y-2">
                {displayLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent-400 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <link.icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{link.label}</span>
                  </Link>
                ))}

                {/* Mobile Auth Button */}
                <Link
                  href={authButton.href}
                  className="flex items-center gap-2 px-3 py-2 rounded-md bg-neutral-800 text-white hover:bg-neutral-700 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <authButton.icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{authButton.label}</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Spacer to prevent content from being hidden under fixed navbar */}
      <div className="h-16" />
    </>
  );
};
