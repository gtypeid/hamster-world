export function Documentation() {
  const docs = [
    {
      title: '프로젝트 개요',
      description: '전체 시스템 소개 및 목표',
      type: 'markdown',
      icon: '📖',
    },
    {
      title: '아키텍처 설계서',
      description: 'Google Slides 프레젠테이션',
      type: 'slides',
      icon: '📊',
      url: 'https://docs.google.com/presentation/d/YOUR_SLIDE_ID/embed',
    },
    {
      title: 'API 명세서',
      description: 'REST API 엔드포인트 문서',
      type: 'swagger',
      icon: '🔌',
    },
    {
      title: 'ERD 다이어그램',
      description: '데이터베이스 설계',
      type: 'image',
      icon: '🗄️',
      url: '/docs/erd.png',
    },
    {
      title: '배포 가이드',
      description: 'Terraform + GitHub Actions',
      type: 'markdown',
      icon: '🚀',
    },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <section>
        <h1 className="text-4xl font-bold mb-4 text-white">
          📚 Documentation
        </h1>
        <p className="text-gray-400">
          프로젝트 문서, 설계서, API 명세 등을 확인할 수 있습니다.
        </p>
      </section>

      {/* Document Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {docs.map((doc) => (
          <div
            key={doc.title}
            className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-aws-orange transition-all cursor-pointer group"
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
              {doc.icon}
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{doc.title}</h3>
            <p className="text-sm text-gray-400 mb-4">{doc.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 uppercase">{doc.type}</span>
              <span className="text-aws-orange opacity-0 group-hover:opacity-100 transition-opacity">
                열기 →
              </span>
            </div>
          </div>
        ))}
      </section>

      {/* Google Slides Embed Example */}
      <section className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-700 bg-gray-900/50">
          <h2 className="text-xl font-bold text-white">📊 프로젝트 소개 (Example)</h2>
          <p className="text-sm text-gray-400 mt-1">
            Google Slides를 임베드하여 프레젠테이션을 바로 볼 수 있습니다.
          </p>
        </div>
        <div className="relative" style={{ paddingBottom: '56.25%' }}>
          {/* TODO: 실제 Google Slides URL로 교체 */}
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
            <div className="text-center">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-gray-400">
                Google Slides URL을 설정하세요
              </p>
              <p className="text-xs text-gray-500 mt-2 font-mono">
                url: "https://docs.google.com/presentation/d/YOUR_ID/embed"
              </p>
            </div>
          </div>
          {/* Uncomment when you have a real slides URL
          <iframe
            src="YOUR_GOOGLE_SLIDES_EMBED_URL"
            className="absolute inset-0 w-full h-full"
            frameBorder="0"
            allowFullScreen
          /> */}
        </div>
      </section>

      {/* Markdown Content Example */}
      <section className="bg-gray-800 rounded-lg p-8 border border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-white">📖 README.md</h2>

        <div className="prose prose-invert max-w-none">
          <div className="space-y-4 text-gray-300">
            <h3 className="text-xl font-bold text-aws-orange">🐹 Hamster World</h3>

            <p>
              이벤트 드리븐 아키텍처 기반의 이커머스 플랫폼으로,
              AWS 프리티어 환경에서 온디맨드로 운영되는 포트폴리오 프로젝트입니다.
            </p>

            <h4 className="text-lg font-semibold text-github-purple">주요 특징</h4>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Apache Kafka를 활용한 비동기 메시지 처리</li>
              <li>마이크로서비스 아키텍처 (6-8개 Spring Boot 서비스)</li>
              <li>Terraform으로 인프라 관리 (IaC)</li>
              <li>GitHub Actions로 CI/CD 자동화</li>
              <li>프리티어 한도 내 온디맨드 운영</li>
            </ul>

            <h4 className="text-lg font-semibold text-yellow-500">시스템 요구사항</h4>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>AWS 계정 (프리티어)</li>
              <li>GitHub Personal Access Token (workflow 권한)</li>
              <li>Docker Hub 계정</li>
            </ul>

            <div className="bg-gray-900 rounded-lg p-4 mt-6">
              <p className="text-sm text-gray-400 mb-2">빠른 시작:</p>
              <pre className="text-green-400 font-mono text-sm">
{`# 1. 인프라 시작
GitHub Actions 트리거 (Create Instance)

# 2. 애플리케이션 배포
Docker 이미지 pull & run

# 3. 서비스 접속
http://ecommerce.hamster-world.com

# 4. 종료
GitHub Actions 트리거 (Destroy)`}
              </pre>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
