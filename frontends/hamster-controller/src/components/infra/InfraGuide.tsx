import { useState, useEffect, useRef } from 'react';
import { useInfraStore } from '../../stores/useInfraStore';
import type { InfraStatus, SessionPhase } from '../../stores/useInfraStore';
import { parsePlanOutput, formatPlanSummary } from '../../utils/parsePlan';
import { COOLDOWN_MIN } from '../../config/infraConfig';

const PLAN_STEPS = ['Dispatch', 'Waiting', 'Running', 'Logs'];
const APPLY_STEPS = ['Dispatch', 'Waiting', 'Apply', 'Running', 'Destroy'];

export function InfraGuide() {
  const sessionPhase = useInfraStore((s) => s.sessionPhase);
  const infraStatus = useInfraStore((s) => s.infraStatus);
  const initResult = useInfraStore((s) => s.initResult);
  const sessionsUsedToday = useInfraStore((s) => s.sessionsUsedToday);
  const maxSessionsPerDay = useInfraStore((s) => s.maxSessionsPerDay);
  const sessionDurationMin = useInfraStore((s) => s.sessionDurationMin);
  const startedByMe = useInfraStore((s) => s.startedByMe);
  const planStep = useInfraStore((s) => s.planStep);
  const planStepLabel = useInfraStore((s) => s.planStepLabel);
  const planResult = useInfraStore((s) => s.planResult);
  const applyStep = useInfraStore((s) => s.applyStep);
  const applyStepLabel = useInfraStore((s) => s.applyStepLabel);

  // Planning 경과 시간 타이머
  const [planElapsed, setPlanElapsed] = useState(0);
  const planStartRef = useRef<number | null>(null);

  useEffect(() => {
    if (sessionPhase === 'planning') {
      if (planStartRef.current === null) {
        planStartRef.current = Date.now();
      }
      setPlanElapsed(0);
      const iv = setInterval(() => {
        setPlanElapsed(Math.floor((Date.now() - planStartRef.current!) / 1000));
      }, 1000);
      return () => clearInterval(iv);
    }
    planStartRef.current = null;
    setPlanElapsed(0);
  }, [sessionPhase]);

  // Apply 경과 시간 타이머
  const [applyElapsed, setApplyElapsed] = useState(0);
  const applyStartRef = useRef<number | null>(null);
  const showApplyProgress = sessionPhase === 'triggering' || sessionPhase === 'applying'
    || sessionPhase === 'running' || sessionPhase === 'destroying';

  useEffect(() => {
    if (showApplyProgress) {
      if (applyStartRef.current === null) {
        applyStartRef.current = Date.now();
      }
      const iv = setInterval(() => {
        setApplyElapsed(Math.floor((Date.now() - applyStartRef.current!) / 1000));
      }, 1000);
      return () => clearInterval(iv);
    }
    applyStartRef.current = null;
    setApplyElapsed(0);
  }, [showApplyProgress]);

  const parsedPlan = parsePlanOutput(planResult);

  const guide = getGuide(sessionPhase, infraStatus, {
    sessionsUsedToday,
    maxSessionsPerDay,
    sessionDurationMin,
    cooldownMin: COOLDOWN_MIN,
    remainingSeconds: initResult?.remainingSeconds,
    cooldownRemainingSeconds: initResult?.cooldownRemainingSeconds,
    runsCount: initResult?.runs.length ?? 0,
    startedByMe,
    planSummaryText: parsedPlan ? formatPlanSummary(parsedPlan.summary) : null,
  });

  return (
    <div className={`px-5 py-3 border-b border-dark-border ${guide.bgClass}`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-base ${guide.iconBgClass}`}>
          {guide.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-sm font-bold ${guide.titleClass}`}>
              {guide.title}
            </span>
            {guide.badge && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${guide.badgeClass}`}>
                {guide.badge}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-line">
            {guide.description}
          </p>
          {guide.detail && (
            <p className="text-[11px] text-gray-500 mt-1 font-mono">
              {guide.detail}
            </p>
          )}

          {/* Planning progress bar */}
          {sessionPhase === 'planning' && (
            <div className="mt-2.5">
              <div className="flex items-center gap-1 mb-1.5">
                {PLAN_STEPS.map((step, i) => {
                  const isActive = i === planStep;
                  const isDone = i < planStep;
                  return (
                    <div key={step} className="flex items-center gap-1">
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                        isActive
                          ? 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/40'
                          : isDone
                            ? 'bg-green-500/10 text-green-500'
                            : 'bg-gray-800/50 text-gray-600'
                      }`}>
                        {isDone && <span>&#10003;</span>}
                        {isActive && <span className="animate-pulse">&#9679;</span>}
                        {step}
                      </div>
                      {i < PLAN_STEPS.length - 1 && (
                        <div className={`w-3 h-px ${isDone ? 'bg-green-500/40' : 'bg-gray-700'}`} />
                      )}
                    </div>
                  );
                })}
                <span className="text-[10px] text-gray-500 ml-2 tabular-nums">
                  {planElapsed}s<span className="text-gray-600"> / ~30s</span>
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-gray-800 rounded-full h-1 overflow-hidden">
                <div
                  className="h-1 rounded-full bg-indigo-500 transition-all duration-700"
                  style={{ width: `${Math.min((planStep / PLAN_STEPS.length) * 100, 100)}%` }}
                >
                  <div className="h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </div>
              </div>
              {planStepLabel && (
                <div className="text-[10px] text-indigo-400/70 mt-1 font-mono">{planStepLabel}</div>
              )}
            </div>
          )}

          {/* Apply workflow progress bar */}
          {showApplyProgress && (
            <div className="mt-2.5">
              <div className="flex items-center gap-1 mb-1.5">
                {APPLY_STEPS.map((step, i) => {
                  const isActive = i === applyStep;
                  const isDone = i < applyStep;
                  // 색상: Apply/Running은 amber, Destroy는 orange
                  const activeColor = i >= 4
                    ? 'bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/40'
                    : i >= 3
                      ? 'bg-green-500/20 text-green-300 ring-1 ring-green-500/40'
                      : 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40';
                  return (
                    <div key={step} className="flex items-center gap-1">
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                        isActive
                          ? activeColor
                          : isDone
                            ? 'bg-green-500/10 text-green-500'
                            : 'bg-gray-800/50 text-gray-600'
                      }`}>
                        {isDone && <span>&#10003;</span>}
                        {isActive && <span className="animate-pulse">&#9679;</span>}
                        {step}
                      </div>
                      {i < APPLY_STEPS.length - 1 && (
                        <div className={`w-3 h-px ${isDone ? 'bg-green-500/40' : 'bg-gray-700'}`} />
                      )}
                    </div>
                  );
                })}
                <span className="text-[10px] text-gray-500 ml-2 tabular-nums">
                  {applyElapsed}s
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-gray-800 rounded-full h-1 overflow-hidden">
                <div
                  className={`h-1 rounded-full transition-all duration-700 ${
                    applyStep >= 4 ? 'bg-orange-500' : applyStep >= 3 ? 'bg-green-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min((applyStep / APPLY_STEPS.length) * 100, 100)}%` }}
                >
                  <div className="h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </div>
              </div>
              {applyStepLabel && (
                <div className={`text-[10px] mt-1 font-mono ${
                  applyStep >= 4 ? 'text-orange-400/70' : applyStep >= 3 ? 'text-green-400/70' : 'text-amber-400/70'
                }`}>{applyStepLabel}</div>
              )}
            </div>
          )}
        </div>

        {/* Step indicator: Connect → Init → Deploy → Run */}
        <div className="shrink-0 flex items-center gap-1.5">
          {['Connect', 'Init', 'Deploy', 'Run'].map((step, i) => {
            const stepIndex = getStepIndex(sessionPhase, infraStatus);
            const isActive = i === stepIndex;
            const isDone = i < stepIndex;
            return (
              <div key={step} className="flex items-center gap-1.5">
                <div className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/30'
                    : isDone
                      ? 'bg-green-500/10 text-green-500'
                      : 'bg-gray-800/50 text-gray-600'
                }`}>
                  {isDone && <span>&#10003;</span>}
                  {step}
                </div>
                {i < 3 && (
                  <div className={`w-4 h-px ${isDone ? 'bg-green-500/40' : 'bg-gray-700'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Guide data ───

interface GuideCtx {
  sessionsUsedToday: number;
  maxSessionsPerDay: number;
  sessionDurationMin: number;
  cooldownMin: number;
  remainingSeconds?: number;
  cooldownRemainingSeconds?: number;
  runsCount: number;
  startedByMe: boolean;
  planSummaryText: string | null;
}

interface GuideData {
  icon: string;
  title: string;
  description: string;
  detail?: string;
  badge?: string;
  bgClass: string;
  iconBgClass: string;
  titleClass: string;
  badgeClass?: string;
}

function getGuide(phase: SessionPhase, status: InfraStatus, ctx: GuideCtx): GuideData {
  // idle - Connect 전
  if (phase === 'idle') {
    return {
      icon: '▶',
      title: '세션 초기화',
      description: 'Connect 버튼을 눌러 GitHub Actions와 동기화하세요.\n왼쪽 Plan Report · Architecture · Event Flow 네비게이션에서 인프라 상세 정보를 미리 확인할 수 있습니다.',
      detail: `런타임: 세션당 ${ctx.sessionDurationMin}분 / 제한: 하루 ${ctx.maxSessionsPerDay}회 / 쿨다운: 세션 간 ${ctx.cooldownMin}분`,
      badge: '1단계',
      bgClass: 'bg-[#0c1222]',
      iconBgClass: 'bg-indigo-500/20 text-indigo-400',
      titleClass: 'text-indigo-400',
      badgeClass: 'bg-indigo-500/20 text-indigo-400',
    };
  }

  // connecting
  if (phase === 'connecting') {
    return {
      icon: '↻',
      title: '동기화 중...',
      description: 'GitHub Actions API에서 워크플로우 실행 이력을 가져오고 있습니다. 오늘의 사용량과 활성 세션을 확인하는 중입니다.',
      bgClass: 'bg-[#0c1222]',
      iconBgClass: 'bg-purple-500/20 text-purple-300 animate-spin',
      titleClass: 'text-purple-300',
    };
  }

  // connected - 결과에 따라 분기
  if (phase === 'connected') {
    switch (status) {
      case 'available':
        return {
          icon: '✓',
          title: '인프라 점검 가능',
          description: 'Init 버튼을 눌러 Terraform Plan을 실행하세요. 인프라 배포 전 리소스 구성을 확인할 수 있습니다.',
          detail: `오늘: ${ctx.sessionsUsedToday}/${ctx.maxSessionsPerDay}회 사용 / ${ctx.runsCount > 0 ? `워크플로우 ${ctx.runsCount}건 확인` : '오늘 실행 이력 없음'}`,
          badge: '2단계',
          bgClass: 'bg-[#0a1628]',
          iconBgClass: 'bg-blue-500/20 text-blue-400',
          titleClass: 'text-blue-400',
          badgeClass: 'bg-blue-500/20 text-blue-400',
        };

      case 'running': {
        const remainMin = Math.ceil((ctx.remainingSeconds ?? 0) / 60);
        return {
          icon: '⚡',
          title: '기존 세션 참여',
          description: `현재 운영 중인 인프라 세션에 참여합니다. 자동 종료까지 ${remainMin}분 남았습니다. Stop을 눌러 조기 종료할 수 있습니다.`,
          detail: `기존 세션 감지됨 / ${remainMin}분 후 자동 삭제 / 오늘 ${ctx.sessionsUsedToday}/${ctx.maxSessionsPerDay}회 사용`,
          badge: '참여',
          bgClass: 'bg-[#071a0e]',
          iconBgClass: 'bg-green-500/20 text-green-400',
          titleClass: 'text-green-400',
          badgeClass: 'bg-green-500/20 text-green-400 animate-pulse',
        };
      }

      case 'cooldown': {
        const cdMin = Math.ceil((ctx.cooldownRemainingSeconds ?? 0) / 60);
        return {
          icon: '⏳',
          title: '쿨다운 기간',
          description: `이전 세션이 최근에 종료되었습니다. 새 세션 시작까지 ${cdMin}분 대기가 필요합니다.`,
          detail: `쿨다운 남은 시간: ~${cdMin}분 / 오늘 ${ctx.sessionsUsedToday}/${ctx.maxSessionsPerDay}회 사용`,
          bgClass: 'bg-[#1a1600]',
          iconBgClass: 'bg-yellow-500/20 text-yellow-400',
          titleClass: 'text-yellow-400',
          badgeClass: 'bg-yellow-500/20 text-yellow-400',
          badge: '대기',
        };
      }

      case 'limit_exceeded':
        return {
          icon: '✕',
          title: '일일 한도 초과',
          description: `오늘 ${ctx.maxSessionsPerDay}회 세션을 모두 사용했습니다. 자정(UTC) 이후 초기화됩니다. 내일 다시 시도해주세요.`,
          detail: `${ctx.sessionsUsedToday}/${ctx.maxSessionsPerDay}회 사용 완료 / 프리티어 예산 보호`,
          badge: '제한',
          bgClass: 'bg-[#1a0a0a]',
          iconBgClass: 'bg-red-500/20 text-red-400',
          titleClass: 'text-red-400',
          badgeClass: 'bg-red-500/20 text-red-400',
        };
    }
  }

  // planning - terraform plan 진행 중
  if (phase === 'planning') {
    return {
      icon: '↻',
      title: 'Terraform Plan 실행 중...',
      description: 'Terraform Plan을 실행하여 인프라 구성을 분석하고 있습니다. 보안 그룹, 인스턴스 토폴로지, API 라우팅을 점검합니다.',
      bgClass: 'bg-[#0c1222]',
      iconBgClass: 'bg-indigo-500/20 text-indigo-300 animate-spin',
      titleClass: 'text-indigo-300',
    };
  }

  // planned - plan 완료, Start 가능
  if (phase === 'planned') {
    return {
      icon: '✓',
      title: '배포 준비 완료',
      description: `인프라 계획이 확인되었습니다. Start 버튼을 눌러 Terraform Apply로 EC2 인스턴스를 생성합니다. ${ctx.sessionDurationMin}분 후 자동 파괴가 시작됩니다.`,
      detail: `오늘: ${ctx.sessionsUsedToday}/${ctx.maxSessionsPerDay}회 사용${ctx.planSummaryText ? ` / Plan: ${ctx.planSummaryText}` : ''}`,
      badge: '3단계',
      bgClass: 'bg-[#0a1628]',
      iconBgClass: 'bg-blue-500/20 text-blue-400',
      titleClass: 'text-blue-400',
      badgeClass: 'bg-blue-500/20 text-blue-400',
    };
  }

  // triggering / applying
  if (phase === 'triggering' || phase === 'applying') {
    return {
      icon: '⚒',
      title: phase === 'triggering' ? '워크플로우 트리거' : 'Terraform Apply',
      description: phase === 'triggering'
        ? 'GitHub Actions 워크플로우를 실행하고 있습니다. Terraform이 초기화되고 EC2 인스턴스 생성이 시작됩니다.'
        : 'Terraform이 EC2 인스턴스를 생성하고 있습니다. 각 인스턴스에 Docker 컨테이너가 배포됩니다.',
      badge: '배포 중',
      bgClass: 'bg-[#1a1200]',
      iconBgClass: 'bg-amber-500/20 text-amber-400 animate-pulse',
      titleClass: 'text-amber-400',
      badgeClass: 'bg-amber-500/20 text-amber-400 animate-pulse',
    };
  }

  // running (after Start deploy OR Connect detected)
  if (phase === 'running') {
    return {
      icon: '⚡',
      title: ctx.startedByMe ? '인프라 운영 중' : '기존 세션 참여',
      description: ctx.startedByMe
        ? `EC2 인스턴스가 모두 운영 중입니다. 타이머 만료 시 Terraform Destroy가 시작됩니다. Stop을 눌러 조기 종료할 수 있습니다.`
        : `현재 운영 중인 인프라 세션에 참여합니다. 타이머 만료 시 Terraform Destroy가 시작됩니다. Stop을 눌러 조기 종료할 수 있습니다.`,
      badge: ctx.startedByMe ? 'LIVE' : '참여',
      bgClass: 'bg-[#071a0e]',
      iconBgClass: 'bg-green-500/20 text-green-400',
      titleClass: 'text-green-400',
      badgeClass: 'bg-green-500/20 text-green-400 animate-pulse',
    };
  }

  // destroying
  if (phase === 'destroying') {
    return {
      icon: '⚠',
      title: '인프라 삭제 중',
      description: `Terraform destroy가 진행 중입니다. 모든 EC2 인스턴스와 관련 리소스가 삭제되고 있습니다. 예상 소요 시간: ~${ctx.cooldownMin}분`,
      badge: '정리',
      bgClass: 'bg-[#1a0f00]',
      iconBgClass: 'bg-orange-500/20 text-orange-400 animate-pulse',
      titleClass: 'text-orange-400',
      badgeClass: 'bg-orange-500/20 text-orange-400',
    };
  }

  // completed
  if (phase === 'completed') {
    return {
      icon: '✓',
      title: '세션 완료',
      description: '모든 리소스가 삭제되었습니다. Connect을 눌러 동기화 후 새 세션을 시작할 수 있습니다.',
      detail: `오늘 ${ctx.sessionsUsedToday}/${ctx.maxSessionsPerDay}회 사용`,
      bgClass: 'bg-[#0c1222]',
      iconBgClass: 'bg-green-500/20 text-green-400',
      titleClass: 'text-green-400',
    };
  }

  // failed
  if (phase === 'failed') {
    return {
      icon: '✕',
      title: '연결 실패',
      description: 'GitHub Actions API 연결에 실패했습니다. 네트워크와 토큰을 확인한 후 Connect을 눌러 재시도하세요.',
      bgClass: 'bg-[#1a0a0a]',
      iconBgClass: 'bg-red-500/20 text-red-400',
      titleClass: 'text-red-400',
    };
  }

  // fallback
  return {
    icon: '?',
    title: '알 수 없는 상태',
    description: 'Connect을 눌러 동기화하세요.',
    bgClass: 'bg-[#0c1222]',
    iconBgClass: 'bg-gray-500/20 text-gray-400',
    titleClass: 'text-gray-400',
  };
}

// Step index: Connect(0) → Init(1) → Deploy(2) → Run(3)
function getStepIndex(phase: SessionPhase, status: InfraStatus): number {
  if (phase === 'idle' || phase === 'connecting' || phase === 'failed') return 0;
  if (phase === 'connected') {
    if (status === 'available') return 1;
    if (status === 'running') return 3; // 기존 세션 참여 = 이미 운영 중
    return 0;
  }
  if (phase === 'planning') return 1;
  if (phase === 'planned') return 2;
  if (phase === 'triggering' || phase === 'applying') return 2;
  if (phase === 'running') return 3;
  if (phase === 'destroying' || phase === 'completed') return 3;
  return 0;
}
