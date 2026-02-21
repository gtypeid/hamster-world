import { useState, useEffect, useRef, type ReactNode } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-hcl';
import 'prismjs/themes/prism-tomorrow.css';

/* ── Keyword Highlight System ── */

interface HighlightRule {
  keyword: string;
  className: string;
}

const HIGHLIGHT_RULES: HighlightRule[] = [
  { keyword: '햄스터 월드', className: 'text-amber-400 font-semibold' },
  { keyword: 'Cash Gateway', className: 'text-amber-400 font-semibold' },
  { keyword: 'Payment Service', className: 'text-red-400 font-semibold' },
  { keyword: 'Ecommerce', className: 'text-blue-400 font-semibold' },
  { keyword: 'Progression', className: 'text-purple-400 font-semibold' },
  { keyword: 'Notification', className: 'text-teal-400 font-semibold' },
  { keyword: 'Source of Truth', className: 'text-emerald-400 font-semibold' },
  { keyword: '진실의 원천', className: 'text-emerald-400 font-semibold' },
  { keyword: 'Product', className: 'text-cyan-400 font-semibold' },
  { keyword: '이벤트 소싱', className: 'text-rose-400 font-semibold' },
  { keyword: 'Outbox', className: 'text-orange-400 font-semibold' },
  { keyword: 'Kafka', className: 'text-sky-400 font-semibold' },
  { keyword: 'Webhook', className: 'text-orange-400 font-semibold' },
  { keyword: 'PG', className: 'text-pink-400 font-semibold' },
  { keyword: '사가 오케스트레이션', className: 'text-yellow-400 font-semibold' },
  { keyword: '최종 일관성', className: 'text-lime-400 font-semibold' },
  { keyword: 'Keycloak', className: 'text-indigo-400 font-semibold' },
  { keyword: 'Bounded Context', className: 'text-violet-400 font-semibold' },
  { keyword: '자원', className: 'text-emerald-300 font-semibold' },
  { keyword: '프리티어', className: 'text-orange-300 font-semibold' },
  { keyword: '뷰어', className: 'text-blue-400 font-semibold' },
  { keyword: '플랜 리포트', className: 'text-blue-400 font-semibold' },
];

