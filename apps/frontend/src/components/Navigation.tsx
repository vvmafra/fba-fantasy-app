import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, FileText, MessageSquare, UserCheck, BarChart3, Home } from 'lucide-react';

interface NavigationProps {
  teamId?: string;
  isAdmin: boolean;
}

const Navigation = ({ teamId, isAdmin }: NavigationProps) => {
  const location = useLocation();
  
  const tabs = [
    { id: 'home', label: 'Home', icon: Home, path: `/team/${teamId}/wall` },
    { id: 'team', label: 'Meu Time', icon: Users, path: `/team/${teamId}/myteam` },
    { id: 'draft', label: 'Draft', icon: UserCheck, path: `/team/${teamId}/free-agents` },
    { id: 'trades', label: 'Trades', icon: MessageSquare, path: `/team/${teamId}/trades` },
    { id: 'stats', label: 'Estatísticas', icon: BarChart3, path: `/team/${teamId}/statistics` },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;
          
          return (
            <Link
              key={tab.id}
              to={tab.path}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                isActive 
                  ? 'text-nba-blue bg-blue-50' 
                  : 'text-gray-600 hover:text-nba-blue hover:bg-gray-50'
              }`}
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
