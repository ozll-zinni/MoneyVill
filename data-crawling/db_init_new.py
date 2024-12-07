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
        # host="database-2.cz4eukq2qs6a.ap-northeast-2.rds.amazonaws.com",
        host="localhost",
        # user="admin",
        user="root",
        # password="15Ovn241Pcd4eSvD3Ljn",
        password="e3pooq^^",
        db="modoostock",
        charset="utf8mb4",
        autocommit=True,
    )


def save_to_pickle(file_name, data):
    """Pickle 파일로 저장."""
    with open(file_name, "wb") as f:
        pickle.dump(data, f)


def load_from_pickle(file_name):
    """Pickle 파일에서 로드."""
    with open(file_name, "rb") as f:
        return pickle.load(f)


def batch_insert(cursor, table_name, data, batch_size=1000):
    """Batch insert data into the table."""
    for i in range(0, len(data), batch_size):
        batch = data[i : i + batch_size]
        sql = f"INSERT INTO {table_name} VALUES " + ",".join(batch)
        cursor.execute(sql)


########################################################################################
########################################## 환율 #########################################
########################################################################################
def process_currency_data(pickle_file, table_name):
    with open(pickle_file, "rb") as f:
        result_list = pickle.load(f)

    con = get_db_connection()
    try:
        with con.cursor() as cur:
            cur.execute(f"DROP TABLE IF EXISTS {table_name};")
            cur.execute(
                f"""
            CREATE TABLE {table_name} (
                cur_date DATE NOT NULL,
                cur_name VARCHAR(50) NOT NULL,
                cur_rate FLOAT NOT NULL
            ) CHARSET=utf8mb4;"""
            )
            batch_insert(cur, table_name, result_list, batch_size=1000)
            print("Currency data inserted successfully.")
    except Exception as e:
        print(f"Error inserting currency data: {e}")
    finally:
        con.close()


########################################################################################
########################################## 현물 #########################################
########################################################################################
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


def process_and_save_material_data(pickle_file, table_name, first):
    """현물 데이터 처리 및 저장."""
    result_list = load_from_pickle(pickle_file)
    processed_data = process_material_data(result_list)

    con = get_db_connection()
    try:
        with con.cursor() as cur:
            if first:
                cur.execute(f"DROP TABLE IF EXISTS {table_name};")
                cur.execute(
                    f"""
                CREATE TABLE {table_name} (
                    material_date DATE NOT NULL,
                    material_name VARCHAR(100) NOT NULL,
                    material_state VARCHAR(50),
                    material_rate FLOAT NOT NULL,
                    material_change FLOAT,
                    material_change_rate FLOAT
                ) CHARSET=utf8mb4;"""
                )
            batch_insert(cur, table_name, processed_data, batch_size=1000)
            print(f"Material data inserted into table {table_name}.")
    except Exception as e:
        print(f"Error inserting material data: {e}")
    finally:
        con.close()


########################################################################################
########################################## 주식 #########################################
########################################################################################
def process_stock_data(pickle_file, table_name):
    with open(pickle_file, "rb") as f:
        result_list = pickle.load(f)

    con = get_db_connection()
    try:
        with con.cursor() as cur:
            batch_insert(cur, table_name, result_list, batch_size=1000)
            print(f"Stock data inserted into table {table_name}.")
    except Exception as e:
        print(f"Error inserting stock data: {e}")
    finally:
        con.close()


def initialize_stock_table(table_name):
    con = get_db_connection()
    try:
        with con.cursor() as cur:
            cur.execute(f"DROP TABLE IF EXISTS {table_name};")
            cur.execute(
                f"""
            CREATE TABLE {table_name} (
                stock_date DATE NOT NULL,
                stock_name VARCHAR(50) NOT NULL,
                stock_name_origin VARCHAR(50) NOT NULL,
                stock_state VARCHAR(10) NOT NULL,
                stock_rate INT NOT NULL,
                stock_change VARCHAR(10) NOT NULL,
                stock_low INT NOT NULL,
                stock_high INT NOT NULL,
                stock_volume INT NOT NULL,
                stock_dividend INT NOT NULL,
                stock_change_rate FLOAT NOT NULL
            ) CHARSET=utf8mb4;"""
            )
            print(f"Stock table {table_name} initialized.")
    except Exception as e:
        print(f"Error initializing stock table: {e}")
    finally:
        con.close()


