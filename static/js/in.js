$(function () {

    loadInList();

    $.datepicker.setDefaults({
        dateFormat: "yy-mm-dd",
        monthNames: ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"],
        monthNamesShort: ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"],
        dayNamesMin: ["일", "월", "화", "수", "목", "금", "토"],
        showMonthAfterYear: true,
        yearSuffix: "년"
    });

    let currentDate = new Date();

    function formatDate(date) {
        const y = date.getFullYear();
        const m = date.getMonth() + 1;
        const d = date.getDate();

        return `${y}년 ${m}월 ${d}일`;
    }

    function formatInputDate(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");

        return `${y}-${m}-${d}`;
    }

    function updateAll() {
        const viewDate = formatDate(currentDate);
        const inputDate = formatInputDate(currentDate);
        const shift = $("input[name='shift']:checked").val();

        $("#dateText").html(
            `${viewDate} <span class="${shift === "주간" ? "shift-day" : "shift-night"}">${shift}</span>`
        );

        $("#datePicker").val(inputDate);
        $(".in-date").text(inputDate);
        $(".in-shift").text(shift);

        $("#inBody .row-no").text("입력");
    }

    $("#datePicker").datepicker({
        changeYear: true,
        changeMonth: true,
        yearRange: "2020:2035",
        onSelect: function (dateText) {
            currentDate = new Date(dateText);
            updateAll();
        }
    });

    $("#prevDay").on("click", function () {
        currentDate.setDate(currentDate.getDate() - 1);
        updateAll();
    });

    $("#nextDay").on("click", function () {
        currentDate.setDate(currentDate.getDate() + 1);
        updateAll();
    });

    $("input[name='shift']").on("change", function () {
        updateAll();
    });

    $("#dateText").on("click", function () {
        $("#datePicker").datepicker("show");
    });

    $(".copy-btn").on("click", function () {
        alert("복사 기능 연결 예정");
    });

    // Enter / Tab 이동
    $(document).on(
        "keydown",
        ".car-no, .bundle-qty, .weight-mt, .location-no, .remark",
        function (e) {

            if (e.key !== "Enter" && e.key !== "Tab") return;

            e.preventDefault();

            const row = $(this).closest("tr");

            const inputs = row.find(
                ".car-no, .bundle-qty, .weight-mt, .location-no, .remark"
            );

            const idx = inputs.index(this);

            if (idx < inputs.length - 1) {
                inputs.eq(idx + 1).focus().select();
                return;
            }

            const ok = confirm("입고 내용을 저장하시겠습니까?");

            if (ok) {
                saveIn();
            } else {
                clearInputRow();
            }
        }
    );

    // 단중 자동 계산
    $(document).on("input", ".bundle-qty, .weight-mt", function () {

        const row = $(this).closest("tr");

        const bundle = Number(row.find(".bundle-qty").val()) || 0;
        const weight = Number(row.find(".weight-mt").val()) || 0;
        const unit = bundle > 0 ? weight / bundle : 0;

        row.find(".unit-weight").text(unit.toFixed(3));
    });

    updateAll();
});

function clearInputRow() {

    const row = $("#inBody tr:first");

    row.find(".car-no").val("");
    row.find(".bundle-qty").val("");
    row.find(".weight-mt").val("");
    row.find(".location-no").val("");
    row.find(".remark").val("");

    row.find(".unit-weight").text("0.000");

    row.find(".car-no").focus();
}

function saveIn() {

    const row = $("#inBody tr:first");

    const data = {
        plan_id: $("#plan_id").val(),
        in_date: row.find(".in-date").text(),
        work_type: row.find(".in-shift").text(),
        car_no: row.find(".car-no").val(),
        bundle_qty: row.find(".bundle-qty").val(),
        weight_mt: row.find(".weight-mt").val(),
        location_no: row.find(".location-no").val(),
        remark: row.find(".remark").val()
    };

    $.ajax({
        url: "/out_dbar/hyundai/in/save",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(data),

        success: function (res) {

            if (res.result === "ok") {
                alert("저장 완료");

                clearInputRow();
                loadInList();

            } else {
                alert(res.message);
            }
        },

        error: function (xhr) {
            alert("저장 실패 : " + xhr.responseText);
        }
    });
}

function loadInList() {

    const planId = $("#plan_id").val();

    $.get("/out_dbar/hyundai/in/list/" + planId, function (rows) {

        let html = "";

        rows.forEach(function (row, idx) {

            const unit = Number(row.bundle_qty) > 0
                ? Number(row.weight_mt) / Number(row.bundle_qty)
                : 0;

            html += `
                <tr>
                    <td>${rows.length - idx}</td>
                    <td>${row.in_date}</td>
                    <td>${row.work_type}</td>
                    <td>${row.car_no}</td>
                    <td>${Number(row.bundle_qty).toLocaleString()}</td>
                    <td>${Number(row.weight_mt).toFixed(3)}</td>
                    <td>${row.location_no || ""}</td>
                    <td>${unit.toFixed(3)}</td>
                    <td>${row.created_time}</td>
                    <td>${row.remark || ""}</td>
                    <td>수정</td>
                </tr>
            `;
        });

        $("#savedBody").html(html);
        calcSummary(rows);
    });
}

function calcSummary(rows) {

    let inBundle = 0;
    let inWeight = 0;

    rows.forEach(function (row) {
        inBundle += Number(row.bundle_qty) || 0;
        inWeight += Number(row.weight_mt) || 0;
    });

    const planBundle = Number($("#plan_bundle").val()) || 0;
    const planWeight = Number($("#plan_weight").val()) || 0;

    $("#in_bundle").text(inBundle.toLocaleString());
   $("#in_weight").text(inWeight.toLocaleString(
        undefined,
        { minimumFractionDigits: 3, maximumFractionDigits: 3 }
    ));

    $("#remain_bundle").text((planBundle - inBundle).toLocaleString());
     $("#remain_weight").text(remainWeight.toLocaleString(
        undefined,
        { minimumFractionDigits: 3, maximumFractionDigits: 3 }
    ));
}

function openModal(row) {
    alert("수정/삭제 모달 연결 예정");
}

function closePopup() {

    if (window.opener && !window.opener.closed) {
        window.opener.location.reload();
    }

    window.close();
}