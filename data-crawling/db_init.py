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


def get_db_connection():
    """Reusable database connection function."""
    return pymysql.connect(
        host="localhost",
        user="ssafy",
        password="ssafy",
        db="modoostock",
        charset="utf8mb4",
        autocommit=True,
    )


########################################################################################
########################################## 환율 #########################################
########################################################################################
with open("data_jungle/data(cur_20241126).p", "rb") as f:
    result_list = pickle.load(f)

con = get_db_connection()
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
            (
                material_date,
                material_name,
                material_state,
                material_rate,
                material_change,
                material_change_rate,
            ) = eval(item)

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

    sql = (
        f"INSERT INTO {table_name} (material_date, material_name, material_state, material_rate, material_change, material_change_rate) VALUES "
        + ",".join(processed_data)
    )
    cur.execute(sql)
    print("Data inserted successfully.")


def process_and_save_data(pickle_file, table_name, first):
    """데이터 처리 및 저장."""

    result_list = load_from_pickle(pickle_file)
    processed_data = process_material_data(result_list)

    con = get_db_connection()
    try:
        cur = con.cursor()
        insert_material_data(cur, table_name, processed_data, first)
        print(f"Data inserted into table {table_name}.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        con.close()


process_and_save_data(
    "data_jungle/data(domestic_petr_241126).p", "material_origin", True
)
process_and_save_data(
    "data_jungle/data(domestic_glob_241126).p", "material_origin", False
)

########################################################################################
########################################## 주식 #########################################
########################################################################################


def process_stock_data(pickle_file, table_name):
    with open(pickle_file, "rb") as f:
        result_list = pickle.load(f)

    con = get_db_connection()
    cur = con.cursor()
    sql = (
        f"INSERT INTO {table_name}(stock_date, stock_name, stock_name_origin, stock_state, stock_rate, stock_change, stock_high, stock_low, stock_volume, stock_change_rate) VALUES "
        + ",".join(result_list)
    )
    cur.execute(sql)
    con.close()


# Initialize table
con = get_db_connection()
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
con.close()

# Insert stock data
process_stock_data("data_jungle/data(stock_네이버_20241126).p", "stock_crawl")
process_stock_data("data_jungle/data(stock_삼성전자_20241126).p", "stock_crawl")
process_stock_data("data_jungle/data(stock_셀트리온_20241126).p", "stock_crawl")
process_stock_data("data_jungle/data(stock_HYBE엔터_20241126).p", "stock_crawl")

########################################################################################
########################################## 뉴스 #########################################
########################################################################################


def process_news_data(pickle_file, table_name):
    with open(pickle_file, "rb") as f:
        result_list = pickle.load(f)

    con = get_db_connection()
    cur = con.cursor()
    sql = (
        f"INSERT INTO {table_name}(news_date, news_name_origin, news_name, news_content) VALUES "
        + ",".join(result_list)
    )
    cur.execute(sql)
    con.close()


# Initialize table
con = get_db_connection()
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
con.close()

# Insert news data
process_news_data("data_jungle/data(news_네이버_241201).p", "news_origin")
process_news_data("data_jungle/data(news_삼성전자_241201).p", "news_origin")
process_news_data("data_jungle/data(news_셀트리온_241201).p", "news_origin")
process_news_data("data_jungle/data(news_HYBE엔터_241201).p", "news_origin")

#########################################################################
# SQL 파일 읽기 및 실행


def execute_sql_file(sql_file):
    with open(sql_file, "r", encoding="utf-8") as f:
        sql = f.read()

    con = get_db_connection()
    cur = con.cursor()
    try:
        for statement in sql.split(";"):
            if statement.strip():
                cur.execute(statement)
        print(f"SQL executed successfully for {sql_file}.")
    except Exception as e:
        print(f"Error occurred: {e}")
    finally:
        cur.close()
        con.close()


execute_sql_file("db_jungle/db_init.sql")
execute_sql_file("db_jungle/db_processing.sql")