########################################################################################
########################################## 뉴스 #########################################
########################################################################################
def process_news_data(pickle_file, table_name, batch_size=1000):
    with open(pickle_file, "rb") as f:
        result_list = pickle.load(f)

    con = get_db_connection()
    try:
        with con.cursor() as cur:
            for i in range(0, len(result_list), batch_size):
                batch = result_list[i : i + batch_size]
                sql = (
                    f"INSERT INTO {table_name}(news_date, news_name_origin, news_name, news_content) VALUES "
                    + ",".join(batch)
                )
                cur.execute(sql)
            print(f"News data inserted into table {table_name}.")
    except Exception as e:
        print(f"Error inserting news data: {e}")
    finally:
        con.close()


def initialize_news_table(table_name):
    con = get_db_connection()
    try:
        with con.cursor() as cur:
            cur.execute(f"DROP TABLE IF EXISTS {table_name};")
            cur.execute(
                f"""
            CREATE TABLE {table_name} (
                news_date DATE NOT NULL,
                news_name_origin VARCHAR(50) NOT NULL,
                news_name VARCHAR(50) NOT NULL,
                news_content TEXT NOT NULL,
                PRIMARY KEY (news_date, news_name_origin, news_content(255))
            ) CHARSET=utf8mb4;"""
            )
            print(f"News table {table_name} initialized.")
    except Exception as e:
        print(f"Error initializing news table: {e}")
    finally:
        con.close()


########################################################################################
########################################## 실행 #########################################
########################################################################################
# Currency 데이터 처리
process_currency_data("data_jungle/data(cur_20241126).p", "currency")

# Material 데이터 처리
process_and_save_material_data(
    "data_jungle/data(domestic_petr_241126).p", "material_origin", True
)
process_and_save_material_data(
    "data_jungle/data(domestic_glob_241126).p", "material_origin", False
)

# Stock 데이터 처리
initialize_stock_table("stock_crawl")
process_stock_data("data_jungle/data(stock_네이버_20241126).p", "stock_crawl")
process_stock_data("data_jungle/data(stock_삼성전자_20241126).p", "stock_crawl")
process_stock_data("data_jungle/data(stock_LG화학_20241126).p", "stock_crawl")
process_stock_data("data_jungle/data(stock_셀트리온_20241126).p", "stock_crawl")
process_stock_data("data_jungle/data(stock_SM엔터_20241126).p", "stock_crawl")
process_stock_data("data_jungle/data(stock_LG전자_20241126).p", "stock_crawl")
process_stock_data("data_jungle/data(stock_롯데케미칼_20241126).p", "stock_crawl")
process_stock_data("data_jungle/data(stock_녹십자_20241126).p", "stock_crawl")
process_stock_data("data_jungle/data(stock_SK텔레콤_20241126).p", "stock_crawl")
process_stock_data("data_jungle/data(stock_HYBE엔터_20241126).p", "stock_crawl")

# News 데이터 처리
initialize_news_table("news_origin")
process_news_data("data_jungle/data(news_네이버_241203).p", "news_origin")
process_news_data("data_jungle/data(news_삼성전자_241203).p", "news_origin")
process_news_data("data_jungle/data(news_LG화학_241203).p", "news_origin")
process_news_data("data_jungle/data(news_셀트리온_241203).p", "news_origin")
process_news_data("data_jungle/data(news_SM엔터_241203).p", "news_origin")
process_news_data("data_jungle/data(news_LG전자_241203).p", "news_origin")
process_news_data("data_jungle/data(news_롯데케미칼_241203).p", "news_origin")
process_news_data("data_jungle/data(news_녹십자_241203).p", "news_origin")
process_news_data("data_jungle/data(news_SK텔레콤_241203).p", "news_origin")
process_news_data("data_jungle/data(news_HYBE엔터_241203).p", "news_origin")


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
