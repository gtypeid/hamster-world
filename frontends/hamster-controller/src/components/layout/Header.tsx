export function Header() {
  return (
    <header className="bg-dark-sidebar border-b border-dark-border">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-4xl animate-wiggle">🐹</span>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Hamster Controller
            </h1>
            <p className="text-xs text-accent-orange font-medium">
              Portfolio Hub & Infrastructure Control
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-200">Guest User</p>
            <p className="text-xs text-gray-400">Portfolio Viewer</p>
          </div>
          <a
            href="https://github.com/your-username/hamster-world"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-accent-orange text-white rounded-lg hover:bg-orange-600 transition-colors font-medium text-sm"
          >
            GitHub →
          </a>
        </div>
      </div>
    </header>
  );
}
