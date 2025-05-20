import Link from "next/link";

export const NavLink = ({
  href,
  children,
  icon: Icon,
}: {
  href: string;
  children: React.ReactNode;
  icon?: React.ElementType;
}) => (
  <Link href={href} className="hover:text-gray-900 flex items-center gap-2">
    {Icon && <Icon size={18} />}
    {children}
  </Link>
);
