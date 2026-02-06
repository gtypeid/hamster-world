-- ============================================================================
-- DB 초기화 스크립트 (개발 환경용)
-- ============================================================================
-- 용도: 개발 환경에서 Hibernate ddl-auto=create/update로 테이블이 생성된 후,
--       JPA Entity로는 표현할 수 없는 FK 제약을 추가하기 위한 스크립트
--
-- 실행 방식:
--   - spring.sql.init.mode=always 설정 시 애플리케이션 시작 시 자동 실행
--   - 이미 제약이 존재하면 에러 발생 (continue-on-error: true로 무시)
--   - 개발 환경에서만 사용, 프로덕션은 Flyway/Liquibase 권장
--
-- 참고:
--   - JPA @Index로 unique 제약은 자동 생성됨
--   - FK는 @ManyToOne 없이는 자동 생성 안 되므로 수동 추가 필요
--   - ON DELETE CASCADE: 부모 삭제 시 자식도 함께 삭제
--   - ON DELETE RESTRICT: 자식이 있으면 부모 삭제 불가 (기본값)
-- ============================================================================

-- ============================================================================
-- 1. merchants 테이블 FK
-- ============================================================================
-- User 삭제 시 Merchant도 삭제 (1:1 관계)
ALTER TABLE merchants
    ADD CONSTRAINT fk_merchants_user_id
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- ============================================================================
-- 2. products 테이블 FK
-- ============================================================================
-- Merchant 삭제 시 Product 삭제 방지 (데이터 보존)
ALTER TABLE products
    ADD CONSTRAINT fk_products_merchant_id
        FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE RESTRICT;

-- ============================================================================
-- 3. carts 테이블 FK
-- ============================================================================
-- User 삭제 시 Cart도 함께 삭제
ALTER TABLE carts
    ADD CONSTRAINT fk_carts_user_id
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- ============================================================================
-- 4. cart_items 테이블 FK
-- ============================================================================
-- Cart 삭제 시 CartItem도 함께 삭제 (CASCADE)
ALTER TABLE cart_items
    ADD CONSTRAINT fk_cart_items_cart_id
        FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE;

-- Product 삭제 시 CartItem도 함께 삭제 (CASCADE)
ALTER TABLE cart_items
    ADD CONSTRAINT fk_cart_items_product_id
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- ============================================================================
-- 5. orders 테이블 FK
-- ============================================================================
-- User 삭제 시 Order 삭제 방지 (주문 기록 보존)
ALTER TABLE orders
    ADD CONSTRAINT fk_orders_user_id
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;

-- ============================================================================
-- 6. order_items 테이블 FK
-- ============================================================================
-- Order 삭제 시 OrderItem도 함께 삭제
ALTER TABLE order_items
    ADD CONSTRAINT fk_order_items_order_id
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

-- Product 삭제 시 OrderItem 삭제 방지 (주문 기록 보존)
ALTER TABLE order_items
    ADD CONSTRAINT fk_order_items_product_id
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT;

-- ============================================================================
-- 7. boards 테이블 FK
-- ============================================================================
-- Product 삭제 시 Board 삭제 방지 (리뷰/문의 보존)
ALTER TABLE boards
    ADD CONSTRAINT fk_boards_product_id
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT;

-- User (작성자) 삭제 시 Board 삭제 방지 (게시글 보존)
ALTER TABLE boards
    ADD CONSTRAINT fk_boards_author_id
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE RESTRICT;

-- ============================================================================
-- 8. comments 테이블 FK
-- ============================================================================
-- Board 삭제 시 Comment도 함께 삭제
ALTER TABLE comments
    ADD CONSTRAINT fk_comments_board_id
        FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE;

-- User (작성자) 삭제 시 Comment 삭제 방지 (댓글 보존)
ALTER TABLE comments
    ADD CONSTRAINT fk_comments_author_id
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE RESTRICT;

-- Parent Comment 삭제 시 대댓글도 함께 삭제
ALTER TABLE comments
    ADD CONSTRAINT fk_comments_parent_id
        FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE;
