-- market table init
DROP TABLE IF EXISTS market;
CREATE TABLE market (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    start_at DATE NOT NULL,
    end_at DATE NOT NULL,
    game_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT INTO market(id, created_at, updated_at, end_at, game_date, start_at) VALUES
                                                 (1, '2024-11-27 12:42:00.059000', '2024-11-28 10:44:00.027000', '2024-10-31', '2024-01-01',  '2024-01-01');

-- company init
DROP TABLE IF EXISTS company;
CREATE TABLE company (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    kind VARCHAR(255) NOT NULL,
    is_used ENUM('Y', 'N') NOT NULL DEFAULT 'N'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT INTO company(id, is_used, kind, name) VALUES
                                                 (1,'Y', 'IT', '네이버'),
                                                 (2,'Y', '전자', '삼성전자'),
                                                 (3,'Y', '화학', 'LG화학'),
                                                 (4,'Y', '생명', '셀트리온'),
                                                 (5,'Y', '엔터', 'SM엔터'),
                                                 (6,'Y', '전자', 'LG전자'),
                                                 (7,'Y', '화학', '롯테케미칼'),
                                                 (8,'Y', '생명', '녹십자'),
                                                 (9,'Y', 'IT', 'SK텔레콤'),
                                                 (10,'Y', '엔터', 'HYBE엔터');

-- stock table init
DROP TABLE IF EXISTS stock;
CREATE TABLE stock (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    average BIGINT NOT NULL,
    company_id BIGINT NOT NULL,
    market_id BIGINT NOT NULL,
    CONSTRAINT fk_stock_company FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_stock_market FOREIGN KEY (market_id) REFERENCES market(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT INTO stock(id, average, company_id, market_id) VALUES
                                                 (1, 182269, 1, 1),
                                                 (2, 74979, 2, 1),
                                                 (3, 188341, 4, 1),
                                                 (4, 197067, 10, 1);

-- asset init
DROP TABLE IF EXISTS asset;
CREATE TABLE asset (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,          -- 기본 키 (자동 증가)
    category VARCHAR(255) NOT NULL,                -- 카테고리
    asset_level ENUM('RARE', 'EPIC', 'UNIQUE', 'LEGENDARY') NOT NULL,  -- 자산 레벨 (예: Enum 타입)
    asset_name VARCHAR(255) NOT NULL UNIQUE,       -- 자산 이름 (고유 값)
    asset_name_kor VARCHAR(255) NOT NULL           -- 자산 이름 (한국어)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT INTO asset(id, asset_level, asset_name, asset_name_kor, category) VALUES
                                                 (351,'EPIC', 'test', '테스트', 'a');