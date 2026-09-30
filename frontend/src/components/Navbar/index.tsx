import { Menu, X, Image, Code2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSidebarHandler } from "@/providers/SidebarProvider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState } from "react";
import { useAuth } from "@/providers/AuthenticationProvider";
import { Link, useLocation } from "react-router-dom";
import BaseUrl from "@/consts/baseUrl";
import Sidebar from "@/components/Sidebar";
import ThemeToggle from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const { logout } = useAuth();
  const { isOpen, toggle } = useSidebarHandler();
  const location = useLocation();

  const [openPopover, setPopover] = useState(false);

  const navItems = [
    { label: "Trang chủ", href: BaseUrl.Homepage, icon: Image },
    { label: "API Docs", href: "/api-docs", icon: Code2 },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 xs:h-16 items-center justify-between gap-4 px-3 xs:px-6">
        <div className="flex items-center gap-4">
          <Popover open={isOpen} onOpenChange={toggle}>
            <PopoverTrigger asChild>
              {isOpen ? (
                <X className="h-5 w-5 hover:cursor-pointer text-muted-foreground" />
              ) : (
                <Menu className="h-5 w-5 hover:cursor-pointer text-muted-foreground" />
              )}
            </PopoverTrigger>
            <PopoverContent className="mt-2 w-auto border-0 p-0" side="bottom" align="start">
              <Sidebar forMobile />
            </PopoverContent>
          </Popover>

          <Link to={BaseUrl.Homepage} className="flex items-center gap-2" aria-label="Base64 Converter Home">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Code2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="hidden xs:block font-bold text-lg">Base64 Converter</span>
          </Link>
        </div>

        <div className="hidden xs:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          <Popover open={openPopover} onOpenChange={setPopover}>
            <PopoverTrigger asChild>
              <div className="flex items-center gap-2 rounded-lg p-1 hover:bg-accent transition-colors cursor-pointer">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://github.com/shadcnee.png" alt="User avatar" />
                  <AvatarFallback>D</AvatarFallback>
                </Avatar>
                <div className="hidden xs:block text-left">
                  <p className="text-sm font-medium leading-none">donezombie</p>
                  <p className="text-xs leading-none text-muted-foreground">donezombie@gmail.com</p>
                </div>
              </div>
            </PopoverTrigger>
            <PopoverContent className="mr-2 mt-2 flex max-w-[200px] flex-col p-1" side="bottom" align="end">
              {[
                {
                  label: "Đổi mật khẩu",
                  href: BaseUrl.ChangePassword,
                  function: () => {
                    setPopover(false);
                  },
                },
                {
                  label: "Đăng xuất",
                  function: () => {
                    setPopover(false);
                    logout();
                  },
                },
              ].map((f) => {
                if (f.href) {
                  return (
                    <Link
                      to={f.href}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors"
                      key={f.label}
                      onClick={f.function}
                    >
                      {f.label}
                    </Link>
                  );
                }

                return (
                  <button
                    onClick={f.function}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left rounded-lg hover:bg-accent transition-colors"
                    key={f.label}
                  >
                    {f.label}
                  </button>
                );
              })}
            </PopoverContent          </Popover>
        </div>
      </div>
    </nav>
  );
}