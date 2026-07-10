// 회사 변경
function changeCompany() {

    const company = document.getElementById("company").value;

    document.querySelectorAll("#detailTable tbody tr").forEach(function (row) {

        const firstTd = row.querySelector("td:first-child");

        if (!firstTd) return;

        if (company === "dongkuk") {

            const currentValue =
                firstTd.querySelector("input, select")?.value || "";

            firstTd.innerHTML = `
                <input
                    type="text"
                    class="color-name"
                    placeholder="배선번호 입력"
                    value="${currentValue}"
                >
            `;

        } else {

            const currentValue =
                firstTd.querySelector("input, select")?.value || "";

            firstTd.innerHTML = `
                <select class="color-name" onchange="changeColor(this)">
                    <option value="">단면색 선택</option>
                    <option value="yellow">노랑</option>
                    <option value="green">녹색</option>
                    <option value="red">빨강</option>
                    <option value="blue">파랑</option>
                </select>
            `;

            const select = firstTd.querySelector("select");

            if (select) {
                select.value = currentValue;
                changeColor(select);
            }
        }
    });
}


// 행 추가
function addRow() {

    const tbody = document.querySelector("#detailTable tbody");

    if (!tbody) {
        alert("상세 테이블을 찾을 수 없습니다.");
        return;
    }

    const lastRow = tbody.querySelector("tr:last-child");

    if (!lastRow) {
        alert("복사할 기본 행이 없습니다.");
        return;
    }

    const newRow = lastRow.cloneNode(true);

    // DB 상세 ID 제거
    newRow.removeAttribute("data-id");

    // 모든 입력값 초기화
    newRow.querySelectorAll("input").forEach(function (input) {
        input.value = "";
    });

    newRow.querySelectorAll("select").forEach(function (select) {
        select.value = "";
        select.style.backgroundColor = "";
        select.style.color = "";
    });

    // 저장된 행의 삭제 버튼이 있다면 신규 행 삭제 형태로 변경
    const deleteButton = newRow.querySelector(".del_btn");

    if (deleteButton) {
        deleteButton.removeAttribute("onclick");
    }

    tbody.appendChild(newRow);

    changeCompany();
    calcTotal();

    const firstInput = newRow.querySelector("input, select");

    if (firstInput) {
        firstInput.focus();
    }
}


// 전체 삭제
function alldel() {

    const shipName = $("#shipmentName").val().trim();
    const shipId = $("#ship_id").val();

    if (shipName === "") {
        alert("선적명이 없습니다.");
        $("#shipmentName").focus();
        return;
    }

    if (!shipId) {
        alert("등록된 본선 정보가 없습니다.");
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
            ship_id: shipId
        }),
        success: function (res) {
            alert(res.message);

            if (window.opener && !window.opener.closed) {
                window.opener.location.reload();
                window.close();
            } else {
                location.href = "/out_dbar/";
            }
        },
        error: function (xhr) {
            console.error(xhr.responseText);
            alert("전체 삭제에 실패했습니다.");
        }
    });
}


// DB 상세 행 삭제
function deleteDetail(id) {

    if (!id) {
        alert("삭제할 상세 ID가 없습니다.");
        return;
    }

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
        error: function (xhr) {
            console.error(xhr.responseText);
            alert("상세 삭제에 실패했습니다.");
        }
    });
}


// 신규 입력 행 삭제
function deleteRow(button) {

    const row = button.closest("tr");
    const tbody = document.querySelector("#detailTable tbody");

    if (!row || !tbody) return;

    const rowCount = tbody.querySelectorAll("tr").length;

    if (rowCount <= 1) {

        row.querySelectorAll("input").forEach(function (input) {
            input.value = "";
        });

        row.querySelectorAll("select").forEach(function (select) {
            select.value = "";
            select.style.backgroundColor = "";
            select.style.color = "";
        });

    } else {
        row.remove();
    }

    calcTotal();
}


// 합계 계산
function calcTotal() {

    let totalBundle = 0;
    let totalWeight = 0;

    $("#detailTable tbody tr").each(function () {

        const bundleInput = $(this).find("td:eq(4) input");
        const weightInput = $(this).find("td:eq(5) input");

        const bundleValue = bundleInput.length
            ? bundleInput.val()
            : $(this).find("td:eq(4)").text().trim();

        const weightValue = weightInput.length
            ? weightInput.val()
            : $(this).find("td:eq(5)").text().trim();

        totalBundle += Number(bundleValue) || 0;
        totalWeight += Number(weightValue) || 0;
    });

    $("#total_bundle").text(totalBundle.toLocaleString());
    $("#total_weight").text(totalWeight.toFixed(3));
}


