ALTER TABLE merchants
    ADD CONSTRAINT fk_merchants_user_id
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE products
    ADD CONSTRAINT fk_products_merchant_id
        FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE RESTRICT;

ALTER TABLE carts
    ADD CONSTRAINT fk_carts_user_id
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE cart_items
    ADD CONSTRAINT fk_cart_items_cart_id
        FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE;

ALTER TABLE cart_items
    ADD CONSTRAINT fk_cart_items_product_id
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE orders
    ADD CONSTRAINT fk_orders_user_id
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE order_items
    ADD CONSTRAINT fk_order_items_order_id
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

ALTER TABLE order_items
    ADD CONSTRAINT fk_order_items_product_id
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT;

ALTER TABLE boards
    ADD CONSTRAINT fk_boards_product_id
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT;

ALTER TABLE boards
    ADD CONSTRAINT fk_boards_author_id
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE comments
    ADD CONSTRAINT fk_comments_board_id
        FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE;

ALTER TABLE comments
    ADD CONSTRAINT fk_comments_author_id
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE comments
    ADD CONSTRAINT fk_comments_parent_id
        FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE;
