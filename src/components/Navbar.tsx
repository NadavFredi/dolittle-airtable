import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { MessageCircle, LogOut, RefreshCcw, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import easyflowLogo from '@/assets/easyflow-site-logo.png'

interface NavbarProps {
    totalCount: number
    onRefresh?: () => void
    refreshing?: boolean
    onMessagingClick?: () => void
    showMessagingButton?: boolean
}

const Navbar: React.FC<NavbarProps> = ({
    totalCount,
    onRefresh,
    refreshing,
    onMessagingClick,
    showMessagingButton = true
}) => {
    const { signOut } = useAuth()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const handleCloseMobileMenu = () => setMobileMenuOpen(false)
    const handleSignOut = () => {
        signOut()
        setMobileMenuOpen(false)
    }

    return (
        <>
            <nav className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center justify-between">
                        {/* Logo - Always visible */}
                        <Link to="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity cursor-pointer no-underline">
                            <img
                                src={easyflowLogo}
                                alt="EasyFlow logo"
                                className="h-8 sm:h-10 w-auto object-contain"
                                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                    const target = e.target as HTMLImageElement;
                                    console.error('Logo failed to load:', target.src);
                                    target.src = '/easyflow-logo.png';
                                }}
                            />
                            <div className="hidden sm:block">
                                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Dolittle</h1>
                                <p className="text-xs sm:text-sm text-gray-500">ניהול הרשמות</p>
                            </div>
                        </Link>

                        {/* Desktop Navigation Links */}
                        <div className="hidden lg:flex items-center gap-6">
                            <NavLink
                                to="/"
                                className={({ isActive }) =>
                                    `px-4 py-2 rounded-lg font-medium transition-colors ${isActive
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'text-gray-700 hover:bg-gray-100'
                                    }`
                                }
                            >
                                מערכת דיוור
                            </NavLink>
                            <NavLink
                                to="/arrivals"
                                className={({ isActive }) =>
                                    `px-4 py-2 rounded-lg font-medium transition-colors ${isActive
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'text-gray-700 hover:bg-gray-100'
                                    }`
                                }
                            >
                                מערכת הגעות
                            </NavLink>
                        </div>

                        {/* Desktop Action Buttons */}
                        <div className="hidden md:flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-xs sm:text-sm font-medium text-gray-900">סה"כ הרשמות</p>
                                <p className="text-xl sm:text-2xl font-bold text-blue-600">{totalCount}</p>
                            </div>
                            <div className="w-px h-8 bg-gray-300"></div>

                            {/* WhatsApp Bulk Messaging Button - only show on messaging page */}
                            {showMessagingButton && onMessagingClick && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onMessagingClick}
                                    className="flex items-center gap-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    <span className="hidden lg:inline">שליחת הודעות</span>
                                </Button>
                            )}

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSignOut}
                                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden lg:inline">התנתק</span>
                            </Button>

                            {onRefresh && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onRefresh}
                                    disabled={refreshing}
                                    className="flex items-center gap-2"
                                >
                                    {refreshing ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                                    ) : (
                                        <RefreshCcw className="w-4 h-4" />
                                    )}
                                    <span className="hidden lg:inline">{refreshing ? 'מרענן...' : 'רענן'}</span>
                                </Button>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            aria-label="פתח תפריט"
                        >
                            <Menu className="w-6 h-6 text-gray-700" />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Drawer */}
            <div
                className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={handleCloseMobileMenu}
            >
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black bg-opacity-50" />

                {/* Drawer */}
                <div
                    className={`fixed inset-y-0 right-0 w-80 max-w-[85vw] bg-white shadow-xl transform transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
                    dir="rtl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Drawer Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">תפריט</h2>
                        <button
                            onClick={handleCloseMobileMenu}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            aria-label="סגור תפריט"
                        >
                            <X className="w-6 h-6 text-gray-700" />
                        </button>
                    </div>

                    {/* Drawer Content */}
                    <div className="overflow-y-auto h-full pb-20">
                        {/* Total Count */}
                        <div className="p-4 border-b border-gray-200">
                            <p className="text-sm font-medium text-gray-900 mb-1">סה"כ הרשמות</p>
                            <p className="text-3xl font-bold text-blue-600">{totalCount}</p>
                        </div>

                        {/* Navigation Links */}
                        <div className="p-4 border-b border-gray-200">
                            <nav className="space-y-2">
                                <NavLink
                                    to="/"
                                    onClick={handleCloseMobileMenu}
                                    className={({ isActive }) =>
                                        `block px-4 py-3 rounded-lg font-medium transition-colors ${isActive
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'text-gray-700 hover:bg-gray-100'
                                        }`
                                    }
                                >
                                    מערכת דיוור
                                </NavLink>
                                <NavLink
                                    to="/arrivals"
                                    onClick={handleCloseMobileMenu}
                                    className={({ isActive }) =>
                                        `block px-4 py-3 rounded-lg font-medium transition-colors ${isActive
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'text-gray-700 hover:bg-gray-100'
                                        }`
                                    }
                                >
                                    מערכת הגעות
                                </NavLink>
                            </nav>
                        </div>

                        {/* Action Buttons */}
                        <div className="p-4 space-y-2">
                            {showMessagingButton && onMessagingClick && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        onMessagingClick()
                                        handleCloseMobileMenu()
                                    }}
                                    className="w-full flex items-center justify-center gap-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    שליחת הודעות
                                </Button>
                            )}

                            {onRefresh && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        onRefresh()
                                    }}
                                    disabled={refreshing}
                                    className="w-full flex items-center justify-center gap-2"
                                >
                                    {refreshing ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                                    ) : (
                                        <RefreshCcw className="w-4 h-4" />
                                    )}
                                    {refreshing ? 'מרענן...' : 'רענן'}
                                </Button>
                            )}

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSignOut}
                                className="w-full flex items-center justify-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                                <LogOut className="w-4 h-4" />
                                התנתק
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Navbar