// 계획 저장 또는 수정
function savePlan() {

    const shipmentName = $("#shipmentName").val().trim();
    const company = $("#company").val();
    const shipMonth = $("#ship_month").val();
    const shipId = $("#ship_id").val();

    if (!shipmentName) {
        alert("본선명을 먼저 입력하세요.");
        $("#shipmentName").focus();
        return;
    }

    if (!shipMonth) {
        alert("선적월을 선택하세요.");
        $("#ship_month").focus();
        return;
    }

    const details = [];

    $("#detailTable tbody tr").each(function () {

        const firstField = $(this).find("td:eq(0) input, td:eq(0) select");

        const detail = {
            id: $(this).data("id") || "",
            color_name: firstField.val()?.trim() || "",
            steel_type: $(this).find("td:eq(1) input").val()?.trim() || "",
            size_name: $(this).find("td:eq(2) input").val()?.trim() || "",
            length_m: $(this).find("td:eq(3) input").val()?.trim() || "",
            bundle_qty: $(this).find("td:eq(4) input").val()?.trim() || "",
            weight_mt: $(this).find("td:eq(5) input").val()?.trim() || ""
        };

        const hasValue =
            detail.color_name ||
            detail.steel_type ||
            detail.size_name ||
            detail.length_m ||
            detail.bundle_qty ||
            detail.weight_mt;

        if (hasValue) {
            details.push(detail);
        }
    });

    if (details.length === 0) {
        alert("저장할 상세 내역을 입력하세요.");
        return;
    }

    const data = {
        ship_id: shipId,
        shipmentName: shipmentName,
        company: company,
        shipMonth: shipMonth,
        details: details
    };

    $.ajax({
        url: "/out_dbar/save_plan",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(data),
        success: function (res) {
            alert(res.message);

            if (res.ship_id) {
                $("#ship_id").val(res.ship_id);
            }

            location.reload();
        },
        error: function (xhr) {
            console.error(xhr.responseText);
            alert("계획 저장에 실패했습니다.");
        }
    });
}


// 본선 등록
function shipment() {

    const shipmentName = $("#shipmentName").val().trim();
    const shipMonth = $("#ship_month").val();
    const company = $("#company").val();

    if (!shipmentName) {
        alert("선적명을 입력하세요.");
        $("#shipmentName").focus();
        return;
    }

    if (!shipMonth) {
        alert("선적월을 선택하세요.");
        $("#ship_month").focus();
        return;
    }

    const data = {
        company: company,
        shipMonth: shipMonth,
        shipmentName: shipmentName
    };

    $.ajax({
        url: "/out_dbar/shipment_save",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(data),
        success: function (res) {

            alert(res.message);

            if (res.ship_id) {
                $("#ship_id").val(res.ship_id);

                history.replaceState(
                    null,
                    "",
                    "/out_dbar/list_up?ship_id=" + res.ship_id
                );
            }
        },
        error: function (xhr) {
            console.error(xhr.responseText);
            alert("본선 등록에 실패했습니다.");
        }
    });
}


// 단면색 변경
function changeColor(obj) {

    const color = obj.value;

    obj.style.backgroundColor = "";
    obj.style.color = "";

    if (!color) return;

    obj.style.backgroundColor = color;
    obj.style.color = color === "yellow" ? "black" : "white";
}


// 팝업 닫기
function closePopup() {

    if (window.opener && !window.opener.closed) {
        window.opener.location.reload();
        window.close();
        return;
    }

    location.href = "/out_dbar/";
}


// 최초 실행
document.addEventListener("DOMContentLoaded", function () {

    const shipMonthInput = document.getElementById("ship_month");

    /*
     * 수정 화면
     * Jinja가 DB의 ship_month를 넣어주므로 그대로 유지합니다.
     *
     * 신규 화면
     * 값이 없을 때만 현재월을 넣습니다.
     */
    if (shipMonthInput && !shipMonthInput.value) {

        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");

        shipMonthInput.value = `${year}-${month}`;
    }

    calcTotal();

    document.querySelectorAll(".color-name").forEach(function (field) {

        if (field.tagName === "SELECT") {
            changeColor(field);
        }
    });

    document.addEventListener("input", function (e) {

        if (e.target.closest("#detailTable")) {
            calcTotal();
        }
    });

    document.addEventListener("change", function (e) {

        if (e.target.closest("#detailTable")) {
            calcTotal();
        }
    });

    document.addEventListener("click", function (e) {

        const deleteButton = e.target.closest(".del_btn");

        if (!deleteButton) return;

        const detailId = deleteButton.dataset.id;

        if (detailId) {
            deleteDetail(detailId);
        } else {
            deleteRow(deleteButton);
        }
    });
});