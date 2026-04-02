interface HelpButtonProps {
  onClick: () => void;
}

export default function HelpButton({ onClick }: HelpButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label="Open support"
      className="fixed bottom-20 right-4 w-11 h-11 bg-blue-600 text-white rounded-full shadow-md hover:shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center text-lg z-30"
    >
      💬
    </button>
  );
}
