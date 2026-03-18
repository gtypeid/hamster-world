import { useState } from 'react';

interface ServiceInfo {
  name: string;
  description: string;
  icon: string;
  url?: string;
  port?: number;
  status?: 'running' | 'stopped';
  type: 'frontend' | 'backend' | 'infrastructure';
}

export function Services() {
  // TODO: 실제로는 AWS API나 헬스체크로 상태 확인
  const [instanceStatus] = useState<'running' | 'stopped'>('stopped');

  const services: ServiceInfo[] = [
    // Frontend Services
    {
      name: 'E-Commerce',
      description: '이커머스 사용자 페이지',
      icon: '🛒',
      url: 'http://ecommerce.hamster-world.com',
      port: 3000,
      status: instanceStatus,
      type: 'frontend',
    },
    {
      name: 'Internal Admin',
      description: '내부 관리자 대시보드',
      icon: '👨‍💼',
      url: 'http://admin.hamster-world.com',
      port: 3001,
      status: instanceStatus,
      type: 'frontend',
    },
    {
      name: 'Hamster PG',
      description: '더미 PG 관리자 페이지',
      icon: '💳',
      url: 'http://pg.hamster-world.com',
      port: 3002,
      status: instanceStatus,
      type: 'frontend',
    },

    // Backend Services
    {
      name: 'E-Commerce API',
      description: '상품, 주문 관리 API',
      icon: '🔌',
      port: 8080,
      status: instanceStatus,
      type: 'backend',
    },
    {
      name: 'Payment Service',
      description: '결제 처리 서비스',
      icon: '💰',
      port: 8081,
      status: instanceStatus,
      type: 'backend',
    },
    {
      name: 'Cash Gateway',
      description: 'PG 연동 게이트웨이',
      icon: '🌉',
      port: 8082,
      status: instanceStatus,
      type: 'backend',
    },
    {
      name: 'Notification Service',
      description: '알림 발송 서비스',
      icon: '📧',
      port: 8083,
      status: instanceStatus,
      type: 'backend',
    },

    // Infrastructure
    {
      name: 'Keycloak',
      description: '인증/인가 서버',
      icon: '🔐',
      url: 'http://keycloak.hamster-world.com',
      port: 8180,
      status: instanceStatus,
      type: 'infrastructure',
    },
    {
      name: 'Grafana',
      description: '모니터링 대시보드',
      icon: '📊',
      url: 'http://grafana.hamster-world.com',
      port: 3100,
      status: instanceStatus,
      type: 'infrastructure',
    },
  ];

  const getStatusBadge = (status?: 'running' | 'stopped') => {
    if (!status) return null;

    return status === 'running' ? (
      <span className="flex items-center gap-1 text-xs text-green-400">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        Running
      </span>
    ) : (
      <span className="flex items-center gap-1 text-xs text-gray-500">
        <div className="w-2 h-2 bg-gray-600 rounded-full" />
        Stopped
      </span>
    );
  };

  const renderServiceCard = (service: ServiceInfo) => {
    const isClickable = service.url && service.status === 'running';

    return (
      <div
        key={service.name}
        className={`bg-dark-card rounded-lg p-6 border border-dark-border transition-all ${
          isClickable
            ? 'hover:border-accent-orange hover:shadow-lg hover:shadow-accent-orange/20 cursor-pointer'
            : 'opacity-75'
        }`}
        onClick={() => isClickable && window.open(service.url, '_blank')}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="text-4xl">{service.icon}</div>
          {getStatusBadge(service.status)}
        </div>

        <h3 className="text-lg font-bold text-white mb-1">{service.name}</h3>
        <p className="text-sm text-gray-400 mb-3">{service.description}</p>

        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500 font-mono">
            {service.port ? `:${service.port}` : 'N/A'}
          </span>
          {isClickable && (
            <span className="text-accent-orange">
              열기 →
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <section>
        <h1 className="text-4xl font-bold mb-4 text-white">
          🎯 Services
        </h1>
        <p className="text-gray-300">
          Hamster World를 구성하는 모든 서비스를 확인하고 접근할 수 있습니다.
        </p>
      </section>

      {/* Instance Status Alert */}
      {instanceStatus === 'stopped' && (
        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">⚠️</div>
            <div>
              <h3 className="font-bold text-yellow-500">인스턴스가 중지되어 있습니다</h3>
              <p className="text-sm text-yellow-400/80">
                서비스에 접근하려면{' '}
                <a href="/infrastructure" className="underline hover:text-yellow-300">
                  인프라 제어 페이지
                </a>
                에서 인스턴스를 시작하세요.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Frontend Services */}
      <section>
        <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
          <span>🖥️</span>
          Frontend Services
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.filter(s => s.type === 'frontend').map(renderServiceCard)}
        </div>
      </section>

      {/* Backend Services */}
      <section>
        <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
          <span>⚙️</span>
          Backend Services
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.filter(s => s.type === 'backend').map(renderServiceCard)}
        </div>
      </section>

      {/* Infrastructure */}
      <section>
        <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
          <span>🏗️</span>
          Infrastructure
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.filter(s => s.type === 'infrastructure').map(renderServiceCard)}
        </div>
      </section>
    </div>
  );
}
