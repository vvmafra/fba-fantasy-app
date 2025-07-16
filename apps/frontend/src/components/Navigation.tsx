import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, FileText, MessageSquare, UserCheck, BarChart3, Home } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface NavigationProps {
  isAdmin: boolean;
}

const Navigation = ({ isAdmin }: NavigationProps) => {
  const location = useLocation();
  const { teamId } = useAuth();
  
  const tabs = [
    { id: 'home', label: 'Home', icon: Home, path: teamId ? `/team/${teamId}/wall` : '/' },
    { id: 'team', label: 'Time', icon: Users, path: teamId ? `/team/${teamId}/myteam` : '#' },
    // { id: 'draft', label: 'Draft', icon: UserCheck, path: `/team/${teamId}/free-agents` },
    { id: 'trades', label: 'Trades', icon: MessageSquare, path: teamId ? `/team/${teamId}/trades` : '#' },
    { id: 'stats', label: 'Estatísticas', icon: BarChart3, path: teamId ? `/team/${teamId}/statistics` : '#' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;
          const isDisabled = !teamId && tab.id !== 'home';
          
          return (
            <Link
              key={tab.id}
              to={tab.path}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                isDisabled 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : isActive 
                    ? 'text-nba-blue bg-blue-50' 
                    : 'text-gray-600 hover:text-nba-blue hover:bg-gray-50'
              }`}
              onClick={isDisabled ? (e) => e.preventDefault() : undefined}
            >
              <Icon size={20} />
              <span className="text-xs mt-1 font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;
