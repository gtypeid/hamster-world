
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
                         `id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT 'Internal PK (Auto-increment)',
                         `public_id` VARCHAR(20) NOT NULL COMMENT 'Public ID (Snowflake ID - Base62)',
                         `keycloak_user_id` VARCHAR(255) NOT NULL COMMENT 'Keycloak Subject ID (외부 시스템 UUID)',
                         `username` VARCHAR(255) NOT NULL COMMENT 'Username',
                         `email` VARCHAR(255) NOT NULL COMMENT 'Email',
                         `name` VARCHAR(100) NOT NULL COMMENT 'Display Name',
                         `role` VARCHAR(20) NOT NULL COMMENT 'User Role (USER, ADMIN)',
                         `created_at` DATETIME NOT NULL,
                         `modified_at` DATETIME NULL,
                         PRIMARY KEY (`id`) USING BTREE,
                         UNIQUE KEY `idx_users_public_id` (`public_id`) USING BTREE,
                         UNIQUE KEY `idx_users_keycloak_user_id` (`keycloak_user_id`) USING BTREE,
                         UNIQUE KEY `idx_users_username` (`username`) USING BTREE,
                         UNIQUE KEY `idx_users_email` (`email`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
