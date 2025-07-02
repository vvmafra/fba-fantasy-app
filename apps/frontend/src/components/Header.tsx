
import React from 'react';
import { Bell, Settings, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface HeaderProps {
  userTeam: string;
  isAdmin: boolean;
  notifications: number;
}

const Header = ({ userTeam, isAdmin, notifications }: HeaderProps) => {

  console.log(isAdmin);
  
  return (
    <header className="fixed top-0 left-0 right-0 bg-nba-dark text-white z-40 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-nba-orange rounded-full flex items-center justify-center">
            <span className="font-bold text-sm">NBA</span>
          </div>
          <div>
            <h1 className="font-bold text-lg">FBA League 2K25</h1>
            <div className="flex items-center space-x-2">
              <p className="text-sm text-gray-300">{userTeam}</p>
              {isAdmin && (
                <Badge variant="secondary" className="bg-nba-orange text-white">
                  <Crown size={12} className="mr-1" />
                  Admin
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="relative">
            <Bell size={20} />
            {notifications > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {notifications}
              </Badge>
            )}
          </Button>
          <Button variant="ghost" size="sm">
            <Settings size={20} />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
