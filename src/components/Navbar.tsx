import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, ShoppingCart, Menu, X, Heart } from 'lucide-react';
import Logo from '@/components/Logo';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { totalItems, wishlist } = useCart();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const navLinks = [
    { label: 'Home', to: '/' },
    { label: 'Shop', to: '/shop' },
    { label: 'Cart', to: '/cart' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-50 px-3 sm:px-6 pt-3">
      <div className="max-w-7xl mx-auto">
        <div className="bg-[#3D2B0E] rounded-2xl px-4 sm:px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <Logo className="h-11 w-11 rounded-xl object-cover" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-7">
            {navLinks.map(link => (
              <Link
                key={link.label}
                to={link.to}
                className="text-sm font-medium text-white/90 hover:text-white transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white/70 group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="bg-[#5A3F1A] rounded-full px-4 py-1.5 text-sm text-white placeholder-white/60 focus:outline-none w-40"
                />
                <button type="button" onClick={() => setSearchOpen(false)} className="text-white/90 hover:text-white p-1">
                  <X size={18} />
                </button>
              </form>
            ) : (
              <button onClick={() => setSearchOpen(true)} className="p-2 text-white/90 hover:text-white rounded-full hover:bg-white/10">
                <Search size={20} />
              </button>
            )}

            <Link
              to="/wishlist"
              className="relative p-2 text-white/90 hover:text-white rounded-full hover:bg-white/10 hidden sm:flex"
            >
              <Heart
                size={20}
                className={wishlist.length > 0 ? 'fill-rose-400 text-rose-400' : ''}
              />
              {wishlist.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {wishlist.length > 9 ? '9+' : wishlist.length}
                </span>
              )}
            </Link>

            <Link to={user ? '/account' : '/login'} className="relative p-2 text-white/90 hover:text-white rounded-full hover:bg-white/10 hidden sm:flex">
              <User size={20} />
              {user && (
                <span className="absolute -bottom-0.5 -right-0.5 bg-green-500 rounded-full w-2.5 h-2.5 ring-2 ring-black/30" />
              )}
            </Link>

            <Link to="/cart" className="relative p-2 text-white/90 hover:text-white rounded-full hover:bg-white/10">
              <ShoppingCart size={20} />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#C4A265] text-[#3D2B0E] text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Link>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 text-white/90 hover:text-white rounded-full hover:bg-white/10"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="bg-[#3D2B0E] rounded-2xl mt-2 px-6 py-4 lg:hidden">
            <nav className="flex flex-col gap-3">
              {navLinks.map(link => (
                <Link
                  key={link.label}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className="text-sm font-medium text-white/90 hover:text-white py-1"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
