interface HelpButtonProps {
  onClick: () => void;
}

export default function HelpButton({ onClick }: HelpButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label="Open support"
      title="Need help? Ask Boris!"
      className="fixed bottom-6 right-6 z-40 bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg hover:shadow-2xl hover:scale-110 hover:bg-blue-700 transition-all flex items-center justify-center"
    >
      <span className="text-xl">💬</span>
      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
    </button>
  );
}
