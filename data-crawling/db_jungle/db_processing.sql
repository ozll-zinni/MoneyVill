-- 환율
DROP TABLE IF EXISTS exchange;
CREATE TABLE exchange (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,        -- 기본 키 (자동 증가)
    national_code VARCHAR(20) NOT NULL,          -- 국가 코드 (최대 20자)
    date DATE NOT NULL,                          -- 날짜
    price BIGINT NOT NULL                        -- 가격
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO exchange (national_code, date, price)
    (
        SELECT "미국", cur_date, cur_rate
        FROM currency
        WHERE cur_name = "미국 달러"
    );
INSERT INTO exchange (national_code, date, price)
    (
        SELECT "유럽 연합", cur_date, cur_rate
        FROM currency
        WHERE cur_name = "유로"
    );
INSERT INTO exchange (national_code, date, price)
    (
        SELECT "일본", cur_date, cur_rate
        FROM currency
        WHERE cur_name = "일본 100엔"
    );

-- 현물
DROP TABLE IF EXISTS material;
CREATE TABLE material (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,        -- 기본 키 (자동 증가)
    standard_type VARCHAR(20) NOT NULL,          -- 표준 타입 (최대 20자)
    date DATE NOT NULL,                          -- 날짜
    price BIGINT NOT NULL                        -- 가격
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO material (date, standard_type, price)
    (
        SELECT  material_date,
                "유가",
                ROUND(AVG(material_rate), 2)
        FROM material_origin
        WHERE material_name = "휘발유"
        GROUP BY material_date
    );
INSERT INTO material (date, standard_type, price)
    (
        SELECT  material_date,
                "금",
                AVG(material_rate)
        FROM material_origin
        WHERE material_name = "국제금(달러/트로이온스)"
        GROUP BY material_date
    );

-- 뉴스
DROP TABLE IF EXISTS news;
CREATE TABLE news (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,        -- 기본 키 (자동 증가)
    company_id BIGINT NOT NULL,                  -- 외래 키 (company 테이블 참조)
    content TEXT NOT NULL,                       -- 뉴스 내용
    date DATE NOT NULL,                          -- 뉴스 날짜
    CONSTRAINT fk_news_company FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO news (company_id, date, content)
    (
        SELECT 	1,
                  news_date,
                  news_content
        FROM news_origin
        WHERE news_name="G IT"
    );
INSERT INTO news (company_id, date, content)
    (
        SELECT 	2,
                  news_date,
                  news_content
        FROM news_origin
        WHERE news_name="A 전자"
    );
INSERT INTO news (company_id, date, content)
    (
        SELECT 	3,
                  news_date,
                  news_content
        FROM news_origin
        WHERE news_name="B 화학"
    );
INSERT INTO news (company_id, date, content)
    (
        SELECT 	4,
                  news_date,
                  news_content
        FROM news_origin
        WHERE news_name="C 생명"
    );
INSERT INTO news (company_id, date, content)
    (
        SELECT 	5,
                  news_date,
                  news_content
        FROM news_origin
        WHERE news_name="E 엔터"
    );
INSERT INTO news (company_id, date, content)
    (
        SELECT 	6,
                  news_date,
                  news_content
        FROM news_origin
        WHERE news_name="F 전자"
    );
INSERT INTO news (company_id, date, content)
    (
        SELECT 	7,
                  news_date,
                  news_content
        FROM news_origin
        WHERE news_name="G 화학"
    );
INSERT INTO news (company_id, date, content)
    (
        SELECT 	8,
                  news_date,
                  news_content
        FROM news_origin
        WHERE news_name="H 생명"
    );
INSERT INTO news (company_id, date, content)
    (
        SELECT 	9,
                  news_date,
                  news_content
        FROM news_origin
        WHERE news_name="I IT"
    );
INSERT INTO news (company_id, date, content)
    (
        SELECT 	10,
                  news_date,
                  news_content
        FROM news_origin
        WHERE news_name="H 엔터"
    );
    
-- 주식
DROP TABLE IF EXISTS chart;
CREATE TABLE chart (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,        -- 기본 키 (자동 증가)
    price_before BIGINT,                         -- 이전 가격 (NULL 허용)
    price_end BIGINT NOT NULL,                   -- 마감 가격
    date DATE NOT NULL,                          -- 날짜
    company_id BIGINT NOT NULL,                  -- 외래 키 (company 테이블 참조)
    buy BIGINT NOT NULL,                         -- 매수량
    sell BIGINT NOT NULL,                        -- 매도량
    change_rate FLOAT NOT NULL,                  -- 변동률
    stock_high BIGINT NOT NULL,                  -- 고가
    stock_low BIGINT NOT NULL,                  -- 저가
    stock_volume BIGINT NOT NULL,                  -- 거래량
    CONSTRAINT fk_chart_company FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO chart (price_before, price_end, date, company_id,sell,buy,change_rate,stock_high,stock_low,stock_volume)
    (
        SELECT stock_rate + IF(stock_state = "up", -stock_change, IF(stock_state = "down", stock_change, 0)),
               stock_rate,
               stock_date,
               1,
               0,
               0,
               1.0,
               stock_high,
               stock_low,
               stock_volume
        FROM stock_crawl
        WHERE stock_name = "G IT"
    );
INSERT INTO chart (price_before, price_end, date, company_id,sell,buy,change_rate)
    (
        SELECT stock_rate + IF(stock_state = "up", -stock_change, IF(stock_state = "down", stock_change, 0)),
               stock_rate,
               stock_date,
               2,
               0,
               0,
               1.0,
               stock_high,
               stock_low,
               stock_volume
        FROM stock_crawl
        WHERE stock_name = "A 전자"
    );
INSERT INTO chart (price_before, price_end, date, company_id,sell,buy,change_rate)
    (
        SELECT stock_rate + IF(stock_state = "up", -stock_change, IF(stock_state = "down", stock_change, 0)),
               stock_rate,
               stock_date,
               3,
               0,
               0,
               1.0,
               stock_high,
               stock_low,
               stock_volume
        FROM stock_crawl
        WHERE stock_name = "B 화학"
    );
INSERT INTO chart (price_before, price_end, date, company_id,sell,buy,change_rate)
    (
        SELECT stock_rate + IF(stock_state = "up", -stock_change, IF(stock_state = "down", stock_change, 0)),
               stock_rate,
               stock_date,
               4,
               0,
               0,
               1.0,
               stock_high,
               stock_low,
               stock_volume
        FROM stock_crawl
        WHERE stock_name = "C 생명"
    );
INSERT INTO chart (price_before, price_end, date, company_id,sell,buy,change_rate)
    (
        SELECT stock_rate + IF(stock_state = "up", -stock_change, IF(stock_state = "down", stock_change, 0)),
               stock_rate,
               stock_date,
               5,
               0,
               0,
               1.0,
               stock_high,
               stock_low,
               stock_volume
        FROM stock_crawl
        WHERE stock_name = "E 엔터"
    );
INSERT INTO chart (price_before, price_end, date, company_id,sell,buy,change_rate)
    (
        SELECT stock_rate + IF(stock_state = "up", -stock_change, IF(stock_state = "down", stock_change, 0)),
               stock_rate,
               stock_date,
               6,
               0,
               0,
               1.0,
               stock_high,
               stock_low,
               stock_volume
        FROM stock_crawl
        WHERE stock_name = "F 전자"
    );
INSERT INTO chart (price_before, price_end, date, company_id,sell,buy,change_rate)
    (
        SELECT stock_rate + IF(stock_state = "up", -stock_change, IF(stock_state = "down", stock_change, 0)),
               stock_rate,
               stock_date,
               7,
               0,
               0,
               1.0,
               stock_high,
               stock_low,
               stock_volume
        FROM stock_crawl
        WHERE stock_name = "G 화학"
    );
INSERT INTO chart (price_before, price_end, date, company_id,sell,buy,change_rate)
    (
        SELECT stock_rate + IF(stock_state = "up", -stock_change, IF(stock_state = "down", stock_change, 0)),
               stock_rate,
               stock_date,
               8,
               0,
               0,
               1.0,
               stock_high,
               stock_low,
               stock_volume
        FROM stock_crawl
        WHERE stock_name = "H 생명"
    );
INSERT INTO chart (price_before, price_end, date, company_id,sell,buy,change_rate)
    (
        SELECT stock_rate + IF(stock_state = "up", -stock_change, IF(stock_state = "down", stock_change, 0)),
               stock_rate,
               stock_date,
               9,
               0,
               0,
               1.0,
               stock_high,
               stock_low,
               stock_volume
        FROM stock_crawl
        WHERE stock_name = "I IT"
    );
INSERT INTO chart (price_before, price_end, date, company_id,sell,buy,change_rate)
    (
        SELECT stock_rate + IF(stock_state = "up", -stock_change, IF(stock_state = "down", stock_change, 0)),
               stock_rate,
               stock_date,
               10,
               0,
               0,
               1.0,
               stock_high,
               stock_low,
               stock_volume
        FROM stock_crawl
        WHERE stock_name = "H 엔터"
    );
