import { useState } from 'react';

export interface DocSection {
  key: string;
  label: string;
  content: React.ReactNode;
}

interface ServiceDocLayoutProps {
  title: string;
  badge?: string;
  badgeColor?: string;
  sections: DocSection[];
}

export function ServiceDocLayout({ title, badge, badgeColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20', sections }: ServiceDocLayoutProps) {
  const [activeSection, setActiveSection] = useState(sections[0]?.key ?? '');

  const current = sections.find((s) => s.key === activeSection);

  return (
    <div className="h-full flex">
      {/* Sub navigation */}
      <div className="shrink-0 w-44 bg-[#080e1a] border-r border-gray-800/60 flex flex-col py-4 px-3 gap-1">
        <div className="px-2 mb-3">
          <div className="text-base font-bold text-gray-200">{title}</div>
          {badge && (
            <span className={`inline-block text-[11px] font-semibold px-1.5 py-0.5 rounded border mt-1.5 ${badgeColor}`}>
              {badge}
            </span>
          )}
        </div>
        <div className="space-y-0.5">
          {sections.map((section) => {
            const isActive = activeSection === section.key;
            return (
              <button
                key={section.key}
                onClick={() => setActiveSection(section.key)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gray-800/60 text-gray-200 border-l-2 border-amber-500'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/30'
                }`}
              >
                {section.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6">
        {current?.content}
      </div>
    </div>
  );
}

/* Reusable content blocks for service docs */

export function DocHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-bold text-gray-200 mb-4">{children}</h3>;
}

export function DocParagraph({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-400 leading-relaxed mb-4">{children}</p>;
}

export function DocCode({ title, language, children }: { title?: string; language?: string; children: string }) {
  return (
    <div className="mb-4">
      {title && <div className="text-[11px] text-gray-500 font-mono mb-1">{title}</div>}
      <pre className="bg-[#080e1a] border border-gray-800/60 rounded-lg p-4 text-xs font-mono text-gray-300 overflow-x-auto">
        {language && <div className="text-[10px] text-gray-600 mb-2">{language}</div>}
        {children}
      </pre>
    </div>
  );
}

export function DocCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#0d1628] border border-gray-800/60 rounded-lg p-4 mb-4">
      <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{title}</div>
      {children}
    </div>
  );
}

export function DocPlaceholder({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center h-40 border border-dashed border-gray-700 rounded-lg">
      <span className="text-sm text-gray-600">{text}</span>
    </div>
  );
}
