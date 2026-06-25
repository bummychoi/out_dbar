from flask import Blueprint, render_template, request,jsonify
from db import get_conn

hyundai_bp = Blueprint(
    "hyundai",
    __name__,
    url_prefix="/out_dbar/hyundai"
)

@hyundai_bp.route("/in")
def hyundai_in():
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
        "out_dbar/hyundai.html",
        ship=ship
    )
@hyundai_bp.route("/in/save", methods=["POST"])
def save_in():

    try:

        data = request.get_json()
        print(data)

        conn = get_conn()
        cur = conn.cursor()

        cur.execute("""
            INSERT INTO in_d
            (
                plan_id,
                in_date,
                work_type,
                car_no,
                bundle_qty,
                weight_mt,
                location_no,
                remark
            )
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            data.get("plan_id"),
            data.get("in_date"),
            data.get("work_type"),
            data.get("car_no"),
            data.get("bundle_qty"),
            data.get("weight_mt"),
            data.get("location_no"),
            data.get("remark")
        ))
        print(data)
        conn.commit()

        return jsonify({"result":"ok"})

    except Exception as e:

        print("ERROR =", e)

        return jsonify({
            "result":"fail",
            "message":str(e)
        })

    finally:

        cur.close()
        conn.close()

@hyundai_bp.route("/in/list/<int:plan_id>")
def in_list(plan_id):

    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            id,
            in_date,
            work_type,
            car_no,
            bundle_qty,
            weight_mt,
            location_no,
            remark,
            created_at
        FROM in_d
        WHERE plan_id=%s
        ORDER BY id DESC
    """, (plan_id,))

    rows = cur.fetchall()

    result = []

    for row in rows:

        result.append({
            "id": row["id"],
            "in_date": row["in_date"].strftime("%Y-%m-%d"),
            "work_type": row["work_type"],
            "car_no": row["car_no"],
            "bundle_qty": float(row["bundle_qty"]),
            "weight_mt": float(row["weight_mt"]),
            "location_no": row["location_no"] or "",
            "remark": row["remark"] or "",
            "created_time": row["created_at"].strftime("%H:%M:%S")
        })

    cur.close()
    conn.close()

    return jsonify(result)