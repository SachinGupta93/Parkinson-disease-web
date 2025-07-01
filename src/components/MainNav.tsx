import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { logout } from '../services/auth';
import { UserContext } from '@/App';
import { useContext } from 'react';
import {
  HeartPulse,
  BarChart3,
  LineChart,
  BookOpen,
  History,
  Sun,
  Moon,
  UserCircle,
  LogIn,
  LogOut,
  UserPlus,
  Menu,
  Info,
  BarChart4, // For multi-model analysis
  Network, // For multi-model analysis
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const MainNav = () => {
  const navigate = useNavigate();
  const { user, theme, setTheme } = useContext(UserContext);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navLinks = [
    { to: '/app/dashboard', icon: BarChart3, label: 'Dashboard' },
    { to: '/app/analysis', icon: LineChart, label: 'Voice Analysis' },
    { to: '/app/multi-model-analysis', icon: Network, label: 'Multi-Model Analysis' },
    { to: '/app/history', icon: History, label: 'History' },
    { to: '/resources', icon: BookOpen, label: 'Resources' },
    { to: '/app/about', icon: Info, label: 'About' },
  ];

  return (
    <nav className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-zinc-200/50 dark:border-zinc-800/50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and App Name */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2"
          >
            <HeartPulse className="text-purple-600 dark:text-purple-400 w-7 h-7" />
            <Link
              to={user ? "/app/dashboard" : "/"}
              className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-teal-500 dark:from-purple-400 dark:to-teal-300 bg-clip-text text-transparent hover:opacity-80 transition-opacity duration-200"
            >
              Parkinson Insight
            </Link>
          </motion.div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200"
                )}
              >
                <link.icon size={18} />
                <span>{link.label}</span>
              </Link>
            ))}
          </div>

          {/* Right Side: Theme Toggle & User Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center space-x-4"
          >
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun size={18} className="text-yellow-400" />
              ) : (
                <Moon size={18} className="text-purple-600" />
              )}
            </Button>

            {/* Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col gap-4 mt-8">
                  {navLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2 text-lg text-zinc-600 dark:text-zinc-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200"
                    >
                      <link.icon size={20} />
                      <span>{link.label}</span>
                    </Link>
                  ))}
                  {/* User actions in mobile menu */}
                  <div className="mt-auto pt-4 border-t border-zinc-200 dark:border-zinc-700">
                    {user ? (
                      <div className="flex flex-col gap-4">
                        <Link 
                            to="/app/account" 
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-2 text-lg text-zinc-600 dark:text-zinc-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200"
                        >
                            <UserCircle size={20} /> 
                            <span>{user.name || user.email}</span>
                        </Link>
                        <Button
                          onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                          variant="default"
                          className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"
                        >
                          <LogOut size={18} className="mr-2" />
                          Logout
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button variant="outline" className="w-full border-purple-600 text-purple-600 hover:bg-purple-50 dark:border-purple-400 dark:text-purple-400 dark:hover:bg-purple-900/20">
                            <UserPlus size={18} className="mr-2" />
                            Sign Up
                          </Button>
                        </Link>
                        <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button variant="default" className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600">
                            <LogIn size={18} className="mr-2" />
                            Sign In
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>

            {/* User Actions Desktop */}
            {user ? (
              <div className="hidden md:flex items-center gap-4">
                 <Link to="/app/account" className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200">
                    <UserCircle size={18} />
                    <span className="max-w-[150px] truncate hidden lg:inline">{user.name || user.email}</span>
                </Link>
                <Button
                  onClick={handleLogout}
                  variant="default"
                  className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"
                >
                  <LogOut size={16} className="mr-1 md:mr-2" /> 
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/signup">
                  <Button variant="outline" className="border-purple-600 text-purple-600 hover:bg-purple-50 dark:border-purple-400 dark:text-purple-400 dark:hover:bg-purple-900/20">
                    <UserPlus size={16} className="mr-1 md:mr-2" />
                    <span className="hidden sm:inline">Sign Up</span>
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="default" className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600">
                    <LogIn size={16} className="mr-1 md:mr-2" />
                    <span className="hidden sm:inline">Sign In</span>
                  </Button>
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </nav>
  );
};

export default MainNav;
