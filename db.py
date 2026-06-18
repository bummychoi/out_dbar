# db.py

import pymysql


def get_conn():

    return pymysql.connect(
        host="localhost",
        user="root",
        password="0001",
        database="hangsa",   # ← 여기
        charset="utf8mb4",
        autocommit=False,
        cursorclass=pymysql.cursors.DictCursor
    )