from flask import Blueprint, render_template,jsonify,request
from db import get_conn
from datetime import date

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
            d.id AS plan_id,
            m.id AS ship_id,
            m.company,
            m.ship_month,
            m.vessel_name,
            d.color_name,
            d.size_name,
            d.steel_type,
            d.length_m,

            IFNULL(d.bundle_qty, 0) AS total_bundle,
            IFNULL(d.weight_mt, 0) AS total_weight,

            IFNULL(i.in_bundle, 0) AS in_bundle,
            IFNULL(i.in_weight, 0) AS in_weight,

            IFNULL(o.ship_bundle, 0) AS ship_bundle,
            IFNULL(o.ship_weight, 0) AS ship_weight,

            IFNULL(o.return_bundle, 0) AS return_bundle,
            IFNULL(o.return_weight, 0) AS return_weight,

            (
                IFNULL(i.in_bundle, 0)
                - IFNULL(o.ship_bundle, 0)
                - IFNULL(o.return_bundle, 0)
            ) AS stock_bundle,

            (
                IFNULL(i.in_weight, 0)
                - IFNULL(o.ship_weight, 0)
                - IFNULL(o.return_weight, 0)
            ) AS stock_weight,

            d.created_at AS created_at

        FROM ship_m m

        JOIN plan_d d
            ON m.id = d.ship_id

        LEFT JOIN (
            SELECT
                plan_id,
                SUM(bundle_qty) AS in_bundle,
                SUM(weight_mt) AS in_weight
            FROM in_d
            GROUP BY plan_id
        ) i
            ON d.id = i.plan_id

        LEFT JOIN (
            SELECT
                plan_id,

                SUM(
                    CASE
                        WHEN outbound_type = '선적'
                        THEN bundle_qty
                        ELSE 0
                    END
                ) AS ship_bundle,

                SUM(
                    CASE
                        WHEN outbound_type = '선적'
                        THEN weight_mt
                        ELSE 0
                    END
                ) AS ship_weight,

                SUM(
                    CASE
                        WHEN outbound_type = '반품'
                        THEN bundle_qty
                        ELSE 0
                    END
                ) AS return_bundle,

                SUM(
                    CASE
                        WHEN outbound_type = '반품'
                        THEN weight_mt
                        ELSE 0
                    END
                ) AS return_weight

            FROM outbound_d
            GROUP BY plan_id
        ) o
            ON d.id = o.plan_id

        WHERE m.company = 'hyundai'

        ORDER BY d.created_at DESC
    """)

    hyundai_list = cur.fetchall()

    # 동국제강
    cur.execute("""
        SELECT
            d.id AS plan_id,
            m.id AS ship_id,
            m.company,
            m.ship_month,
            m.vessel_name,
            d.color_name,
            d.size_name,
            d.steel_type,
            d.length_m,

            IFNULL(d.bundle_qty, 0) AS total_bundle,
            IFNULL(d.weight_mt, 0) AS total_weight,

            IFNULL(i.in_bundle, 0) AS in_bundle,
            IFNULL(i.in_weight, 0) AS in_weight,

            IFNULL(o.ship_bundle, 0) AS ship_bundle,
            IFNULL(o.ship_weight, 0) AS ship_weight,

            IFNULL(o.return_bundle, 0) AS return_bundle,
            IFNULL(o.return_weight, 0) AS return_weight,

            (
                IFNULL(i.in_bundle, 0)
                - IFNULL(o.ship_bundle, 0)
                - IFNULL(o.return_bundle, 0)
            ) AS stock_bundle,

            (
                IFNULL(i.in_weight, 0)
                - IFNULL(o.ship_weight, 0)
                - IFNULL(o.return_weight, 0)
            ) AS stock_weight,

            d.created_at AS created_at

        FROM ship_m m

        JOIN plan_d d
            ON m.id = d.ship_id

        LEFT JOIN (
            SELECT
                plan_id,
                SUM(bundle_qty) AS in_bundle,
                SUM(weight_mt) AS in_weight
            FROM in_d
            GROUP BY plan_id
        ) i
            ON d.id = i.plan_id

        LEFT JOIN (
            SELECT
                plan_id,

                SUM(
                    CASE
                        WHEN outbound_type = '선적'
                        THEN bundle_qty
                        ELSE 0
                    END
                ) AS ship_bundle,

                SUM(
                    CASE
                        WHEN outbound_type = '선적'
                        THEN weight_mt
                        ELSE 0
                    END
                ) AS ship_weight,

                SUM(
                    CASE
                        WHEN outbound_type = '반품'
                        THEN bundle_qty
                        ELSE 0
                    END
                ) AS return_bundle,

                SUM(
                    CASE
                        WHEN outbound_type = '반품'
                        THEN weight_mt
                        ELSE 0
                    END
                ) AS return_weight

            FROM outbound_d
            GROUP BY plan_id
        ) o
            ON d.id = o.plan_id

        WHERE m.company = 'dongkuk'

        ORDER BY d.created_at DESC
    """)

    dongkuk_list = cur.fetchall()

    # 예정 합계
    hyundai_total_bundle = sum(
        row["total_bundle"] or 0
        for row in hyundai_list
    )

    hyundai_total_weight = sum(
        row["total_weight"] or 0
        for row in hyundai_list
    )

    dongkuk_total_bundle = sum(
        row["total_bundle"] or 0
        for row in dongkuk_list
    )

    dongkuk_total_weight = sum(
        row["total_weight"] or 0
        for row in dongkuk_list
    )

    cur.close()
    conn.close()

    return render_template(
        "out_dbar/main.html",

        hyundai_list=hyundai_list,
        dongkuk_list=dongkuk_list,

        hyundai_cnt=len(
            set(row["ship_id"] for row in hyundai_list)
        ),

        dongkuk_cnt=len(
            set(row["ship_id"] for row in dongkuk_list)
        ),

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
    # for row in details:
    #     print("id:", row["id"], "color_name:", row["color_name"])
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


@out_dbar_bp.route("/list_all")
def list_all():

    in_date = request.args.get("date", "")
    work_type = request.args.get("work_type", "")
    company = request.args.get("company", "")

    conn = get_conn()
    cur = conn.cursor()

    # =========================
    # 상세 집계
    # =========================
    sql = """
        SELECT
            p.id AS plan_id,
            i.work_type,
            p.company,
            p.vessel_name,
            p.color_name,
            p.steel_type,
            p.size_name,
            p.length_m,

            COUNT(*) AS truck_cnt,
            IFNULL(SUM(i.bundle_qty), 0) AS bundle_qty,
            IFNULL(SUM(i.weight_mt), 0) AS weight_mt

        FROM in_d i

        JOIN plan_d p
            ON i.plan_id = p.id

        WHERE i.in_date = %s
    """

    params = [in_date]

    if work_type:
        sql += " AND i.work_type = %s"
        params.append(work_type)

    if company:
        sql += " AND p.company = %s"
        params.append(company)

    sql += """
        GROUP BY
            p.id,
            i.work_type,
            p.company,
            p.vessel_name,
            p.color_name,
            p.steel_type,
            p.size_name,
            p.length_m

        ORDER BY
            i.work_type,
            p.company,
            p.vessel_name,
            p.color_name,
            p.steel_type,
            p.size_name,
            p.length_m
    """

    cur.execute(sql, tuple(params))
    rows = cur.fetchall()

    # =========================
    # 상단 전체 합계
    # =========================
    total_sql = """
        SELECT
            COUNT(*) AS total_truck,
            IFNULL(SUM(i.bundle_qty), 0) AS total_bundle,
            IFNULL(SUM(i.weight_mt), 0) AS total_weight

        FROM in_d i

        JOIN plan_d p
            ON i.plan_id = p.id

        WHERE i.in_date = %s
    """

    total_params = [in_date]

    if work_type:
        total_sql += " AND i.work_type = %s"
        total_params.append(work_type)

    if company:
        total_sql += " AND p.company = %s"
        total_params.append(company)

    cur.execute(total_sql, tuple(total_params))
    total = cur.fetchone()

    total_truck = int(total["total_truck"] or 0)
    total_bundle = int(total["total_bundle"] or 0)
    total_weight = float(total["total_weight"] or 0)

    cur.close()
    conn.close()

    return render_template(
        "list_all.html",
        in_date=in_date,
        work_type=work_type,
        company=company,
        rows=rows,
        total_truck=total_truck,
        total_bundle=total_bundle,
        total_weight=total_weight
    )
# =========================================================
# 저장구역 문자열 정리
# =========================================================
def normalize_location(location_no):

    value = str(location_no or "").strip()

    return (
        value
        .replace(" ", "")
        .replace("\t", "")
        .replace("\n", "")
        .replace("\r", "")
        .replace("–", "-")
        .replace("—", "-")
        .replace("－", "-")
    )


# =========================================================
# 선적 화면
# =========================================================
@out_dbar_bp.route("/ship")
def ship():

    plan_id = request.args.get("plan_id", type=int)

    if not plan_id:
        return "계획 정보가 없습니다.", 400

    conn = get_conn()
    cur = conn.cursor()

    try:
        # 품목 정보
        cur.execute("""
            SELECT
                d.id AS plan_id,
                m.vessel_name,
                d.color_name,
                d.steel_type,
                d.size_name,
                d.length_m
            FROM plan_d d
            JOIN ship_m m
                ON d.ship_id = m.id
            WHERE d.id = %s
        """, (plan_id,))

        plan = cur.fetchone()

        if not plan:
            return "해당 계획을 찾을 수 없습니다.", 404

        # 저장구역 정규화 표현식
        #
        # 일반 공백, 탭, 줄바꿈, CR 제거
        # 특수 하이픈을 일반 하이픈으로 통일
        #
        # 예:
        # 5-2-L
        # 5-2-L_
        # 5－2－L
        # 모두 5-2-L로 집계
        location_expr_in = """
            REPLACE(
                REPLACE(
                    REPLACE(
                        REPLACE(
                            REPLACE(
                                REPLACE(
                                    REPLACE(
                                        TRIM(location_no),
                                        ' ',
                                        ''
                                    ),
                                    CHAR(9),
                                    ''
                                ),
                                CHAR(10),
                                ''
                            ),
                            CHAR(13),
                            ''
                        ),
                        '–',
                        '-'
                    ),
                    '—',
                    '-'
                ),
                '－',
                '-'
            )
        """

        # 저장구역별 입고 / 선적 / 잔량 집계
        sql = f"""
            SELECT
                i.location_no,

                i.in_bundle,
                i.in_weight,

                IFNULL(o.ship_bundle, 0) AS ship_bundle,
                IFNULL(o.ship_weight, 0) AS ship_weight,

                i.in_bundle
                    - IFNULL(o.ship_bundle, 0)
                    AS remain_bundle,

                i.in_weight
                    - IFNULL(o.ship_weight, 0)
                    AS remain_weight

            FROM (
                SELECT
                    plan_id,

                    {location_expr_in} AS location_no,

                    IFNULL(SUM(bundle_qty), 0) AS in_bundle,
                    IFNULL(SUM(weight_mt), 0) AS in_weight

                FROM in_d

                WHERE plan_id = %s

                GROUP BY
                    plan_id,
                    {location_expr_in}
            ) i

            LEFT JOIN (
                SELECT
                    plan_id,

                    {location_expr_in} AS location_no,

                    IFNULL(SUM(bundle_qty), 0) AS ship_bundle,
                    IFNULL(SUM(weight_mt), 0) AS ship_weight

                FROM outbound_d

                WHERE plan_id = %s
                  AND outbound_type = '선적'

                GROUP BY
                    plan_id,
                    {location_expr_in}
            ) o
                ON i.plan_id = o.plan_id
               AND i.location_no = o.location_no

            ORDER BY i.location_no
        """

        cur.execute(sql, (
            plan_id,
            plan_id
        ))

        location_list = cur.fetchall()

        # 선적 이력
        cur.execute("""
            SELECT
                id,
                plan_id,
                outbound_date,
                outbound_type,
                work_shift,
                location_no,
                bundle_qty,
                weight_mt,
                remark,
                created_at
            FROM outbound_d
            WHERE plan_id = %s
              AND outbound_type = '선적'
            ORDER BY
                outbound_date DESC,
                created_at DESC,
                id DESC
        """, (plan_id,))

        outbound_list = cur.fetchall()

        return render_template(
            "out_dbar/ship.html",
            plan=plan,
            location_list=location_list,
            outbound_list=outbound_list,
            today=date.today().strftime("%Y-%m-%d")
        )

    finally:
        cur.close()
        conn.close()


# =========================================================
# 선적 저장
# =========================================================
@out_dbar_bp.route("/ship/save", methods=["POST"])
def ship_save():

    data = request.get_json(silent=True) or {}

    plan_id = data.get("plan_id")
    outbound_date = data.get("out_date")
    outbound_type = data.get("out_type", "선적")
    work_shift = data.get("work_shift")

    location_no = normalize_location(
        data.get("location_no")
    )

    bundle_qty = data.get("bundle_qty")
    weight_mt = data.get("weight_mt")
    remark = str(data.get("remark", "")).strip()

    try:
        plan_id = int(plan_id)
        bundle_qty = int(bundle_qty)
        weight_mt = float(weight_mt)

    except (TypeError, ValueError):
        return jsonify({
            "ok": False,
            "message": "선적수량 또는 선적톤수가 올바르지 않습니다."
        }), 400

    if not outbound_date:
        return jsonify({
            "ok": False,
            "message": "선적일자를 입력하세요."
        }), 400

    if outbound_type != "선적":
        return jsonify({
            "ok": False,
            "message": "출고구분이 올바르지 않습니다."
        }), 400

    if work_shift not in ("주간", "야간"):
        return jsonify({
            "ok": False,
            "message": "주간 또는 야간을 선택하세요."
        }), 400

    if not location_no:
        return jsonify({
            "ok": False,
            "message": "저장구역을 선택하세요."
        }), 400

    if bundle_qty <= 0:
        return jsonify({
            "ok": False,
            "message": "선적수량은 1 이상이어야 합니다."
        }), 400

    if weight_mt <= 0:
        return jsonify({
            "ok": False,
            "message": "선적톤수는 0보다 커야 합니다."
        }), 400

    conn = get_conn()
    cur = conn.cursor()

    try:
        cur.execute("""
            INSERT INTO outbound_d
            (
                plan_id,
                outbound_date,
                outbound_type,
                work_shift,
                location_no,
                bundle_qty,
                weight_mt,
                remark
            )
            VALUES
            (
                %s, %s, %s, %s,
                %s, %s, %s, %s
            )
        """, (
            plan_id,
            outbound_date,
            "선적",
            work_shift,
            location_no,
            bundle_qty,
            weight_mt,
            remark
        ))

        conn.commit()

        return jsonify({
            "ok": True,
            "message": "선적 저장 완료"
        })

    except Exception as e:
        conn.rollback()

        print("선적 저장 오류:", e)

        return jsonify({
            "ok": False,
            "message": "선적 저장 중 오류가 발생했습니다."
        }), 500

    finally:
        cur.close()
        conn.close()


# =========================================================
# 선적 상세조회
# =========================================================
@out_dbar_bp.route("/ship/detail/<int:outbound_id>")
def ship_detail(outbound_id):

    conn = get_conn()
    cur = conn.cursor()

    try:
        cur.execute("""
            SELECT
                id,
                outbound_date,
                outbound_type,
                work_shift,
                location_no,
                bundle_qty,
                weight_mt,
                remark
            FROM outbound_d
            WHERE id = %s
              AND outbound_type = '선적'
        """, (outbound_id,))

        row = cur.fetchone()

        if not row:
            return jsonify({
                "ok": False,
                "message": "선적 내역을 찾지 못했습니다."
            }), 404

        return jsonify({
            "ok": True,
            "id": row["id"],
            "outbound_date": str(row["outbound_date"]),
            "outbound_type": row["outbound_type"],
            "work_shift": row["work_shift"],
            "location_no": normalize_location(
                row["location_no"]
            ),
            "bundle_qty": int(row["bundle_qty"] or 0),
            "weight_mt": float(row["weight_mt"] or 0),
            "remark": row["remark"] or ""
        })

    except Exception as e:
        print("선적 상세 조회 오류:", e)

        return jsonify({
            "ok": False,
            "message": "선적 정보를 불러오는 중 오류가 발생했습니다."
        }), 500

    finally:
        cur.close()
        conn.close()


# =========================================================
# 선적 수정
# =========================================================
@out_dbar_bp.route("/ship/update", methods=["POST"])
def ship_update():

    data = request.get_json(silent=True) or {}

    outbound_id = data.get("id")
    outbound_date = data.get("outbound_date")
    work_shift = data.get("work_shift")

    location_no = normalize_location(
        data.get("location_no")
    )

    bundle_qty = data.get("bundle_qty")
    weight_mt = data.get("weight_mt")
    remark = str(data.get("remark", "")).strip()

    try:
        outbound_id = int(outbound_id)
        bundle_qty = int(bundle_qty)
        weight_mt = float(weight_mt)

    except (TypeError, ValueError):
        return jsonify({
            "ok": False,
            "message": "선적수량 또는 선적톤수가 올바르지 않습니다."
        }), 400

    if not outbound_date:
        return jsonify({
            "ok": False,
            "message": "선적일자를 입력하세요."
        }), 400

    if work_shift not in ("주간", "야간"):
        return jsonify({
            "ok": False,
            "message": "주간 또는 야간을 선택하세요."
        }), 400

    if not location_no:
        return jsonify({
            "ok": False,
            "message": "저장구역 정보가 없습니다."
        }), 400

    if bundle_qty <= 0:
        return jsonify({
            "ok": False,
            "message": "선적수량은 1 이상이어야 합니다."
        }), 400

    if weight_mt <= 0:
        return jsonify({
            "ok": False,
            "message": "선적톤수는 0보다 커야 합니다."
        }), 400

    conn = get_conn()
    cur = conn.cursor()

    try:
        cur.execute("""
            SELECT id
            FROM outbound_d
            WHERE id = %s
              AND outbound_type = '선적'
        """, (outbound_id,))

        exists = cur.fetchone()

        if not exists:
            return jsonify({
                "ok": False,
                "message": "수정할 선적 내역을 찾지 못했습니다."
            }), 404

        cur.execute("""
            UPDATE outbound_d
            SET
                outbound_date = %s,
                work_shift = %s,
                location_no = %s,
                bundle_qty = %s,
                weight_mt = %s,
                remark = %s
            WHERE id = %s
              AND outbound_type = '선적'
        """, (
            outbound_date,
            work_shift,
            location_no,
            bundle_qty,
            weight_mt,
            remark,
            outbound_id
        ))

        conn.commit()

        return jsonify({
            "ok": True,
            "message": "선적 내역이 수정되었습니다."
        })

    except Exception as e:
        conn.rollback()

        print("선적 수정 오류:", e)

        return jsonify({
            "ok": False,
            "message": "선적 수정 중 오류가 발생했습니다."
        }), 500

    finally:
        cur.close()
        conn.close()


# =========================================================
# 선적 삭제
# =========================================================


@out_dbar_bp.route("/ship/delete/<int:outbound_id>", methods=["POST"])
def ship_delete(outbound_id):

    conn = get_conn()
    cur = conn.cursor()

    try:

        cur.execute("""
            DELETE
            FROM outbound_d
            WHERE id = %s
              AND outbound_type='선적'
        """, (outbound_id,))

        if cur.rowcount == 0:

            conn.rollback()

            return jsonify({
                "ok": False,
                "message": "삭제할 선적 내역이 없습니다."
            }), 404

        conn.commit()

        return jsonify({
            "ok": True,
            "message": "선적 내역이 삭제되었습니다."
        })

    except Exception as e:

        conn.rollback()

        print("선적 삭제 오류 :", e)

        return jsonify({
            "ok": False,
            "message": "삭제 중 오류가 발생했습니다."
        }), 500

    finally:

        cur.close()
        conn.close()