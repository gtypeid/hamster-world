import { ServiceDocLayout, DocBlock, DocParagraph, DocCard, DocCode, DocCallout, DocKeyValueList } from './ServiceDocLayout';
import type { DocSection } from './ServiceDocLayout';

const sections: DocSection[] = [
  {
    key: 'overview',
    label: '개요',
    children: [
      { key: 'svc-intent', label: '플랫폼 의도' },
      { key: 'svc-desc', label: '플랫폼 설명' },
      { key: 'svc-design', label: '핵심 설계 및 코드' },
      { key: 'svc-aside', label: '여담' },
    ],
    content: (
      <div className="space-y-8">
        {/* 플랫폼 의도 */}
        <DocBlock id="svc-intent" title="플랫폼 의도">
          <DocParagraph>
            햄스터 월드가 사용하는 플랫폼 도구들입니다.
            직접 개발한 것이 아닌, 가져다 쓴 인프라 서비스들로
            인증, 메시징, 관측성(Observability) 세 가지 축을 담당합니다.
          </DocParagraph>
          <DocCallout>
            모든 플랫폼 도구는 프리티어 t3.micro 인스턴스에서 동작하도록 튜닝되어 있습니다.
            Keycloak은 hamster-auth, Kafka는 hamster-kafka,
            관측성 스택은 hamster-front 인스턴스에 Docker Compose로 배포됩니다.
          </DocCallout>
        </DocBlock>

        {/* 플랫폼 설명 */}
        <DocBlock id="svc-desc" title="플랫폼 설명">
          <DocCard title="Keycloak 23.0 — 인증/인가">
            <DocParagraph>
              OAuth2 / OIDC 표준 기반 인증 서버입니다.
              hamster-world Realm에서 셀프 등록과 JWT 기반 인증을 제공합니다.
              모든 프론트엔드 앱이 Keycloak JWT로 인증합니다 (hamster-pg 제외).
            </DocParagraph>
            <DocKeyValueList labelWidth="w-16" items={[
              { label: 'Realm', value: 'hamster-world (셀프 등록 + JWT 인증)', color: 'text-purple-400' },
              { label: 'Roles', value: 'ADMIN, MERCHANT, USER, DEVELOPER, VENDOR, SYSTEM (6개 Realm Role)', color: 'text-blue-400' },
              { label: 'Clients', value: 'ecommerce, content-creator, hamster-pg, internal-admin (4개 Public OIDC)', color: 'text-green-400' },
              { label: 'Port', value: ':8090 (hamster-auth 인스턴스)', color: 'text-amber-400' },
            ]} />
            <DocCallout>
              인증/인가를 직접 구현하지 않고 Keycloak을 도입한 이유는
              OAuth2/OIDC 표준 준수, 역할 기반 접근 제어(RBAC), 멀티 테넌트 지원 등을
              자체 구현하는 것이 프로젝트 범위를 벗어나기 때문입니다.
            </DocCallout>
          </DocCard>
          <DocCard title="Apache Kafka 7.5 — 이벤트 브로커">
            <DocParagraph>
              KRaft 모드로 Zookeeper 의존성 없이 단일 인스턴스에서 운영됩니다.
              서비스 간 비동기 이벤트 통신의 중심이며,
              4개 비즈니스 토픽과 4개 Dead Letter 토픽을 관리합니다.
            </DocParagraph>
            <DocCode>{`Kafka 토픽 구성

비즈니스 토픽:
  ecommerce-events      Ecommerce → Payment, Progression
  payment-events        Payment → Ecommerce, Cash Gateway
  cash-gateway-events   Cash Gateway → Payment
  progression-events    Progression → Payment

Dead Letter 토픽:
  ecommerce-events-dlt
  payment-events-dlt
  cash-gateway-events-dlt
  progression-events-dlt
  → 모두 Notification Service가 MongoDB에 저장`}</DocCode>
            <DocCallout>
              KRaft 모드를 선택한 이유는 Zookeeper 의존성을 제거하여
              단일 인스턴스에서도 안정적으로 운영하기 위함입니다.
              256MB 힙으로 t3.micro에서 동작합니다.
            </DocCallout>
          </DocCard>
          <DocCard title="관측성 스택 — Prometheus + Loki + Tempo + Grafana">
            <DocKeyValueList labelWidth="w-24" items={[
              { label: 'Prometheus', value: '메트릭 수집. 15초 스크레이프, Spring Actuator /actuator/prometheus', color: 'text-blue-400' },
              { label: 'Loki', value: '로그 집약. TSDB 스토어, 30일 보존, 20MB/s 인제스트', color: 'text-green-400' },
              { label: 'Tempo', value: '분산 트레이싱. OTLP gRPC(:4317)/HTTP(:4318), Zipkin(:9411)', color: 'text-amber-400' },
              { label: 'Grafana', value: '통합 대시보드. 3개 사전 구성 대시보드 + 크로스 링킹', color: 'text-red-400' },
            ]} />
          </DocCard>
        </DocBlock>

        {/* 핵심 설계 및 코드 */}
        <DocBlock id="svc-design" title="핵심 설계 및 코드">
          <DocCard title="Spring Boot JWT 통합">
            <DocParagraph>
              모든 Spring Boot 서비스는 OAuth2 Resource Server로 동작합니다.
              Keycloak이 발급한 JWT를 JWK Set으로 검증하며,
              커스텀 JWT Converter가 3가지 유형의 권한을 추출합니다.
            </DocParagraph>
            <DocCode language="kotlin">{`// JWT Converter — 3가지 권한 소스 추출
// 1. Realm Roles  → ROLE_MERCHANT, ROLE_USER, ...
// 2. Client Roles → ecommerce_role, ...
// 3. Scopes       → SCOPE_openid, SCOPE_profile, ...

fun convert(jwt: Jwt): AbstractAuthenticationToken {
    val authorities = mutableSetOf<GrantedAuthority>()

    // Realm roles: realm_access.roles
    val realmRoles = jwt.getClaimAsMap("realm_access")
        ?.get("roles") as? List<*>
    realmRoles?.forEach {
        authorities.add(SimpleGrantedAuthority("ROLE_\${it}"))
    }

    // Client roles: resource_access.{clientId}.roles
    val resourceAccess = jwt.getClaimAsMap("resource_access")
    resourceAccess?.forEach { (client, access) ->
        ((access as? Map<*, *>)?.get("roles") as? List<*>)
            ?.forEach { authorities.add(SimpleGrantedAuthority("\${client}_\${it}")) }
    }

    // Scopes
    jwt.getClaimAsString("scope")?.split(" ")?.forEach {
        authorities.add(SimpleGrantedAuthority("SCOPE_\${it}"))
    }

    return JwtAuthenticationToken(jwt, authorities)
}`}</DocCode>
          </DocCard>
          <DocCard title="Keycloak Admin API 연동">
            <DocParagraph>
              Ecommerce에서 가맹점 등록 시 Keycloak Admin API로 역할을 자동 부여합니다.
              RestTemplate 기반 클라이언트로 5초 연결, 10초 읽기 타임아웃을 설정합니다.
            </DocParagraph>
            <DocCode>{`가맹점 등록 흐름

1. 사용자가 가맹점 등록 API 호출
2. Ecommerce: Merchant 엔티티 생성
3. Ecommerce → Keycloak Admin API:
   - MERCHANT 역할 조회
   - 사용자에게 MERCHANT 역할 부여
4. JWT 재발급 시 ROLE_MERCHANT 포함`}</DocCode>
          </DocCard>
          <DocCard title="관측성 크로스 링킹">
            <DocParagraph>
              Grafana에서 메트릭, 트레이스, 로그 간 자유롭게 이동할 수 있습니다.
              각 데이터 소스가 서로를 참조하도록 설정되어 있습니다.
            </DocParagraph>
            <DocCode>{`Grafana 크로스 링킹 구성

Prometheus → Tempo
  Exemplar에 traceID를 포함하여 메트릭에서 트레이스로 점프

Loki → Tempo
  로그 메시지에서 traceID를 정규식으로 추출하여 트레이스 연결

Tempo → Loki
  트레이스에서 해당 서비스의 로그를 필터링하여 조회

Tempo → Prometheus
  서비스 맵 생성 (서비스 간 호출 관계 시각화)

→ 메트릭 → 트레이스 → 로그 간 자유 이동 가능`}</DocCode>
          </DocCard>
          <DocCard title="Prometheus 스크레이프 설정">
            <DocCode>{`# prometheus.yml — 6개 서비스 스크레이프
scrape_interval: 15s

scrape_configs:
  - job_name: ecommerce-service
    metrics_path: /actuator/prometheus
    static_configs:
      - targets: ['hamster-commerce:8080']
        labels: { service: ecommerce, env: aws }

  - job_name: payment-service
    static_configs:
      - targets: ['hamster-payment:8083']
        labels: { service: payment, env: aws }

  # cash-gateway, hamster-pg, progression, notification 동일 패턴`}</DocCode>
          </DocCard>
          <DocCard title="사전 구성 대시보드">
            <DocKeyValueList items={[
              { label: 'Spring Boot Overview', value: 'JVM 메트릭, HTTP 요청 통계, 힙 사용량, GC 모니터링', color: 'text-blue-400' },
              { label: 'Loki Logs', value: '서비스별 로그 조회, 에러 필터링, traceID 기반 검색', color: 'text-green-400' },
              { label: 'Kafka Metrics', value: '토픽별 메시지 처리량, Consumer Lag, 파티션 상태', color: 'text-red-400' },
            ]} />
          </DocCard>
        </DocBlock>

        {/* 여담 */}
        <DocBlock id="svc-aside" title="여담">
          <DocParagraph>
            관측성 스택은 "문제가 발생했을 때 어디서부터 봐야 하는가"에 대한 답입니다.
            메트릭에서 이상 징후를 발견하면 해당 시점의 트레이스로 이동하고,
            트레이스에서 문제 서비스를 찾으면 해당 서비스의 로그로 이동합니다.
            이 3단계 크로스 링킹이 디버깅 시간을 줄여줍니다.
          </DocParagraph>
          <DocParagraph>
            AWS 환경에서는 환경 변수(KEYCLOAK_HOST)로 Keycloak 주소를 주입합니다.
            Terraform이 동적으로 생성한 Private IP를 각 서비스에 전달하여,
            JWT issuer-uri 불일치 문제를 방지합니다.
          </DocParagraph>
        </DocBlock>
      </div>
    ),
  },
];

export function PlatformTab() {
  return (
    <ServiceDocLayout
      title="플랫폼"
      sections={sections}
    />
  );
}
