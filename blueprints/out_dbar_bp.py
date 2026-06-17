from flask import Blueprint, render_template

out_dbar_bp = Blueprint(
    "out_dbar",
    __name__,
    url_prefix="/out_dbar"
)

# 메인 현황판
@out_dbar_bp.route("/")
def main():
    return render_template("out_dbar/main.html")

    
# 리스트 입력창
@out_dbar_bp.route("/list_up")
def list_up():
    return render_template("out_dbar/list_up.html")





# 현대제철 입고관리
@out_dbar_bp.route("/hyundai")
def hyundai():
    return render_template("out_dbar/hyundai.html")


# 동국제강 입고관리
@out_dbar_bp.route("/dongkuk")
def dongkuk():
    return render_template("out_dbar/dongkuk.html")