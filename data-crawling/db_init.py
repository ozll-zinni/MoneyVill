import requests
import pymysql
import json
import pandas as pd
import datetime as dt
import pickle
import time
from tqdm import tqdm
from bs4 import BeautifulSoup as bs
import urllib
from urllib.request import Request, urlopen

########################################################################################
########################################## 환율 #########################################
########################################################################################
with open("data_jungle/data(cur_20241126).p", "rb") as f:
    result_list = pickle.load(f)

con = pymysql.connect(
    host="localhost",
    user="root",
    password="M!Thtl3980@",
    db="modoostock",
    charset="utf8mb4",
    autocommit=True,
)
cur = con.cursor()

sql_drop = "DROP TABLE IF EXISTS currency;"
cur.execute(sql_drop)
sql = """
CREATE TABLE currency (
    cur_date DATE NOT NULL,
    cur_name VARCHAR(50) NOT NULL,
    cur_rate FLOAT NOT NULL
) CHARSET=utf8mb4;"""
cur.execute(sql)
sql = "INSERT INTO currency(cur_date, cur_name, cur_rate) VALUES " + ",".join(
    result_list
)
cur.execute(sql)
con.close()

########################################################################################
########################################## 현물 #########################################
########################################################################################


def save_to_pickle(file_name, data):
    """Pickle 파일로 저장."""
    with open(file_name, "wb") as f:
        pickle.dump(data, f)


def load_from_pickle(file_name):
    """Pickle 파일에서 로드."""
    with open(file_name, "rb") as f:
        return pickle.load(f)


# 데이터 처리 함수
def process_material_data(result_list):
    """데이터 변환."""
    processed_data = []
    for item in result_list:
        try:
            # 문자열을 튜플로 변환
            (
                material_date,
                material_name,
                material_state,
                material_rate,
                material_change,
                material_change_rate,
            ) = eval(item)

            # 새로운 데이터 형식으로 변환
            processed_data.append(
                f"('{material_date}', '{material_name}', '{material_state}', {material_rate}, {material_change}, {material_change_rate})"
            )
        except Exception as e:
            print(f"Error processing item: {item}, Error: {e}")
            continue

    return processed_data


# MySQL 연결 및 데이터 삽입 함수
def insert_material_data(cur, table_name, processed_data, first):
    """데이터 삽입."""
    # 테이블 생성
    if first:
        sql_drop = f"DROP TABLE IF EXISTS {table_name}"
        cur.execute(sql_drop)
        sql = f"""
        CREATE TABLE {table_name} (
            material_date DATE NOT NULL,
            material_name VARCHAR(100) NOT NULL,
            material_state VARCHAR(50),
            material_rate FLOAT NOT NULL,
            material_change FLOAT,
            material_change_rate FLOAT
        );
        """
        cur.execute(sql)

    # 데이터 삽입
    sql = (
        f"INSERT INTO {table_name} (material_date, material_name, material_state, material_rate, material_change, material_change_rate) VALUES "
        + ",".join(processed_data)
    )
    cur.execute(sql)
    print("Data inserted successfully.")


