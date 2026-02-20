import { useState, useEffect } from 'react';

const COOKIE_KEY = 'hamster-welcome-dismissed';

function isDismissedToday(): boolean {
  const val = localStorage.getItem(COOKIE_KEY);
  if (!val) return false;
  const saved = new Date(val);
  const now = new Date();
  return saved.toDateString() === now.toDateString();
}

function dismissForToday() {
  localStorage.setItem(COOKIE_KEY, new Date().toISOString());
}

interface WelcomeModalProps {
  forceOpen?: boolean;
  onClose: () => void;
}

/* ── Image placeholder ─────────────────────────────────────────────── */
function SlideImage({ slideIndex }: { slideIndex: number }) {
  const imageMap: Record<number, string | null> = {
    0: null, // replace with: '/welcome/slide-1.png' or gif
    1: null, // replace with: '/welcome/slide-2.gif'
    2: null, // replace with: '/welcome/slide-3.png'
  };
  const src = imageMap[slideIndex];

  return (
    <div className="w-full h-[200px] rounded-lg bg-[#080e1a] border border-gray-800 flex items-center justify-center overflow-hidden shrink-0">
      {src ? (
        <img src={src} alt="" className="w-full h-full object-contain" />
      ) : (
        <div className="flex flex-col items-center gap-2 text-gray-600">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
          </svg>
          <span className="text-xs">Screenshot / GIF</span>
        </div>
      )}
    </div>
  );
}

/* ── Slides ────────────────────────────────────────────────────────── */
const SLIDES = [
  {
    title: 'Hamster World',
    subtitle: '이게 뭔가요?',
    color: 'text-amber-400',
    content: (idx: number) => (
      <div className="space-y-4">
        <SlideImage slideIndex={idx} />
        <p className="text-gray-300 leading-relaxed text-base">
          Hamster World는{' '}
          <span className="text-amber-400 font-semibold">결제를 대행하는 PG Aggregator</span>를
           &middot; 구현한 이벤트 드리븐 이커머스 시스템입니다.
        </p>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded px-3 py-2 text-blue-400 text-center">
            6개 마이크로서비스
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded px-3 py-2 text-red-400 text-center">
            이벤트 드리븐 (Kafka)
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded px-3 py-2 text-green-400 text-center">
            AWS 프리티어
          </div>
        </div>
        <p className="text-gray-500 text-sm leading-relaxed">
          이 페이지는 프로젝트 소개와 문서, 인프라 제어를 하나로 모은{' '}
          <span className="text-gray-300">포트폴리오 대시보드</span>입니다.
        </p>
      </div>
    ),
  },
  {
    title: '인프라',
    subtitle: '배포 & 사용 방법',
    color: 'text-blue-400',
    content: (idx: number) => (
      <div className="space-y-4">
        <SlideImage slideIndex={idx} />
        <p className="text-gray-300 leading-relaxed text-base">
          상단 바에서{' '}
          <span className="text-green-400 font-semibold">Connect</span> &rarr;{' '}
          <span className="text-blue-400 font-semibold">Init</span> &rarr;{' '}
          <span className="text-amber-400 font-semibold">Start</span> 순서로 진행하면
          AWS 인프라가 프리티어 내에서 온디맨드로 배포됩니다.
        </p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-gray-800/30 border border-gray-700/50 rounded px-3 py-2">
            <div className="text-gray-500">세션</div>
            <div className="text-gray-300 font-mono">20분 후 자동 파괴</div>
          </div>
          <div className="bg-gray-800/30 border border-gray-700/50 rounded px-3 py-2">
            <div className="text-gray-500">인스턴스</div>
            <div className="text-gray-300 font-mono">t3.micro EC2 x8</div>
          </div>
        </div>
        <p className="text-gray-500 text-sm leading-relaxed">
          세션이 시작되면 각 서비스 URL이 활성화되며, 20분 후 자동으로 인프라가 정리됩니다.
        </p>
      </div>
    ),
  },
  {
    title: '둘러보기',
    subtitle: '문서, 서비스 & 아키텍처',
    color: 'text-emerald-400',
    content: (idx: number) => (
      <div className="space-y-4">
        <SlideImage slideIndex={idx} />
        <p className="text-gray-300 leading-relaxed text-base">
          좌측 사이드바에서 각 항목을 클릭하면 프로젝트의{' '}
          <span className="text-emerald-400 font-semibold">설계 방향</span>,{' '}
          <span className="text-blue-400 font-semibold">아키텍처 뷰어</span>,{' '}
          <span className="text-amber-400 font-semibold">서비스 상세</span>를 확인할 수 있습니다.
        </p>
        <div className="flex flex-wrap gap-2 text-sm">
          {[
            { label: '문서', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
            { label: '뷰어', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
            { label: '서비스', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
            { label: '앱', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
          ].map((g) => (
            <span key={g.label} className={`border rounded-md px-3 py-1.5 font-semibold ${g.color}`}>
              {g.label}
            </span>
          ))}
        </div>
        <p className="text-gray-500 text-sm leading-relaxed">
          각 서비스의 설계 의도와 핵심 코드, 시스템 아키텍처와 이벤트 토폴로지까지 확인해 보세요.
        </p>
      </div>
    ),
  },
];

export function WelcomeModal({ forceOpen, onClose }: WelcomeModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [dontShowToday, setDontShowToday] = useState(false);
  const [visible, setVisible] = useState(() => !isDismissedToday());

  useEffect(() => {
    if (forceOpen) {
      setVisible(true);
      setCurrentSlide(0);
    }
  }, [forceOpen]);

  const handleClose = () => {
    if (dontShowToday) {
      dismissForToday();
    }
    setVisible(false);
    onClose();
  };

  const slide = SLIDES[currentSlide];

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/35 backdrop-blur-sm">
      <div className="bg-[#0b1120] border border-gray-700/60 rounded-xl shadow-2xl shadow-black/50 w-[720px] h-[580px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div>
            <h2 className={`text-xl font-bold ${slide.color}`}>{slide.title}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{slide.subtitle}</p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-md text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors text-xl"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
          {slide.content(currentSlide)}
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-t border-gray-800">
          <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowToday}
              onChange={(e) => setDontShowToday(e.target.checked)}
              className="rounded border-gray-600 bg-gray-800 text-amber-500 focus:ring-amber-500/30 w-4 h-4"
            />
            오늘 하루 안 보기
          </label>

          <div className="flex items-center gap-3">
            {/* Dots */}
            <div className="flex items-center gap-2">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === currentSlide ? 'bg-gray-300 w-5' : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                />
              ))}
            </div>

            {/* Navigation */}
            {currentSlide > 0 && (
              <button
                onClick={() => setCurrentSlide((p) => p - 1)}
                className="px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors"
              >
                이전
              </button>
            )}
            {currentSlide < SLIDES.length - 1 ? (
              <button
                onClick={() => setCurrentSlide((p) => p + 1)}
                className={`px-4 py-1.5 text-sm font-semibold rounded-md border transition-colors ${slide.color} border-current/20 bg-current/5 hover:bg-current/10`}
              >
                다음
              </button>
            ) : (
              <button
                onClick={handleClose}
                className="px-4 py-1.5 text-sm font-semibold rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-colors"
              >
                시작
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
