import { NavLink } from "react-router-dom";
import { Home, LayoutDashboard, FileInput, Upload, BarChart3, User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

const Navbar = () => {
  const { currentUser, logout } = useAuth();

  const navItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Input", path: "/input", icon: FileInput },
    { name: "Upload", path: "/upload", icon: Upload },
    { name: "Visualization", path: "/visualization", icon: BarChart3 },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Successfully logged out!');
    } catch (error) {
      console.error('Failed to log out:', error);
      toast.error('Failed to log out');
    }
  };

  const getInitials = (displayName: string | null) => {
    if (!displayName) return 'U';
    return displayName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
      <div className="glass-effect px-6 py-3 rounded-full border border-white/20 backdrop-blur-xl shadow-2xl">
        <ul className="flex items-center gap-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg scale-105"
                      : "text-foreground/80 hover:text-foreground hover:bg-accent/50"
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">{item.name}</span>
              </NavLink>
            </li>
          ))}
          
          {/* User Menu */}
          <li className="ml-2">
            {currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 text-foreground/80 hover:text-foreground hover:bg-accent/50"
                  >
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs">
                        {getInitials(currentUser.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium hidden sm:inline">
                      {currentUser.displayName || 'User'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <NavLink to="/user" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </NavLink>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <NavLink
                to="/auth"
                className="flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 text-foreground/80 hover:text-foreground hover:bg-accent/50"
              >
                <User className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">Login</span>
              </NavLink>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
