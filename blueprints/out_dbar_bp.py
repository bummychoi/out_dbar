from flask import Blueprint, render_template,jsonify,request
from db import get_conn

out_dbar_bp = Blueprint(
    "out_dbar",
    __name__,
    url_prefix="/out_dbar"
)

# 메인 현황판
@out_dbar_bp.route("/")
def main():

    conn = get_conn()
    cur = conn.cursor()

    # 현대제철
    cur.execute("""
        SELECT
            m.id,
            m.ship_month,
            m.vessel_name,
            d.color_name,
            d.size_name,
            d.steel_type,
            d.length_m,
            IFNULL(SUM(d.bundle_qty), 0) AS total_bundle,
            IFNULL(SUM(d.weight_mt), 0) AS total_weight,
            MAX(d.created_at) AS created_at
        FROM ship_m m
        JOIN plan_d d
            ON m.id = d.ship_id
        WHERE m.company='hyundai'
        GROUP BY
            m.id,
            m.ship_month,
            m.vessel_name,
            d.color_name,
            d.size_name,
            d.steel_type,
            d.length_m
        ORDER BY
            m.ship_month,
            m.vessel_name,
            d.color_name,
            d.size_name,
            d.steel_type,
            d.length_m
    """)
    hyundai_list = cur.fetchall()

    # 동국제강
    cur.execute("""
        SELECT
            m.id,
            m.ship_month,
            m.vessel_name,
            d.color_name,
            d.size_name,
            d.steel_type,
            d.length_m,
            IFNULL(SUM(d.bundle_qty), 0) AS total_bundle,
            IFNULL(SUM(d.weight_mt), 0) AS total_weight,
            MAX(d.created_at) AS created_at
        FROM ship_m m
        JOIN plan_d d
            ON m.id = d.ship_id
        WHERE m.company='dongkuk'
        GROUP BY
            m.id,
            m.ship_month,
            m.vessel_name,
            d.color_name,
            d.size_name,
            d.steel_type,
            d.length_m
        ORDER BY
            m.ship_month,
            m.vessel_name,
            d.color_name,
            d.size_name,
            d.steel_type,
            d.length_m
    """)
    dongkuk_list = cur.fetchall()

    # 합계
    hyundai_total_bundle = sum(row["total_bundle"] for row in hyundai_list)
    hyundai_total_weight = sum(row["total_weight"] for row in hyundai_list)

    dongkuk_total_bundle = sum(row["total_bundle"] for row in dongkuk_list)
    dongkuk_total_weight = sum(row["total_weight"] for row in dongkuk_list)

    cur.close()
    conn.close()

    return render_template(
        "out_dbar/main.html",
        hyundai_list=hyundai_list,
        dongkuk_list=dongkuk_list,
        hyundai_cnt=len(set(row["id"] for row in hyundai_list)),
        dongkuk_cnt=len(set(row["id"] for row in dongkuk_list)),
        hyundai_total_bundle=hyundai_total_bundle,
        hyundai_total_weight=hyundai_total_weight,
        dongkuk_total_bundle=dongkuk_total_bundle,
        dongkuk_total_weight=dongkuk_total_weight
    )



@out_dbar_bp.route("/shipment_save", methods=["POST"])
def shipment_save():

    data = request.get_json()

    company = data.get("company")
    ship_month = data.get("shipMonth")
    vessel_name = data.get("shipmentName")

    conn = get_conn()
    cur = conn.cursor()

    # 중복체크
    cur.execute("""
        SELECT COUNT(*) AS cnt
        FROM ship_m
        WHERE company=%s
          AND ship_month=%s
          AND vessel_name=%s
    """, (company, ship_month, vessel_name))


    cnt = cur.fetchone()["cnt"]

    if cnt > 0:
        return jsonify({
            "result":"fail",
            "message":"이미 등록되어 있습니다."
        })

    cur.execute("""
        INSERT INTO ship_m
        (
            company,
            ship_month,
            vessel_name
        )
        VALUES(%s,%s,%s)
    """, (
        company,
        ship_month,
        vessel_name
    ))

    conn.commit()

    cur.close()
    conn.close()

    return jsonify({
        "result":"ok",
        "message":"저장 완료"
    })



