import { useInfraStore } from '../../stores/useInfraStore';
import type { InfraStatus, SessionPhase } from '../../stores/useInfraStore';

export function InfraGuide() {
  const sessionPhase = useInfraStore((s) => s.sessionPhase);
  const infraStatus = useInfraStore((s) => s.infraStatus);
  const initResult = useInfraStore((s) => s.initResult);
  const sessionsUsedToday = useInfraStore((s) => s.sessionsUsedToday);
  const maxSessionsPerDay = useInfraStore((s) => s.maxSessionsPerDay);
  const sessionDurationMin = useInfraStore((s) => s.sessionDurationMin);
  const startedByMe = useInfraStore((s) => s.startedByMe);

  const guide = getGuide(sessionPhase, infraStatus, {
    sessionsUsedToday,
    maxSessionsPerDay,
    sessionDurationMin,
    remainingSeconds: initResult?.remainingSeconds,
    cooldownRemainingSeconds: initResult?.cooldownRemainingSeconds,
    runsCount: initResult?.runs.length ?? 0,
    startedByMe,
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
          <p className="text-xs text-gray-400 leading-relaxed">
            {guide.description}
          </p>
          {guide.detail && (
            <p className="text-[11px] text-gray-500 mt-1 font-mono">
              {guide.detail}
            </p>
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
  remainingSeconds?: number;
  cooldownRemainingSeconds?: number;
  runsCount: number;
  startedByMe: boolean;
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
      icon: '\u25B6',
      title: '\uC138\uC158 \uCD08\uAE30\uD654',
      description: 'Connect \uBC84\uD2BC\uC744 \uB20C\uB7EC GitHub Actions\uC640 \uB3D9\uAE30\uD654\uD558\uC138\uC694. \uC624\uB298\uC758 \uC0AC\uC6A9\uB7C9\uC744 \uD655\uC778\uD558\uACE0, \uC0C8 \uC138\uC158\uC744 \uC2DC\uC791\uD560 \uC218 \uC788\uB294\uC9C0 \uD310\uB2E8\uD569\uB2C8\uB2E4.',
      detail: `\uB7F0\uD0C0\uC784: \uC138\uC158\uB2F9 ${ctx.sessionDurationMin}\uBD84 / \uC81C\uD55C: \uD558\uB8E8 ${ctx.maxSessionsPerDay}\uD68C / \uCFE8\uB2E4\uC6B4: \uC138\uC158 \uAC04 5\uBD84`,
      badge: '1\uB2E8\uACC4',
      bgClass: 'bg-[#0c1222]',
      iconBgClass: 'bg-indigo-500/20 text-indigo-400',
      titleClass: 'text-indigo-400',
      badgeClass: 'bg-indigo-500/20 text-indigo-400',
    };
  }

  // connecting
  if (phase === 'connecting') {
    return {
      icon: '\u21BB',
      title: '\uB3D9\uAE30\uD654 \uC911...',
      description: 'GitHub Actions API\uC5D0\uC11C \uC6CC\uD06C\uD50C\uB85C\uC6B0 \uC2E4\uD589 \uC774\uB825\uC744 \uAC00\uC838\uC624\uACE0 \uC788\uC2B5\uB2C8\uB2E4. \uC624\uB298\uC758 \uC0AC\uC6A9\uB7C9\uACFC \uD65C\uC131 \uC138\uC158\uC744 \uD655\uC778\uD558\uB294 \uC911\uC785\uB2C8\uB2E4.',
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
          icon: '\u2713',
          title: '\uC778\uD504\uB77C \uC810\uAC80 \uAC00\uB2A5',
          description: 'Init \uBC84\uD2BC\uC744 \uB20C\uB7EC Terraform Plan\uC744 \uC2E4\uD589\uD558\uC138\uC694. \uC778\uD504\uB77C \uBC30\uD3EC \uC804 \uB9AC\uC18C\uC2A4 \uAD6C\uC131\uC744 \uD655\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.',
          detail: `\uC624\uB298: ${ctx.sessionsUsedToday}/${ctx.maxSessionsPerDay}\uD68C \uC0AC\uC6A9 / ${ctx.runsCount > 0 ? `\uC6CC\uD06C\uD50C\uB85C\uC6B0 ${ctx.runsCount}\uAC74 \uD655\uC778` : '\uC624\uB298 \uC2E4\uD589 \uC774\uB825 \uC5C6\uC74C'}`,
          badge: '2\uB2E8\uACC4',
          bgClass: 'bg-[#0a1628]',
          iconBgClass: 'bg-blue-500/20 text-blue-400',
          titleClass: 'text-blue-400',
          badgeClass: 'bg-blue-500/20 text-blue-400',
        };

      case 'running': {
        const remainMin = Math.ceil((ctx.remainingSeconds ?? 0) / 60);
        return {
          icon: '\u26A1',
          title: '\uAE30\uC874 \uC138\uC158 \uCC38\uC5EC',
          description: `\uD604\uC7AC \uC6B4\uC601 \uC911\uC778 \uC778\uD504\uB77C \uC138\uC158\uC5D0 \uCC38\uC5EC\uD569\uB2C8\uB2E4. \uC790\uB3D9 \uC885\uB8CC\uAE4C\uC9C0 ${remainMin}\uBD84 \uB0A8\uC558\uC2B5\uB2C8\uB2E4. Stop\uC744 \uB20C\uB7EC \uC870\uAE30 \uC885\uB8CC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.`,
          detail: `\uAE30\uC874 \uC138\uC158 \uAC10\uC9C0\uB428 / ${remainMin}\uBD84 \uD6C4 \uC790\uB3D9 \uC0AD\uC81C / \uC624\uB298 ${ctx.sessionsUsedToday}/${ctx.maxSessionsPerDay}\uD68C \uC0AC\uC6A9`,
          badge: '\uCC38\uC5EC',
          bgClass: 'bg-[#071a0e]',
          iconBgClass: 'bg-green-500/20 text-green-400',
          titleClass: 'text-green-400',
          badgeClass: 'bg-green-500/20 text-green-400 animate-pulse',
        };
      }

      case 'cooldown': {
        const cdMin = Math.ceil((ctx.cooldownRemainingSeconds ?? 0) / 60);
        return {
          icon: '\u23F3',
          title: '\uCFE8\uB2E4\uC6B4 \uAE30\uAC04',
          description: `\uC774\uC804 \uC138\uC158\uC774 \uCD5C\uADFC\uC5D0 \uC885\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uC0C8 \uC138\uC158 \uC2DC\uC791\uAE4C\uC9C0 ${cdMin}\uBD84 \uB300\uAE30\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4. \uB9AC\uC18C\uC2A4 \uCDA9\uB3CC\uC744 \uBC29\uC9C0\uD558\uAE30 \uC704\uD55C \uC548\uC804 \uC7A5\uCE58\uC785\uB2C8\uB2E4.`,
          detail: `\uCFE8\uB2E4\uC6B4 \uB0A8\uC740 \uC2DC\uAC04: ~${cdMin}\uBD84 / \uC624\uB298 ${ctx.sessionsUsedToday}/${ctx.maxSessionsPerDay}\uD68C \uC0AC\uC6A9`,
          bgClass: 'bg-[#1a1600]',
          iconBgClass: 'bg-yellow-500/20 text-yellow-400',
          titleClass: 'text-yellow-400',
          badgeClass: 'bg-yellow-500/20 text-yellow-400',
          badge: '\uB300\uAE30',
        };
      }

      case 'limit_exceeded':
        return {
          icon: '\u2715',
          title: '\uC77C\uC77C \uD55C\uB3C4 \uCD08\uACFC',
          description: `\uC624\uB298 ${ctx.maxSessionsPerDay}\uD68C \uC138\uC158\uC744 \uBAA8\uB450 \uC0AC\uC6A9\uD588\uC2B5\uB2C8\uB2E4. \uC790\uC815(UTC) \uC774\uD6C4 \uCD08\uAE30\uD654\uB429\uB2C8\uB2E4. \uB0B4\uC77C \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694.`,
          detail: `${ctx.sessionsUsedToday}/${ctx.maxSessionsPerDay}\uD68C \uC0AC\uC6A9 \uC644\uB8CC / \uD504\uB9AC\uD2F0\uC5B4 \uC608\uC0B0 \uBCF4\uD638`,
          badge: '\uC81C\uD55C',
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
      icon: '\u21BB',
      title: 'Terraform Plan \uC2E4\uD589 \uC911...',
      description: 'Terraform Plan\uC744 \uC2E4\uD589\uD558\uC5EC \uC778\uD504\uB77C \uAD6C\uC131\uC744 \uBD84\uC11D\uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4. \uBCF4\uC548 \uADF8\uB8F9, \uC778\uC2A4\uD134\uC2A4 \uD1A0\uD3F4\uB85C\uC9C0, API \uB77C\uC6B0\uD305\uC744 \uC810\uAC80\uD569\uB2C8\uB2E4.',
      bgClass: 'bg-[#0c1222]',
      iconBgClass: 'bg-indigo-500/20 text-indigo-300 animate-spin',
      titleClass: 'text-indigo-300',
    };
  }

  // planned - plan 완료, Start 가능
  if (phase === 'planned') {
    return {
      icon: '\u2713',
      title: '\uBC30\uD3EC \uC900\uBE44 \uC644\uB8CC',
      description: `\uC778\uD504\uB77C \uACC4\uD68D\uC774 \uD655\uC778\uB418\uC5C8\uC2B5\uB2C8\uB2E4. Start \uBC84\uD2BC\uC744 \uB20C\uB7EC Terraform Apply\uB85C EC2 \uC778\uC2A4\uD134\uC2A4 8\uAC1C\uB97C \uC0DD\uC131\uD569\uB2C8\uB2E4. ${ctx.sessionDurationMin}\uBD84 \uD6C4 \uC790\uB3D9 \uC885\uB8CC\uB429\uB2C8\uB2E4.`,
      detail: `\uC624\uB298: ${ctx.sessionsUsedToday}/${ctx.maxSessionsPerDay}\uD68C \uC0AC\uC6A9 / Plan: 12 to add, 0 to change, 0 to destroy`,
      badge: '3\uB2E8\uACC4',
      bgClass: 'bg-[#0a1628]',
      iconBgClass: 'bg-blue-500/20 text-blue-400',
      titleClass: 'text-blue-400',
      badgeClass: 'bg-blue-500/20 text-blue-400',
    };
  }

  // triggering / applying
  if (phase === 'triggering' || phase === 'applying') {
    return {
      icon: '\u2692',
      title: phase === 'triggering' ? '\uC6CC\uD06C\uD50C\uB85C\uC6B0 \uD2B8\uB9AC\uAC70' : 'Terraform Apply',
      description: phase === 'triggering'
        ? 'GitHub Actions \uC6CC\uD06C\uD50C\uB85C\uC6B0\uB97C \uC2E4\uD589\uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4. Terraform\uC774 \uCD08\uAE30\uD654\uB418\uACE0 EC2 \uC778\uC2A4\uD134\uC2A4 \uC0DD\uC131\uC774 \uC2DC\uC791\uB429\uB2C8\uB2E4.'
        : 'Terraform\uC774 EC2 \uC778\uC2A4\uD134\uC2A4 8\uAC1C\uB97C \uC0DD\uC131\uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4. \uAC01 \uC778\uC2A4\uD134\uC2A4\uC5D0 Docker \uCEE8\uD14C\uC774\uB108\uAC00 \uBC30\uD3EC\uB429\uB2C8\uB2E4.',
      badge: '\uBC30\uD3EC \uC911',
      bgClass: 'bg-[#1a1200]',
      iconBgClass: 'bg-amber-500/20 text-amber-400 animate-pulse',
      titleClass: 'text-amber-400',
      badgeClass: 'bg-amber-500/20 text-amber-400 animate-pulse',
    };
  }

  // running (after Start deploy OR Connect detected)
  if (phase === 'running') {
    return {
      icon: '\u26A1',
      title: ctx.startedByMe ? '\uC778\uD504\uB77C \uC6B4\uC601 \uC911' : '\uAE30\uC874 \uC138\uC158 \uCC38\uC5EC',
      description: ctx.startedByMe
        ? 'EC2 \uC778\uC2A4\uD134\uC2A4 8\uAC1C\uAC00 \uBAA8\uB450 \uC6B4\uC601 \uC911\uC785\uB2C8\uB2E4. \uD0C0\uC774\uBA38 \uB9CC\uB8CC \uC2DC \uC790\uB3D9\uC73C\uB85C \uC0AD\uC81C\uB429\uB2C8\uB2E4. Stop\uC744 \uB20C\uB7EC \uC870\uAE30 \uC885\uB8CC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.'
        : '\uD604\uC7AC \uC6B4\uC601 \uC911\uC778 \uC778\uD504\uB77C \uC138\uC158\uC5D0 \uCC38\uC5EC\uD569\uB2C8\uB2E4. \uD0C0\uC774\uBA38 \uB9CC\uB8CC \uC2DC \uC790\uB3D9\uC73C\uB85C \uC0AD\uC81C\uB429\uB2C8\uB2E4. Stop\uC744 \uB20C\uB7EC \uC870\uAE30 \uC885\uB8CC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.',
      badge: ctx.startedByMe ? 'LIVE' : '\uCC38\uC5EC',
      bgClass: 'bg-[#071a0e]',
      iconBgClass: 'bg-green-500/20 text-green-400',
      titleClass: 'text-green-400',
      badgeClass: 'bg-green-500/20 text-green-400 animate-pulse',
    };
  }

  // destroying
  if (phase === 'destroying') {
    return {
      icon: '\u26A0',
      title: '\uC778\uD504\uB77C \uC0AD\uC81C \uC911',
      description: 'Terraform destroy\uAC00 \uC9C4\uD589 \uC911\uC785\uB2C8\uB2E4. \uBAA8\uB4E0 EC2 \uC778\uC2A4\uD134\uC2A4\uC640 \uAD00\uB828 \uB9AC\uC18C\uC2A4\uAC00 \uC0AD\uC81C\uB418\uACE0 \uC788\uC2B5\uB2C8\uB2E4.',
      badge: '\uC815\uB9AC',
      bgClass: 'bg-[#1a0f00]',
      iconBgClass: 'bg-orange-500/20 text-orange-400 animate-pulse',
      titleClass: 'text-orange-400',
      badgeClass: 'bg-orange-500/20 text-orange-400',
    };
  }

  // completed
  if (phase === 'completed') {
    return {
      icon: '\u2713',
      title: '\uC138\uC158 \uC644\uB8CC',
      description: '\uBAA8\uB4E0 \uB9AC\uC18C\uC2A4\uAC00 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4. Connect\uC744 \uB20C\uB7EC \uB3D9\uAE30\uD654 \uD6C4 \uC0C8 \uC138\uC158\uC744 \uC2DC\uC791\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.',
      detail: `\uC624\uB298 ${ctx.sessionsUsedToday}/${ctx.maxSessionsPerDay}\uD68C \uC0AC\uC6A9`,
      bgClass: 'bg-[#0c1222]',
      iconBgClass: 'bg-green-500/20 text-green-400',
      titleClass: 'text-green-400',
    };
  }

  // failed
  if (phase === 'failed') {
    return {
      icon: '\u2715',
      title: '\uC5F0\uACB0 \uC2E4\uD328',
      description: 'GitHub Actions API \uC5F0\uACB0\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4. \uB124\uD2B8\uC6CC\uD06C\uC640 \uD1A0\uD070\uC744 \uD655\uC778\uD55C \uD6C4 Connect\uC744 \uB20C\uB7EC \uC7AC\uC2DC\uB3C4\uD558\uC138\uC694.',
      bgClass: 'bg-[#1a0a0a]',
      iconBgClass: 'bg-red-500/20 text-red-400',
      titleClass: 'text-red-400',
    };
  }

  // fallback
  return {
    icon: '?',
    title: '\uC54C \uC218 \uC5C6\uB294 \uC0C1\uD0DC',
    description: 'Connect\uC744 \uB20C\uB7EC \uB3D9\uAE30\uD654\uD558\uC138\uC694.',
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
