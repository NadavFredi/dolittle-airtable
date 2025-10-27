import { NavLink } from 'react-router-dom'
import { MessageCircle, LogOut, RefreshCcw } from 'lucide-react'
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

    return (
        <nav className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img
                            src={easyflowLogo}
                            alt="EasyFlow logo"
                            className="h-10 w-auto object-contain"
                            onError={(e) => {
                                console.error('Logo failed to load:', e.target.src);
                                e.target.src = '/easyflow-logo.png';
                            }}
                        />
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">Dolittle</h1>
                            <p className="text-sm text-gray-500">ניהול הרשמות</p>
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <div className="flex items-center gap-6">
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

                    {/* Action Buttons */}
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">סה"כ הרשמות</p>
                            <p className="text-2xl font-bold text-blue-600">{totalCount}</p>
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
                                שליחת הודעות
                            </Button>
                        )}

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => signOut()}
                            className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                            <LogOut className="w-4 h-4" />
                            התנתק
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
                                {refreshing ? 'מרענן...' : 'רענן'}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default Navbar

