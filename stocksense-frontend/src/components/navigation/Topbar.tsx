import { Menu, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface TopbarProps {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { user } = useAuth();

  return (
    <header className="flex-shrink-0 flex h-16 bg-white border-b border-gray-200">
      <button
        onClick={onMenuClick}
        className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden"
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>
      <div className="flex-1 px-4 flex justify-between sm:px-6 md:px-8">
        <div className="flex-1 flex items-center">
          {/* Global search could go here in future */}
        </div>
        <div className="ml-4 flex items-center gap-4">
          <button className="p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 rounded-full">
            <span className="sr-only">View notifications</span>
            <Bell className="h-6 w-6" aria-hidden="true" />
          </button>

          {/* Profile dropdown stub */}
          <div className="flex items-center gap-3">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-900 leading-none">{user?.name}</p>
              <p className="text-xs text-gray-500 mt-1">{user?.role}</p>
            </div>
            <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
