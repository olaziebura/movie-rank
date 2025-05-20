"use client";

import { useState, type JSX } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Home,
  Info,
  Phone,
  Settings,
  Heart,
  User,
  Film,
  Power,
  PowerOff,
} from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import type { SessionData } from "@auth0/nextjs-auth0/types";

type SidebarProps = {
  session: SessionData | null;
};

type SidebarLinkProps = {
  href: string;
  icon: JSX.Element;
  label?: string;
  isExpanded: boolean;
};

export const Sidebar = ({ session }: SidebarProps) => {
  const [expanded, setExpanded] = useState(false);
  const isAuthenticated = !!session;
  console.log(session?.user);
  // Links for authenticated users
  const authenticatedLinks = [
    { href: "/wishlist", label: "My wishlist", icon: <Heart /> },
    { href: "/settings", label: "Settings", icon: <Settings /> },
    {
      label: "My profile",
      href: "/profile",
      icon: !session?.user.picture ? (
        <User />
      ) : (
        <Image
          width={20}
          height={20}
          src={session.user.picture}
          alt="User profile picture"
          className="min-w-6 min-h-6 rounded-2xl"
        />
      ),
    },
  ];

  // Links for non-authenticated users
  const unauthenticatedLinks = [
    { href: "/", label: "Home", icon: <Home /> },
    { href: "/movies/popular", label: "Popular now", icon: <Film /> },
  ];

  // Common links hidden under the "About" dropdown
  const commonLinks = [
    { href: "/about", label: "About us", icon: Info },
    { href: "/contact", label: "Contact us", icon: Phone },
    { href: "/help", label: "Help", icon: Info },
    { href: "/terms", label: "Terms of service", icon: Info },
    { href: "/privacy", label: "Privacy policy", icon: Info },
  ];

  // Auth button based on authentication status
  const authButton = isAuthenticated
    ? { href: "/auth/logout", label: "Log out", icon: <PowerOff /> }
    : { href: "/auth/login", label: "Log in", icon: <Power /> };

  const SidebarLink = ({ href, icon, label, isExpanded }: SidebarLinkProps) => (
    <Link href={href} className="flex items-center gap-4 px-2 py-2 ml-2">
      <div className="min-w-5">{icon}</div>
      {
        <span
          className={cn(
            "whitespace-nowrap overflow-hidden opacity-0 w-full transition-all duration-300",
            {
              "opacity-100": isExpanded,
            }
          )}
        >
          {label}
        </span>
      }
    </Link>
  );

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={cn(
        "z-100 fixed group flex flex-col bg-accent-500 text-neutral-800 font-medium h-screen max-w-14 py-4",
        "transition-all duration-300",
        { "max-w-40": expanded }
      )}
    >
      {unauthenticatedLinks.map((link) => (
        <SidebarLink
          key={link.href}
          href={link.href}
          icon={link.icon}
          label={link.label}
          isExpanded={expanded}
        />
      ))}

      <NavigationMenu className="mt-4">
        <NavigationMenuList>
          <NavigationMenuItem>
            {/* <NavigationMenuTrigger className="flex items-center gap-2 bg-transparent px-2 py-2 hover:bg-accent-200">
              <Info className="w-5 h-5" />
              {expanded && <span>About</span>}
            </NavigationMenuTrigger> */}
            <NavigationMenuContent>
              <ul className="flex flex-col w-44 gap-1 p-3 bg-white rounded-md">
                {commonLinks.map((link) => (
                  <li key={link.href}>
                    <NavigationMenuLink asChild>
                      <SidebarLink
                        href={link.href}
                        icon={<link.icon className="w-5 h-5" />}
                        label={link.label}
                        isExpanded={expanded}
                      />
                    </NavigationMenuLink>
                  </li>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      {isAuthenticated && (
        <div className="mt-4 flex flex-col">
          {authenticatedLinks.map((link) => (
            <SidebarLink
              key={link.href}
              href={link.href}
              icon={link.icon}
              label={link.label}
              isExpanded={expanded}
            />
          ))}
        </div>
      )}

      <SidebarLink
        href={authButton.href}
        icon={authButton.icon}
        label={authButton.label}
        isExpanded={expanded}
      />
    </aside>
  );
};
