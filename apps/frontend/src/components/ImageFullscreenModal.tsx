import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageFullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
  description?: string;
}

const ImageFullscreenModal = ({ 
  isOpen, 
  onClose, 
  imageUrl, 
  title, 
  description 
}: ImageFullscreenModalProps) => {
  const [scale, setScale] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);

  // Reset zoom and rotation when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setScale(1);
      setRotation(0);
    }
  }, [isOpen]);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.25));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleReset = () => {
    setScale(1);
    setRotation(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case '+':
      case '=':
        e.preventDefault();
        handleZoomIn();
        break;
      case '-':
        e.preventDefault();
        handleZoomOut();
        break;
      case 'r':
        e.preventDefault();
        handleRotate();
        break;
      case '0':
        e.preventDefault();
        handleReset();
        break;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-0"
        onKeyDown={handleKeyDown}
      >
        {/* Header com controles */}
        {/* <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between bg-black/50 backdrop-blur-sm rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleZoomOut}
              className="bg-white/20 hover:bg-white/30 text-white border-0"
            >
              <ZoomOut size={16} />
            </Button>
            <span className="text-white text-sm font-medium">
              {Math.round(scale * 100)}%
            </span>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleZoomIn}
              className="bg-white/20 hover:bg-white/30 text-white border-0"
            >
              <ZoomIn size={16} />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleRotate}
              className="bg-white/20 hover:bg-white/30 text-white border-0"
            >
              <RotateCw size={16} />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleReset}
              className="bg-white/20 hover:bg-white/30 text-white border-0"
            >
              Reset
            </Button>
          </div>
          
          <Button
            size="sm"
            variant="secondary"
            onClick={onClose}
            className="bg-white/20 hover:bg-white/30 text-white border-0"
          >
            <X size={16} />
          </Button>
        </div> */}
        

        {/* Container da imagem */}
        <div className="w-full h-full flex items-center justify-center overflow-hidden">
          <div className="relative">
            <img
              src={imageUrl}
              alt={title || 'Imagem em tela cheia'}
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg)`,
              }}
              draggable={false}
            />
          </div>
        </div>

        {/* Footer com informações */}
        {/* {(title || description) && (
          <div className="absolute bottom-4 left-4 right-4 z-50 bg-black/50 backdrop-blur-sm rounded-lg p-3">
            {title && (
              <h3 className="text-white font-semibold text-lg">{title}</h3>
            )}
            {description && (
              <p className="text-white/80 text-sm mt-1">{description}</p>
            )}
          </div>
        )} */}

        {/* Atalhos de teclado */}
        {/* <div className="absolute bottom-4 right-4 z-50 bg-black/50 backdrop-blur-sm rounded-lg p-2 text-white/60 text-xs">
          <div>ESC: Fechar</div>
          <div>+/-: Zoom</div>
          <div>R: Rotacionar</div>
          <div>0: Reset</div>
        </div> */}
      </DialogContent>
    </Dialog>
  );
};

export default ImageFullscreenModal; 