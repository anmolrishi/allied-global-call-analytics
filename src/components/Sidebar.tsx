import { BarChart2, FileAudio, Home, Settings, Upload } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Upload Calls', href: '/upload', icon: Upload },
  { name: 'Call Library', href: '/library', icon: FileAudio },
  { name: 'Analysis Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow pt-5 bg-white overflow-y-auto">
        <div className="flex-grow flex flex-col">
          <nav className="flex-1 px-2 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                    {
                      'bg-gray-100 text-gray-900': isActive,
                      'text-gray-600 hover:bg-gray-50 hover:text-gray-900':
                        !isActive,
                    }
                  )
                }
              >
                <item.icon
                  className="mr-3 h-6 w-6 flex-shrink-0 text-gray-400 group-hover:text-gray-500"
                  aria-hidden="true"
                />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}