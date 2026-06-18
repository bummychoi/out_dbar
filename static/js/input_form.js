function changeCompany() {

    const company = document.getElementById("company").value;

    document.querySelectorAll("#detailTable tbody tr").forEach(function (row) {

        const colorSelect = row.querySelector("td:first-child select");

        if (!colorSelect) return;

        if (company === "dongkuk") {
            colorSelect.value = "";
            colorSelect.disabled = true;
            colorSelect.style.background = "#efefef";
            colorSelect.style.color = "#666";
        } else {
            colorSelect.disabled = false;
            colorSelect.style.background = "white";
            colorSelect.style.color = "black";
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

// 행 삭제
function deleteRow(btn) {

    btn.closest("tr").remove();

    calcTotal();
}

// 합계 계산
function calcTotal() {

    let totalBundle = 0;
    let totalWeight = 0;

    document.querySelectorAll("#detailTable tbody tr").forEach(function (row) {

        const bundleInput = row.querySelector("td:nth-child(4) input");
        const weightInput = row.querySelector("td:nth-child(5) input");

        const bundle = Number(bundleInput.value) || 0;
        const weight = Number(weightInput.value) || 0;

        totalBundle += bundle;
        totalWeight += weight;
    });

    document.getElementById("total_bundle").innerText = totalBundle;
    document.getElementById("total_weight").innerText = totalWeight.toFixed(3);
}

// 저장
function savePlan() {
    if ($("#shipmentName").val().trim() === "") {
        alert("본선명을 먼저 등록하세요.");
        $("#shipmentName").focus();
        return;
    }

    const details = [];

    $("#detailTable tbody tr").each(function () {

        details.push({
            color_name: $(this).find("td:eq(0) select").val(),
            steel_type: $(this).find("td:eq(1) input").val(),
            size_name: $(this).find("td:eq(2) input").val(),
            length_m: $(this).find("td:eq(3) input").val(),
            bundle_qty: $(this).find("td:eq(4) input").val(),
            weight_mt: $(this).find("td:eq(5) input").val()
        });

    });


    const data = {
        shipmentName: $("#shipmentName").val(),
        company: $("#company").val(),
        shipMonth: $("#ship_month").val(),
        details: details
    };

    console.log(data);

    $.ajax({
    url: "/out_dbar/save_plan",
    type: "POST",
    contentType: "application/json",
    data: JSON.stringify(data),
    success: function(res){
        console.log(res);
        alert(res.message);
    },
    error: function(){
        alert("저장 실패");
    }
});
}

// 취소
function closePopup() {
    location.href = "/out_dbar/";
}
// 최초 실행
document.addEventListener("DOMContentLoaded", function () {

    changeCompany();
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

    changeCompany();
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