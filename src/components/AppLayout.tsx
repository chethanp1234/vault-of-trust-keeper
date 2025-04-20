
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Navigate, Outlet, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarProvider, Sidebar, SidebarContent, SidebarTrigger } from "@/components/ui/sidebar";
import { User, File, Upload, FolderLock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: File },
  { name: 'Upload', href: '/upload', icon: Upload },
];

export const AppLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  // If user is not logged in, redirect to login page
  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1">
          <div className="flex justify-between items-center p-4 border-b">
            <div className="flex items-center">
              <SidebarTrigger variant="outline" />
              <h1 className="text-xl font-bold text-digilocker-800 ml-4">DigiLocker</h1>
            </div>
            
            <UserMenu user={user} logout={logout} />
          </div>
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

interface UserMenuProps {
  user: { name: string; email: string; avatar?: string };
  logout: () => void;
}

const UserMenu = ({ user, logout }: UserMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar>
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="bg-digilocker-200">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span>{user.name}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Profile</DropdownMenuItem>
        <DropdownMenuItem>Settings</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600">Logout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const AppSidebar = () => {
  const location = useLocation();
  
  return (
    <Sidebar>
      <div className="flex h-14 items-center px-4 border-b">
        <FolderLock className="h-6 w-6 text-sidebar-foreground" />
        <span className="ml-2 text-lg font-semibold text-sidebar-foreground">DigiLocker</span>
      </div>
      <SidebarContent className="p-2">
        <nav className="space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                location.pathname === item.href
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                "group flex items-center px-3 py-2 text-sm font-medium rounded-md"
              )}
            >
              <item.icon 
                className={cn(
                  "mr-3 flex-shrink-0 h-5 w-5",
                  location.pathname === item.href
                    ? "text-sidebar-accent-foreground"
                    : "text-sidebar-foreground"
                )}
              />
              {item.name}
            </Link>
          ))}
        </nav>
      </SidebarContent>
    </Sidebar>
  );
};
