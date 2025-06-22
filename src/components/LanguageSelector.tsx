import { X } from 'lucide-react';
import { Button } from './ui/Button';

interface LanguageSelectorProps {
  onSelect: (language: 'en' | 'es') => void;
  onClose: () => void;
  title?: string;
}

export default function LanguageSelector({ onSelect, onClose, title = 'Select Analysis Language' }: LanguageSelectorProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">{title}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="hover:bg-gray-100 rounded-full p-2"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Choose the language for analyzing the call transcription:
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => {
              onSelect('en');
              onClose();
            }}
            className="w-full"
          >
            English
          </Button>
          <Button
            onClick={() => {
              onSelect('es');
              onClose();
            }}
            className="w-full"
          >
            Spanish
          </Button>
        </div>
      </div>
    </div>
  );
}