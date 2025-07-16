import React from 'react';
import { Bell, Settings, Crown, Users, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import AdminMenu from './AdminMenu';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

interface HeaderProps {
  userTeam: string;
  userTeamOwner: string;
  isAdmin: boolean;
  notifications: number;
  userTeamLogo: string;
}

const Header = ({ userTeam, userTeamOwner, isAdmin, notifications, userTeamLogo }: HeaderProps) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const isMobile = useIsMobile();

  const handleLogout = () => {
    if (confirm('Tem certeza que deseja sair?')) {
      logout();
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-nba-dark text-white z-40 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
            <img src={`/images/${userTeamLogo}`} alt="logo" className="w-12 h-12"/>
          <div>
            <h1 className="font-bold text-lg">FBA League 2K25</h1>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => navigate('/teams')}
                className="w-auto whitespace-nowrap text-sm text-gray-300 hover:text-white transition-colors cursor-pointer"
                title="Clique para trocar de time"
              >
                {userTeam}
              </button>
              {isAdmin && !isMobile && (
                <Badge variant="secondary" className="bg-nba-orange text-white">
                  <Crown size={12} className="mr-1" />
                  Admin
                </Badge>
              )}

              {isAdmin && isMobile && (
                <Badge variant="secondary" className="bg-nba-orange text-white">
                  <Crown size={12} className="mr-1" />

                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/teams')}
            className="flex items-center gap-1"
            title="Trocar de time"
          >
            <Users size={16} />
            <span className="hidden sm:inline">Trocar Time</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
            className="flex items-center gap-1 text-red-400 hover:text-red-300"
            title="Sair da conta"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Sair</span>
          </Button>

          {/* <Button variant="ghost" size="sm" className="relative">
            <Bell size={20} />
            {notifications > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {notifications}
              </Badge>
            )}
          </Button> */}
          <AdminMenu>
            <Button variant="ghost" size="sm">
              <Settings size={20} />
            </Button>
          </AdminMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
