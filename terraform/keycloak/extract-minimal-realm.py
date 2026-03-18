"""
Keycloak 전체 realm export에서 커스텀 설정만 추출하는 스크립트

사용법:
  1. 전체 export:
     docker exec hamster-keycloak /opt/keycloak/bin/kc.sh export \
       --file /tmp/full-realm.json --realm hamster-world --users realm_file
     docker cp hamster-keycloak:/tmp/full-realm.json ./full-realm.json

  2. 최소 추출:
     python3 extract-minimal-realm.py full-realm.json hamster-world-realm.json
"""

import json
import sys

# Keycloak 기본 내장 client (import 불필요 - 자동 생성됨)
DEFAULT_CLIENTS = {
    'account', 'account-console', 'admin-cli',
    'broker', 'realm-management', 'security-admin-console'
}

# Keycloak 기본 내장 realm role (import 불필요 - 자동 생성됨)
DEFAULT_REALM_ROLES = {
    'uma_authorization', 'offline_access', 'default-roles-hamster-world'
}


def extract(input_path, output_path):
    with open(input_path, 'r') as f:
        data = json.load(f)

    custom_clients = [
        c for c in data.get('clients', [])
        if c['clientId'] not in DEFAULT_CLIENTS
    ]

    # AWS 배포용: redirectUris, webOrigins, postLogoutRedirectUris를 와일드카드로 변경
    # 이유: AWS에서는 퍼블릭 IP가 동적이므로 특정 URL을 지정할 수 없음
    # - redirectUris: 로그인 후 리다이렉트 허용 대상
    # - webOrigins: CORS 허용 origin
    # - postLogoutRedirectUris: 로그아웃 후 리다이렉트 허용 대상
    #   (이 값을 빠뜨리면 로그아웃 시 400 Bad Request 발생)
    for client in custom_clients:
        client['redirectUris'] = ['*']
        client['webOrigins'] = ['*']
        if 'attributes' not in client:
            client['attributes'] = {}
        client['attributes']['post.logout.redirect.uris'] = '*'

    custom_realm_roles = [
        r for r in data.get('roles', {}).get('realm', [])
        if r['name'] not in DEFAULT_REALM_ROLES
    ]

    minimal = {
        "realm": data["realm"],
        "enabled": True,
        "sslRequired": "NONE",
        "registrationAllowed": data.get("registrationAllowed", False),
        "roles": {
            "realm": custom_realm_roles
        },
        "clients": custom_clients,
        "users": data.get("users", [])
    }

    with open(output_path, 'w') as f:
        json.dump(minimal, f, indent=2, ensure_ascii=False)

    print(f"입력: {input_path} ({len(open(input_path).read())} bytes)")
    print(f"출력: {output_path} ({len(open(output_path).read())} bytes)")
    print(f"clients: {[c['clientId'] for c in custom_clients]}")
    print(f"roles: {[r['name'] for r in custom_realm_roles]}")
    print(f"users: {[u['username'] for u in minimal['users']]}")


if __name__ == '__main__':
    if len(sys.argv) != 3:
        print("사용법: python3 extract-minimal-realm.py <전체export.json> <출력.json>")
        sys.exit(1)
    extract(sys.argv[1], sys.argv[2])