function highlightText(text: string): ReactNode[] {
  if (!text) return [text];

  const pattern = HIGHLIGHT_RULES.map((r) => r.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const regex = new RegExp(`(${pattern})`, 'g');
  const parts = text.split(regex);

  return parts.map((part, i) => {
    const rule = HIGHLIGHT_RULES.find((r) => r.keyword === part);
    if (rule) {
      return <span key={i} className={rule.className}>{part}</span>;
    }
    return part;
  });
}

export function highlightChildren(children: ReactNode): ReactNode {
  if (typeof children === 'string') {
    return highlightText(children);
  }
  if (Array.isArray(children)) {
    return children.map((child, i) => {
      if (typeof child === 'string') {
        return <span key={i}>{highlightText(child)}</span>;
      }
      return child;
    });
  }
  return children;
}

export interface DocSectionChild {
  key: string;
  label: string;
  /** 네비게이션에 표시할 뱃지 (e.g. '트러블슈팅', '설계 결정') */
  badge?: string;
}

export interface DocSection {
  key: string;
  label: string;
  content: React.ReactNode;
  children?: DocSectionChild[];
  /** 참고 문서(DOC) 섹션 — 네비 상단에 별도 영역으로 표시 */
  doc?: boolean;
}

interface ServiceDocLayoutProps {
  title: string;
  sections: DocSection[];
}

export function ServiceDocLayout({ title, sections }: ServiceDocLayoutProps) {
  const docSections = sections.filter((s) => s.doc);
  const contentSections = sections.filter((s) => !s.doc);
  const defaultKey = contentSections[0]?.key ?? docSections[0]?.key ?? '';
  const [activeSection, setActiveSection] = useState(defaultKey);

  const current = sections.find((s) => s.key === activeSection);

  const scrollToAnchor = (sectionKey: string, childKey: string) => {
    setActiveSection(sectionKey);
    requestAnimationFrame(() => {
      const el = document.getElementById(childKey);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const renderNavItem = (section: DocSection) => {
    const isActive = activeSection === section.key;
    return (
      <div key={section.key}>
        <button
          onClick={() => setActiveSection(section.key)}
          className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-all ${
            isActive
              ? 'bg-gray-800/60 text-gray-200 border-l-2 border-amber-500'
              : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/30'
          }`}
        >
          {section.label}
        </button>
        {section.children && section.children.length > 0 && (
          <div className="ml-3 mt-0.5 space-y-0.5">
            {section.children.map((child) => (
              <button
                key={child.key}
                onClick={() => scrollToAnchor(section.key, child.key)}
                className="w-full text-left px-3 py-1.5 rounded-md text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-800/30 transition-all"
              >
                <span className="block">{child.label}</span>
                {child.badge && (
                  <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wide text-amber-500/70 bg-amber-500/[0.08] px-1.5 py-0.5 rounded">
                    {child.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex">
      {/* Sub navigation */}
      <div className="shrink-0 w-52 bg-[#080e1a] border-r border-gray-800/60 flex flex-col py-4 px-3 gap-1">
        <div className="px-2 mb-3">
          <div className="text-base font-bold text-gray-200">{title}</div>
        </div>

        {/* DOC sections (참고 문서) */}
        {docSections.length > 0 && (
          <>
            <div className="flex items-center gap-2 mb-1.5 px-1">
              <div className="flex-1 border-t border-amber-500/30" />
              <span className="text-[10px] font-extrabold text-amber-500/70 shrink-0">DOCS</span>
              <div className="flex-1 border-t border-amber-500/30" />
            </div>
            <div className="space-y-0.5">
              {docSections.map(renderNavItem)}
            </div>
            <div className="flex items-center gap-2 my-2.5 px-1">
              <div className="flex-1 border-t border-gray-700/40" />
              <span className="text-[9px] font-bold text-gray-600 shrink-0">CONTENTS</span>
              <div className="flex-1 border-t border-gray-700/40" />
            </div>
          </>
        )}

        {/* Content sections */}
        <div className="space-y-0.5">
          {contentSections.map(renderNavItem)}
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

export function DocHeading({ id, badge, children }: { id?: string; badge?: string; children: React.ReactNode }) {
  return (
    <h3 id={id} className="flex items-center gap-3 text-2xl font-bold text-gray-100 mb-5 pl-3 border-l-[3px] border-amber-500">
      {children}
      {badge && (
        <span className="text-[10px] font-bold uppercase tracking-wide text-amber-500/80 bg-amber-500/[0.08] border border-amber-500/20 px-2 py-1 rounded">
          {badge}
        </span>
      )}
    </h3>
  );
}

export function DocBlock({ id, title, badge, children }: { id?: string; title: string; badge?: string; children: React.ReactNode }) {
  return (
    <div className="mb-20">
      <DocHeading id={id} badge={badge}>{title}</DocHeading>
      <div className="ml-1 pl-4 border-l border-gray-800/60">
        {children}
      </div>
    </div>
  );
}

export function DocSubHeading({ children, sub }: { children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <h4 className="text-lg font-bold text-gray-200">{children}</h4>
      {sub && <span className="text-sm font-mono text-gray-600">{sub}</span>}
    </div>
  );
}

export function DocParagraph({ children }: { children: React.ReactNode }) {
  return <p className="text-base text-gray-400 leading-relaxed mb-4">{highlightChildren(children)}</p>;
}

export function DocCode({ title, language, children }: { title?: string; language?: string; children: string }) {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (language && codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [language, children]);

  return (
    <div className="mb-4">
      {title && <div className="text-xs text-gray-500 font-mono mb-1">{title}</div>}
      <pre className="bg-[#080e1a] border border-gray-800/60 rounded-lg p-4 text-sm font-mono text-gray-300 overflow-x-auto !bg-[#080e1a]">
        {language ? (
          <code ref={codeRef} className={`language-${language} !text-sm`}>{children}</code>
        ) : (
          children
        )}
      </pre>
    </div>
  );
}

export function DocCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#0d1628] border border-gray-800/60 rounded-lg p-4 mb-4">
      <div className="text-[15px] font-bold text-gray-200 mb-3">{title}</div>
      {children}
    </div>
  );
}

export function DocCallout({ children, code }: { children?: React.ReactNode; code?: string }) {
  return (
    <div className="relative mt-3 mb-4 rounded-lg border-l-2 border border-l-amber-500 border-amber-500/30 bg-amber-500/[0.06] px-4 py-3.5">
      <div className="text-[11.5px] font-bold text-amber-400 tracking-wide uppercase mb-2">Why</div>
      {children && <div className="text-sm text-gray-400 leading-relaxed">{highlightChildren(children)}</div>}
      {code && (
        <pre className={`${children ? 'mt-3' : ''} text-[13px] text-gray-400 leading-relaxed font-mono whitespace-pre overflow-x-auto`}>{code}</pre>
      )}
    </div>
  );
}

export function DocPlaceholder({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center h-40 border border-dashed border-gray-700 rounded-lg">
      <span className="text-base text-gray-600">{text}</span>
    </div>
  );
}

export interface DocKVItem {
  label: string;
  value: string;
  color?: string;
}

export function DocKeyValueList({ items, labelWidth = 'w-28' }: { items: DocKVItem[]; labelWidth?: string }) {
  return (
    <div className="space-y-2 text-sm text-gray-400">
      {items.map((item) => (
        <div key={item.label} className="flex items-start gap-2">
          <span className={`${item.color ?? 'text-gray-300'} font-mono ${labelWidth} shrink-0`}>{item.label}</span>
          <span>{item.value}</span>
        </div>
      ))}
    </div>
  );
}

export function DocBulletList({ items }: { items: string[] }) {
  return (
    <div className="text-sm text-gray-400 space-y-1">
      {items.map((item, i) => (
        <div key={i}>- {item}</div>
      ))}
    </div>
  );
}

export function DocImage({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  return (
    <div className="mb-4">
      <div className="rounded-lg border border-gray-800/60 overflow-hidden bg-[#080e1a]">
        <img
          src={src}
          alt={alt}
          className="w-full h-auto block"
          loading="lazy"
        />
      </div>
      {caption && (
        <div className="text-xs text-gray-500 mt-2 text-center">{caption}</div>
      )}
    </div>
  );
}

export function DocLink({ href, label, desc }: { href: string; label: string; desc?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 px-4 py-3 rounded-lg border border-gray-800/60 bg-[#0d1628] hover:border-gray-700 hover:bg-[#111d35] transition-colors mb-3 group"
    >
      <span className="shrink-0 mt-0.5 text-gray-500 group-hover:text-gray-400">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 3H3.5A1.5 1.5 0 0 0 2 4.5v8A1.5 1.5 0 0 0 3.5 14h8a1.5 1.5 0 0 0 1.5-1.5V10" />
          <path d="M10 2h4v4" />
          <path d="M14 2 7.5 8.5" />
        </svg>
      </span>
      <div className="min-w-0">
        <div className="text-sm font-medium text-gray-300 group-hover:text-gray-200 truncate">{label}</div>
        {desc && <div className="text-xs text-gray-500 mt-0.5">{desc}</div>}
      </div>
    </a>
  );
}
