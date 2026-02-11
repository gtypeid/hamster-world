import { Link } from 'react-router-dom';
import { HamsterWheel } from '../components/HamsterWheel';

export function Home() {
  return (
    <div className="p-8 space-y-12">
      {/* Hero Section */}
      <section className="text-center py-12">
        <div className="mb-8">
          <HamsterWheel isRunning={false} />
        </div>
        <h1 className="text-5xl font-bold mb-4 text-white">
          Hamster World
        </h1>
        <p className="text-xl text-gray-300 mb-2">
          Event-Driven E-commerce Platform
        </p>
        <p className="text-sm text-accent-orange font-mono font-semibold">
          Kafka + Spring Boot + React + AWS (Terraform Managed)
        </p>
      </section>

      {/* Quick Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-dark-card rounded-lg p-6 border border-dark-border hover:border-accent-orange transition-colors">
          <div className="text-3xl mb-2">🏗️</div>
          <h3 className="text-lg font-bold text-accent-orange mb-1">6-8 Microservices</h3>
          <p className="text-sm text-gray-400">Spring Boot + Docker</p>
        </div>
        <div className="bg-dark-card rounded-lg p-6 border border-dark-border hover:border-accent-yellow transition-colors">
          <div className="text-3xl mb-2">⚡</div>
          <h3 className="text-lg font-bold text-accent-yellow mb-1">Event-Driven</h3>
          <p className="text-sm text-gray-400">Kafka Message Broker</p>
        </div>
        <div className="bg-dark-card rounded-lg p-6 border border-dark-border hover:border-accent-blue transition-colors">
          <div className="text-3xl mb-2">☁️</div>
          <h3 className="text-lg font-bold text-accent-blue mb-1">AWS Free Tier</h3>
          <p className="text-sm text-gray-400">On-Demand Infrastructure</p>
        </div>
      </section>

      {/* Project Overview */}
      <section className="bg-dark-card rounded-lg p-8 border border-dark-border">
        <h2 className="text-2xl font-bold mb-6 text-white">📖 프로젝트 소개</h2>

        <div className="space-y-6 text-gray-300">
          <div>
            <h3 className="text-lg font-semibold text-accent-orange mb-2">🎯 핵심 아이디어</h3>
            <p className="leading-relaxed">
              Hamster World는 <strong>이벤트 드리븐 아키텍처</strong>를 기반으로 한 이커머스 플랫폼입니다.
              주문부터 결제, 배송까지 모든 프로세스가 <strong>Kafka 메시지</strong>를 통해 비동기로 처리되며,
              각 마이크로서비스는 독립적으로 확장 가능합니다.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-accent-blue mb-2">💡 왜 Hamster인가?</h3>
            <p className="leading-relaxed">
              햄스터가 챗바퀴를 돌리듯, 이 프로젝트는 <strong>AWS 프리티어 한도 내에서</strong> 온디맨드로 인프라를 회전시킵니다.
              필요할 때만 서버를 켜고, 시간이 지나면 자동으로 꺼지는 <strong>비용 효율적인 포트폴리오</strong>입니다.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-accent-yellow mb-2">🛠️ 기술 스택</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                'Spring Boot 3.x',
                'Apache Kafka',
                'MySQL (통합)',
                'MongoDB',
                'React 19',
                'Keycloak',
                'Docker',
                'Terraform',
                'GitHub Actions',
                'AWS EC2',
                'Nginx',
                'TypeScript'
              ].map((tech) => (
                <div key={tech} className="bg-dark-hover px-3 py-2 rounded border border-dark-border text-sm font-mono text-gray-200">
                  {tech}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Flow */}
      <section className="bg-dark-card rounded-lg p-8 border border-dark-border">
        <h2 className="text-2xl font-bold mb-6 text-white">🔄 결제 플로우 (Event-Driven)</h2>

        <div className="bg-dark-bg rounded-lg p-6 font-mono text-sm overflow-x-auto">
          <pre className="text-green-400">
{`이커머스 → [Kafka] → 페이먼트 → [Kafka] → 캐시게이트웨이 → 햄스터PG
                                                      ↓
                                               비동기 노티
                                                      ↓
캐시게이트웨이 ← ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
    ↓
[Kafka] → 페이먼트 → [Kafka] → 이커머스 (상태 전환)`}
          </pre>
        </div>
      </section>

      {/* CTA Buttons */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/services"
          className="bg-gradient-to-r from-accent-orange to-yellow-600 hover:from-accent-orange/80 hover:to-yellow-600/80 text-white font-bold py-6 px-8 rounded-lg transition-all transform hover:scale-105 text-center border border-dark-border"
        >
          <div className="text-3xl mb-2">🎯</div>
          <div className="text-xl">서비스 둘러보기</div>
          <div className="text-sm opacity-75 mt-1">이커머스, 어드민, PG 등</div>
        </Link>

        <Link
          to="/infrastructure"
          className="bg-gradient-to-r from-accent-blue to-blue-600 hover:from-accent-blue/80 hover:to-blue-600/80 text-white font-bold py-6 px-8 rounded-lg transition-all transform hover:scale-105 text-center border border-dark-border"
        >
          <div className="text-3xl mb-2">🎮</div>
          <div className="text-xl">인프라 제어하기</div>
          <div className="text-sm opacity-75 mt-1">AWS 인스턴스 ON/OFF</div>
        </Link>
      </section>
    </div>
  );
}
