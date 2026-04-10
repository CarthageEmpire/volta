import { Screen } from '../types';

interface TopAppBarProps {
  title: string;
  onBack?: () => void;
  showProfile?: boolean;
}

export default function TopAppBar({ title, onBack, showProfile = true }: TopAppBarProps) {
  return (
    <header className="w-full sticky top-0 z-50 bg-[#f8f9fb]/70 backdrop-blur-xl flex items-center justify-between px-6 py-4 tonal-shift-no-border">
      <div className="flex items-center gap-4">
        {onBack && (
          <button 
            onClick={onBack}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-200/50 transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-[#0056D2]">arrow_back</span>
          </button>
        )}
        <h1 className="font-headline font-bold tracking-tight text-2xl text-on-surface">{title}</h1>
      </div>
      
      {showProfile && (
        <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-high border-2 border-primary/10">
          <img 
            alt="User Profile" 
            className="w-full h-full object-cover" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDZYtqQ_aml8XawY2ycM7W8RJEw0YifxSOWJ1sGgypWUCYR-TcTv4llsZbqGalDnbF-EtsSiSD-DrnqBqJQ30N-tzli8mjrmbEfVWmsb1elDGGGmAQbVuUGMtwGm_ngcLH7gdX_QiWxUf3JobmTXyWDvRIpt004zmc_ekDQoQWIWrlFkJDlCpCoAmtoN_IEq8sxTD1USxLCK1jbeUEU-ReCEwmYBwP7mMLadi8Qj_KUH0tjO1PSgYBg4EEGz9QBpLS3-rJJ4nkoMQIM"
            referrerPolicy="no-referrer"
          />
        </div>
      )}
    </header>
  );
}
