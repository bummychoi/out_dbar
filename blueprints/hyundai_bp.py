from flask import Blueprint, render_template, request
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