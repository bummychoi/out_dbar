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
        WHERE plan_id = %s
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

@hyundai_bp.route("/in/detail/<int:id>")
def in_detail(id):

    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            id,
            work_type,
            car_no,
            bundle_qty,
            weight_mt,
            location_no,
            remark
        FROM in_d
        WHERE id=%s
    """, (id,))

    row = cur.fetchone()

    cur.close()
    conn.close()

    return jsonify(row)


@hyundai_bp.route("/in/update", methods=["POST"])
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
        data["work_type"],
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

    return jsonify({"result":"ok"})


@hyundai_bp.route("/in/delete/<int:id>", methods=["POST"])
def delete_in(id):

    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        DELETE FROM in_d
        WHERE id=%s
    """, (id,))

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"result":"ok"})

@hyundai_bp.route("/day_summary/<int:plan_id>")
def day_summary(plan_id):

    conn = get_conn()
    cur = conn.cursor()

     # 예정 수량/톤수
    cur.execute("""
        SELECT bundle_qty, weight_mt
        FROM plan_d
        WHERE id = %s
    """, (plan_id,))
    plan = cur.fetchone()

    plan_bundle = float(plan["bundle_qty"])
    plan_weight = float(plan["weight_mt"])

    # 날짜/주야 집계
    cur.execute("""
        SELECT
            in_date,
            work_type,
            COUNT(*) AS truck_cnt,
            SUM(bundle_qty) AS bundle_qty,
            SUM(weight_mt) AS weight_mt
        FROM in_d
        WHERE plan_id = %s
        GROUP BY in_date, work_type
        ORDER BY in_date, FIELD(work_type, '주간', '야간')
    """, (plan_id,))

    rows = cur.fetchall()

    result = []

    remain_bundle = plan_bundle
    remain_weight = plan_weight

    for row in rows:
        remain_bundle -= float(row["bundle_qty"])
        remain_weight -= float(row["weight_mt"])

        result.append({
            "in_date": row["in_date"].strftime("%Y-%m-%d"),
            "work_type": row["work_type"],
            "truck_cnt": row["truck_cnt"],
            "bundle_qty": float(row["bundle_qty"]),
            "weight_mt": float(row["weight_mt"]),
            "remain_bundle": remain_bundle,
            "remain_weight": remain_weight
        })

    cur.close()
    conn.close()

    return jsonify(result)