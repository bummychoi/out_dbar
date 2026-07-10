from flask import Blueprint, render_template, request,jsonify
from db import get_conn

dongkuk_bp = Blueprint(
    "dongkuk",
    __name__,
    url_prefix="/out_dbar/dongkuk"
)

@dongkuk_bp.route("/in")
def dongkuk_in():

    plan_id = request.args.get("ship_id")

    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            id AS plan_id,
            ship_id,
            company,
            ship_month,
            vessel_name,
            color_name,
            steel_type,
            size_name,
            length_m,
            bundle_qty AS plan_qty,
            weight_mt AS plan_mt,
            created_at
        FROM plan_d
        WHERE id = %s
    """, (plan_id,))

    ship = cur.fetchone()

    cur.close()
    conn.close()

    if ship is None:
        return "선택한 입고계획을 찾을 수 없습니다.", 404

    return render_template(
        "out_dbar/dongkuk.html",
        ship=ship
    )


@dongkuk_bp.route("/in/update", methods=["POST"])
def update_in():

    data = request.get_json()

    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        UPDATE in_d
        SET
            work_type=%s,
            car_no=%s,
            bundle_qty=%s,
            weight_mt=%s,
            location_no=%s,
            remark=%s
        WHERE id=%s
    """, (
        data.get("work_type"),
        data.get("car_no"),
        data.get("bundle_qty"),
        data.get("weight_mt"),
        data.get("location_no"),
        data.get("remark"),
        data.get("id")
    ))

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"result": "ok"})


# 날짜별 집계
@dongkuk_bp.route("/summary/day/<int:plan_id>")
def summary_day(plan_id):

    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            in_date,
            work_type,
            COUNT(*) truck_cnt,
            SUM(bundle_qty) bundle_qty,
            SUM(weight_mt) weight_mt
        FROM in_d
        WHERE plan_id=%s
        GROUP BY
            in_date,
            work_type
        ORDER BY
            in_date,
            FIELD(work_type,'주간','야간')
    """, (plan_id,))

    rows = cur.fetchall()

    cur.close()
    conn.close()

    return jsonify(rows)