def process_and_save_data(pickle_file, table_name, first):
    """데이터 처리 및 저장."""

    # Pickle 로드
    result_list = load_from_pickle(pickle_file)

    # 데이터 변환
    processed_data = process_material_data(result_list)

    # 데이터베이스 연결 및 삽입
    con = pymysql.connect(
        host="localhost",
        user="root",
        password="M!Thtl3980@",
        db="modoostock",
        charset="utf8mb4",
        autocommit=True,
    )
    try:
        cur = con.cursor()
        insert_material_data(cur, table_name, processed_data, first)
        print(f"Data inserted into table {table_name}.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        con.close()


# 예제 사용
process_and_save_data(
    "data_jungle/data(domestic_petr_241126).p", "material_origin", True
)
process_and_save_data(
    "data_jungle/data(domestic_glob_241126).p", "material_origin", False
)

########################################################################################
########################################## 주식 #########################################
########################################################################################

with open("data_jungle/data(stock_네이버_20241126).p", "rb") as f:
    result_list = pickle.load(f)
con = pymysql.connect(
    host="localhost",
    user="root",
    password="M!Thtl3980@",
    db="modoostock",
    charset="utf8mb4",
    autocommit=True,
)
cur = con.cursor()
sql_drop = "DROP TABLE IF EXISTS stock_crawl;"
cur.execute(sql_drop)
sql = """
CREATE TABLE stock_crawl (
    stock_date DATE NOT NULL,               -- 주식 날짜
    stock_name VARCHAR(50) NOT NULL,       -- 종목 이름
    stock_name_origin VARCHAR(50) NOT NULL, -- 종목 원래 이름
    stock_state VARCHAR(10) NOT NULL,      -- 상태 (상승/하락/보합 등)
    stock_rate INT NOT NULL,               -- 종가
    stock_change VARCHAR(10) NOT NULL,     -- 상태 상세 (상승/하락)
    stock_low INT NOT NULL,                -- 저가
    stock_high INT NOT NULL,               -- 고가
    stock_volume INT NOT NULL,             -- 거래량
    stock_change_rate FLOAT NOT NULL       -- 변동률
) CHARSET=utf8mb4;"""
cur.execute(sql)
sql = (
    "INSERT INTO stock_crawl(stock_date, stock_name, stock_name_origin, stock_state, stock_rate, stock_change, stock_high, stock_low, stock_volume, stock_change_rate) VALUES "
    + ",".join(result_list)
)
cur.execute(sql)
con.close()


with open("data_jungle/data(stock_삼성전자_20241126).p", "rb") as f:
    result_list = pickle.load(f)
con = pymysql.connect(
    host="localhost",
    user="root",
    password="M!Thtl3980@",
    db="modoostock",
    charset="utf8mb4",
    autocommit=True,
)
cur = con.cursor()
sql = (
    "INSERT INTO stock_crawl(stock_date, stock_name, stock_name_origin, stock_state, stock_rate, stock_change, stock_high, stock_low, stock_volume, stock_change_rate) VALUES "
    + ",".join(result_list)
)
cur.execute(sql)
con.close()


with open("data_jungle/data(stock_셀트리온_20241126).p", "rb") as f:
    result_list = pickle.load(f)
con = pymysql.connect(
    host="localhost",
    user="root",
    password="M!Thtl3980@",
    db="modoostock",
    charset="utf8mb4",
    autocommit=True,
)
cur = con.cursor()
sql = (
    "INSERT INTO stock_crawl(stock_date, stock_name, stock_name_origin, stock_state, stock_rate, stock_change, stock_high, stock_low, stock_volume, stock_change_rate) VALUES "
    + ",".join(result_list)
)
cur.execute(sql)
con.close()


with open("data_jungle/data(stock_HYBE엔터_20241126).p", "rb") as f:
    result_list = pickle.load(f)
con = pymysql.connect(
    host="localhost",
    user="root",
    password="M!Thtl3980@",
    db="modoostock",
    charset="utf8mb4",
    autocommit=True,
)
cur = con.cursor()
sql = (
    "INSERT INTO stock_crawl(stock_date, stock_name, stock_name_origin, stock_state, stock_rate, stock_change, stock_high, stock_low, stock_volume, stock_change_rate) VALUES "
    + ",".join(result_list)
)
cur.execute(sql)
con.close()

########################################################################################
########################################## 뉴스 #########################################
########################################################################################

with open("data_jungle/data(news_네이버_241126).p", "rb") as f:
    result_list = pickle.load(f)
con = pymysql.connect(
    host="localhost",
    user="root",
    password="M!Thtl3980@",
    db="modoostock",
    charset="utf8mb4",
    autocommit=True,
)
cur = con.cursor()
sql_drop = "DROP TABLE IF EXISTS news_origin;"
cur.execute(sql_drop)
sql = """
CREATE TABLE news_origin (
    news_date DATE NOT NULL,               -- 뉴스 날짜
    news_name_origin VARCHAR(50) NOT NULL, -- 원본 뉴스 이름
    news_name VARCHAR(50) NOT NULL,       -- 변환된 뉴스 이름
    news_content TEXT NOT NULL,           -- 뉴스 내용 (기사 제목)
    PRIMARY KEY (news_date, news_name_origin, news_content(255)) -- 고유 키 설정 (옵션)
) CHARSET=utf8mb4;"""
cur.execute(sql)
sql = (
    "INSERT INTO news_origin(news_date, news_name_origin, news_name, news_content) VALUES "
    + ",".join(result_list)
)
cur.execute(sql)
con.close()


with open("data_jungle/data(news_삼성전자_241126).p", "rb") as f:
    result_list = pickle.load(f)
con = pymysql.connect(
    host="localhost",
    user="root",
    password="M!Thtl3980@",
    db="modoostock",
    charset="utf8mb4",
    autocommit=True,
)
cur = con.cursor()
sql = (
    "INSERT INTO news_origin(news_date, news_name_origin, news_name, news_content) VALUES "
    + ",".join(result_list)
)
cur.execute(sql)
con.close()


with open("data_jungle/data(news_셀트리온_241126).p", "rb") as f:
    result_list = pickle.load(f)
con = pymysql.connect(
    host="localhost",
    user="root",
    password="M!Thtl3980@",
    db="modoostock",
    charset="utf8mb4",
    autocommit=True,
)
cur = con.cursor()
sql = (
    "INSERT INTO news_origin(news_date, news_name_origin, news_name, news_content) VALUES "
    + ",".join(result_list)
)
cur.execute(sql)
con.close()


with open("data_jungle/data(news_HYBE엔터_241126).p", "rb") as f:
    result_list = pickle.load(f)
con = pymysql.connect(
    host="localhost",
    user="root",
    password="M!Thtl3980@",
    db="modoostock",
    charset="utf8mb4",
    autocommit=True,
)
cur = con.cursor()
sql = (
    "INSERT INTO news_origin(news_date, news_name_origin, news_name, news_content) VALUES "
    + ",".join(result_list)
)
cur.execute(sql)
con.close()

#########################################################################
# SQL 파일 읽기
with open("db_jungle/db_init.sql", "r", encoding="utf-8") as f:
    sql = f.read()  # 파일을 문자열로 읽기

# 데이터베이스 연결
con = pymysql.connect(
    host="localhost",
    user="root",
    password="M!Thtl3980@",
    db="modoostock",
    charset="utf8mb4",
    autocommit=True,
)
cur = con.cursor()

try:
    # 여러 SQL 쿼리 실행 (파일 내에 여러 쿼리가 있을 경우)
    for statement in sql.split(";"):
        if statement.strip():  # 빈 문장은 건너뜀
            cur.execute(statement)
    print("SQL executed successfully.")
except Exception as e:
    print(f"Error occurred: {e}")
finally:
    # 연결 닫기
    cur.close()
    con.close()

#########################################################################
# SQL 파일 읽기
with open("db_jungle/db_processing.sql", "r", encoding="utf-8") as f:
    sql = f.read()  # 파일을 문자열로 읽기

# 데이터베이스 연결
con = pymysql.connect(
    host="localhost",
    user="root",
    password="M!Thtl3980@",
    db="modoostock",
    charset="utf8mb4",
    autocommit=True,
)
cur = con.cursor()

try:
    # 여러 SQL 쿼리 실행 (파일 내에 여러 쿼리가 있을 경우)
    for statement in sql.split(";"):
        if statement.strip():  # 빈 문장은 건너뜀
            cur.execute(statement)
    print("SQL executed successfully.")
except Exception as e:
    print(f"Error occurred: {e}")
finally:
    # 연결 닫기
    cur.close()
    con.close()