# 리스트 입력창
@out_dbar_bp.route("/list_up")
def list_up():
    ship_id = request.args.get("ship_id")

    conn = get_conn()
    cur = conn.cursor()

    details = []

    ship = None
    
    if ship_id:
        cur.execute("""
            SELECT *
            FROM ship_m
            WHERE id=%s
        """, (ship_id,))
        ship = cur.fetchone()

        cur.execute("""
            SELECT *
            FROM plan_d
            WHERE ship_id=%s
            ORDER BY id
        """, (ship_id,))
        details = cur.fetchall()

    cur.close()
    conn.close()

    return render_template(
            "out_dbar/list_up.html",
            ship=ship,
            details=details
        )

# 목록리스트 저장
@out_dbar_bp.route("/save_plan", methods=["POST"])
def save_plan():

    data = request.get_json()

    company = data.get("company")
    ship_month = data.get("shipMonth")
    vessel_name = data.get("shipmentName")
    details = data.get("details", [])

    conn = get_conn()
    cur = conn.cursor()

    # 1. 본선 id 조회
    cur.execute("""
        SELECT id
        FROM ship_m
        WHERE company=%s
          AND ship_month=%s
          AND vessel_name=%s
    """, (company, ship_month, vessel_name))

    ship = cur.fetchone()

    if not ship:
        cur.close()
        conn.close()

        return jsonify({
            "result": "fail",
            "message": "본선 등록이 없습니다. 먼저 등록하세요."
        })

    ship_id = ship["id"]

    # 2. 기존 상세 삭제
    cur.execute("""
        DELETE FROM plan_d
        WHERE ship_id=%s
    """, (ship_id,))

    # 3. 다시 저장
    for row in details:
        cur.execute("""
            INSERT INTO plan_d
            (
                ship_id,
                company,
                ship_month,
                vessel_name,
                color_name,
                steel_type,
                size_name,
                length_m,
                bundle_qty,
                weight_mt
            )
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            ship_id,
            company,
            ship_month,
            vessel_name,
            row.get("color_name"),
            row.get("steel_type"),
            row.get("size_name"),
            row.get("length_m"),
            row.get("bundle_qty"),
            row.get("weight_mt")
        ))

    conn.commit()

    cur.close()
    conn.close()

    return jsonify({
        "result": "ok",
        "message": "상세내역 저장 완료"
    })

# 본선전체 삭제
@out_dbar_bp.route("/delete_ship_all", methods=["POST"])
def delete_ship_all():

    data = request.get_json()
    ship_id = data.get("ship_id")

    conn = get_conn()
    cur = conn.cursor()

    # 상세 삭제
    cur.execute("""
        DELETE FROM plan_d
        WHERE ship_id=%s
    """, (ship_id,))

    # 본선 삭제
    cur.execute("""
        DELETE FROM ship_m
        WHERE id=%s
    """, (ship_id,))

    conn.commit()

    cur.close()
    conn.close()

    return jsonify({
        "result":"ok",
        "message":"본선 전체 삭제 완료"
    })

# 한건 삭제
@out_dbar_bp.route("/delete_detail", methods=["POST"])
def delete_detail():

    data = request.get_json()

    detail_id = data.get("id")

    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        DELETE FROM plan_d
        WHERE id=%s
    """, (detail_id,))

    conn.commit()

    cur.close()
    conn.close()

    return jsonify({
        "result":"ok",
        "message":"삭제 완료"
    })


# 현대제철 입고관리
@out_dbar_bp.route("/hyundai")
def hyundai():
    return render_template("out_dbar/hyundai.html")


# 동국제강 입고관리
@out_dbar_bp.route("/dongkuk")
def dongkuk():
    return render_template("out_dbar/dongkuk.html")