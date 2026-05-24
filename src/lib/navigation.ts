export type NavigationIcon =
  | "Gift"
  | "Layers3"
  | "LayoutDashboard"
  | "ShoppingCart"
  | "Trophy"
  | "Users";

export type NavigationItem = {
  href: string;
  icon: NavigationIcon;
  label: string;
};

export const publicNavigation: NavigationItem[] = [
  { href: "/ranking", icon: "Trophy", label: "Ranking" },
  { href: "/premios", icon: "Gift", label: "Prêmios" },
];

export const adminNavigation: NavigationItem[] = [
  { href: "/admin/dashboard", icon: "LayoutDashboard", label: "Dashboard" },
  { href: "/admin/compras", icon: "ShoppingCart", label: "Compras" },
  { href: "/admin/clientes", icon: "Users", label: "Clientes" },
  { href: "/admin/ranking", icon: "Trophy", label: "Ranking" },
  { href: "/admin/niveis", icon: "Layers3", label: "Níveis" },
  { href: "/admin/premios", icon: "Gift", label: "Prêmios" },
];
