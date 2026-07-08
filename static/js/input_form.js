function changeCompany() {

    const company = document.getElementById("company").value;

    document.querySelectorAll("#detailTable tbody tr").forEach(function (row) {

        const firstTd = row.querySelector("td:first-child");

        if (company === "dongkuk") {
            firstTd.innerHTML = `
                <input type="text" class="color-name" placeholder="배선번호 입력">
            `;
        } else {
            firstTd.innerHTML = `
                <select class="color-name" onchange="changeColor(this)">
                    <option value="">단면색 선택</option>
                    <option value="yellow">노랑</option>
                    <option value="green">녹색</option>
                    <option value="red">빨강</option>
                    <option value="blue">파랑</option>
                </select>
            `;
        }
    });
}
// 행 추가
function addRow() {

    const tbody = document.querySelector("#detailTable tbody");

    const lastRow = tbody.querySelector("tr:last-child");
    const newRow = lastRow.cloneNode(true);

    // 번들, 톤수 비우기
    newRow.querySelector("td:nth-child(5) input").value = "";
    newRow.querySelector("td:nth-child(6) input").value = "";

    tbody.appendChild(newRow);

    changeCompany();
    calcTotal();
}
function alldel() {

    const shipName = $("#shipmentName").val();

    if (shipName === "") {
        alert("선적명이 없습니다.");
        return;
    }

    if (!confirm(shipName + " 본선 전체를 삭제하시겠습니까?")) {
        return;
    }

    $.ajax({
        url: "/out_dbar/delete_ship_all",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({
            ship_id: $("#ship_id").val()
        }),
        success: function (res) {
            alert(res.message);
            location.href = "/out_dbar/";
        },
        error: function () {
            alert("삭제 실패");
        }
    });
}

// 행 삭제
function deleteDetail(id) {

    if (!confirm("이 항목을 삭제하시겠습니까?")) {
        return;
    }

    $.ajax({
        url: "/out_dbar/delete_detail",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({
            id: id
        }),
        success: function (res) {
            alert(res.message);

            location.reload();
        },
        error: function () {
            alert("삭제 실패");
        }
    });
}


// 합계 계산
function calcTotal() {

    let totalBundle = 0;
    let totalWeight = 0;

    $("#detailTable tbody tr").each(function () {

        const bundleCell = $(this).find("td:eq(4)");
        const weightCell = $(this).find("td:eq(5)");

        const bundleValue =
            bundleCell.find("input").length > 0
                ? bundleCell.find("input").val()
                : bundleCell.text().trim();

        const weightValue =
            weightCell.find("input").length > 0
                ? weightCell.find("input").val()
                : weightCell.text().trim();

        const bundle = Number(bundleValue) || 0;
        const weight = Number(weightValue) || 0;

        totalBundle += bundle;
        totalWeight += weight;
    });

    $("#total_bundle").text(totalBundle);
    $("#total_weight").text(totalWeight.toFixed(3));
}

$(document).ready(function () {
    calcTotal();

    $(document).on("input change", "#detailTable input, #detailTable select", function () {
        calcTotal();
    });
});

// 저장
function savePlan() {
    if ($("#shipmentName").val().trim() === "") {
        alert("본선명을 먼저 등록하세요.");
        $("#shipmentName").focus();
        return;
    }

    const company = $("#company").val();
    const details = [];

    $("#detailTable tbody tr").each(function () {

        const firstValue = $(this).find("td:eq(0) input").length > 0
            ? $(this).find("td:eq(0) input").val()
            : $(this).find("td:eq(0) select").val();

        details.push({
            color_name: firstValue,
            steel_type: $(this).find("td:eq(1) input").val(),
            size_name: $(this).find("td:eq(2) input").val(),
            length_m: $(this).find("td:eq(3) input").val(),
            bundle_qty: $(this).find("td:eq(4) input").val(),
            weight_mt: $(this).find("td:eq(5) input").val()
        });

    });

    const data = {
        shipmentName: $("#shipmentName").val(),
        company: company,
        shipMonth: $("#ship_month").val(),
        details: details
    };

    $.ajax({
        url: "/out_dbar/save_plan",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(data),
        success: function (res) {
            alert(res.message);
        },
        error: function () {
            alert("저장 실패");
        }
    });
}
// 최초 실행
document.addEventListener("DOMContentLoaded", function () {

    // changeCompany();
    calcTotal();

    document.addEventListener("input", function (e) {
        if (e.target.closest("#detailTable")) {
            calcTotal();
        }
    });

    document.addEventListener("click", function (e) {
        const delBtn = e.target.closest(".del_btn");

        if (delBtn) {
            deleteRow(delBtn);
        }
    });

});


document.addEventListener("DOMContentLoaded", function () {

    // 현재월 설정
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");

    document.getElementById("ship_month").value =
        `${year}-${month}`;

    // changeCompany();
    calcTotal();

});

function shipment() {
    if ($("#shipmentName").val().trim() === "") {
        alert("선적명을 입력하세요.");
        return;
    }
    const data = {
        company: $("#company").val(),
        shipMonth: $("#ship_month").val(),
        shipmentName: $("#shipmentName").val(),
    };
    console.log(data);

    $.ajax({
        url: "/out_dbar/shipment_save",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(data),
        success: function (res) {
            console.log(res);
            alert(res.message);
        },
        error: function () {
            alert("서버 전송 실패");
        }
    });
}


function changeColor(obj) {

    const color = obj.value;

    $(obj).css({
        "background-color": color,
        "color": "white"
    });

    if (color === "yellow") {
        $(obj).css("color", "black");
    }
}
function closePopup() {

    // window.open()으로 열린 팝업이면
    if (window.opener && !window.opener.closed) {
        window.opener.location.reload();
        window.close();
        return;
    }

    // 직접 열린 새 탭이면 닫을 수 없으니 메인으로 이동
    location.href = "/out_dbar/";
}

