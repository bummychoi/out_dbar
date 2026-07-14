function list_all() {
    const today = document.getElementById("today")
        .textContent
        .split(" ")[0];

    window.open(
        "/out_dbar/list_all?date=" + encodeURIComponent(today),
        "_blank",
        "width=1400,height=900"
    );
}


function searchList() {

     const inDate = document.getElementById("in_date").value;
    const workType = document.getElementById("work_type").value;
    const company = document.getElementById("company").value;

    if (!inDate) {
        alert("조회일자를 선택하세요.");
        return;
    }

    location.href =
        "/out_dbar/list_all?" +
        "date=" + encodeURIComponent(inDate) +
        "&work_type=" + encodeURIComponent(workType) +
        "&company=" + encodeURIComponent(company);
}

function openIn(company, planId) {

    let url = "";

    if (company === "hyundai") {
        url = "/out_dbar/hyundai/in?ship_id=" + encodeURIComponent(planId);
    } else if (company === "dongkuk") {
        url = "/out_dbar/dongkuk/in?ship_id=" + encodeURIComponent(planId);
    } else {
        return;
    }

    window.open(
        url,
        "_blank",
        "width=1800,height=900,resizable=yes,scrollbars=yes"
    );
}