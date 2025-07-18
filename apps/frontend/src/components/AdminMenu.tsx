import React from 'react';
import { 
  Users, 
  Shield, 
  Calendar, 
  Trophy, 
  Award, 
  BarChart3, 
  FileText, 
  Plus,
  Settings,
  MessageSquare,
  Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetClose
} from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AdminMenuProps {
  children: React.ReactNode;
}

const AdminMenu = ({ children }: AdminMenuProps) => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  // Se não for admin, não renderiza nada
  if (!isAdmin) {
    return null;
  }

  const adminOptions = [
    {
      title: 'Gerenciamento da Liga',
      items: [
        {
          icon: Users,
          label: 'Usuários',
          description: 'Gerenciar usuários da liga',
          href: '/admin/users'
        },
        {
          icon: Shield,
          label: 'Times',
          description: 'Editar times e proprietários',
          href: '/admin/teams'
        },
        {
          icon: Calendar,
          label: 'Temporadas',
          description: 'Gerenciar temporadas e CAP',
          href: '/admin/seasons'
        }
      ]
    },
    {
      title: 'Formulários e Dados',
      items: [
        {
          icon: MessageSquare,
          label: 'Trades',
          description: 'Visualizar trades',
          href: '/admin/trades'
        },
        {
          icon: FileText,
          label: 'Rosters da Temporada',
          description: 'Visualizar todos os rosters',
          href: '/admin/rosters-season'
        },
        {
          icon: FileText,
          label: 'Rosters Playoffs',
          description: 'Visualizar rosters playoffs',
          href: '/admin/rosters-playoffs'
        },
        {
          icon: Plus,
          label: 'Jogadores e Draft',
          description: 'Gerenciar jogadores e draft',
          href: '/admin/draft-picks'
        }       
      ]
    },
    {
      title: 'Estatísticas e Rankings',
      items: [
        {
          icon: Award,
          label: 'Premiações jogadores',
          description: 'Gerenciar premiações individuais',
          href: '/admin/awards'
        },
        {
          icon: BarChart3,
          label: 'Classificação dos Times',
          description: 'Posição e eliminação dos times',
          href: '/admin/standings'
        }
      ]
    }
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent side="right" className="w-[90%] sm:w-[450px] overflow-y-auto">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <Crown className="h-6 w-6 text-nba-orange" />
            Painel Administrativo
          </SheetTitle>
        </SheetHeader>
        
        <div className="py-6 space-y-8">
          {adminOptions.map((section, sectionIndex) => (
            <div key={sectionIndex} className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                {section.title}
              </h3>
              
              <div className="space-y-3">
                {section.items.map((item, itemIndex) => (
                  <SheetClose asChild key={itemIndex}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-auto p-4 text-left hover:bg-gray-50"
                      onClick={() => {
                        navigate(item.href);
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <item.icon className="h-5 w-5 text-nba-orange" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900">
                            {item.label}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {item.description}
                          </div>
                        </div>
                      </div>
                    </Button>
                  </SheetClose>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AdminMenu; 