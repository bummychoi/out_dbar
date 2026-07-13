// 현대제철 입고 화면
// 날짜 상태는 전역에서 한 곳만 관리
let currentDate = new Date();
let isSaving = false;
let isConfirming = false;

$(function () {

    // datepicker 기본 설정
    $.datepicker.setDefaults({
        dateFormat: "yy-mm-dd",
        monthNames: [
            "1월", "2월", "3월", "4월", "5월", "6월",
            "7월", "8월", "9월", "10월", "11월", "12월"
        ],
        monthNamesShort: [
            "1월", "2월", "3월", "4월", "5월", "6월",
            "7월", "8월", "9월", "10월", "11월", "12월"
        ],
        dayNamesMin: ["일", "월", "화", "수", "목", "금", "토"],
        showMonthAfterYear: true,
        yearSuffix: "년"
    });

    // 날짜 선택기
    $("#datePicker").datepicker({
        changeYear: true,
        changeMonth: true,
        yearRange: "2020:2035",

        onSelect: function (dateText) {
            currentDate = parseLocalDate(dateText);
            updateAll();
        }
    });

    // 이전 날짜
    $("#prevDay").on("click", function () {
        currentDate.setDate(currentDate.getDate() - 1);
        updateAll();
    });

    // 다음 날짜
    $("#nextDay").on("click", function () {
        currentDate.setDate(currentDate.getDate() + 1);
        updateAll();
    });

    // 주간 / 야간 변경
    $("input[name='shift']").on("change", function () {
        updateAll();
    });


    // 상단 날짜 클릭 시 오늘 날짜로 이동
    $("#dateText").on("click", function () {
        goToday();
    });

    // 복사 버튼
    $(".copy-btn").on("click", function () {
        alert("복사할 저장내역 행을 클릭하세요.");
    });

    // Enter / Tab 입력 이동
    $(document).on(
        "keydown",
        "#inBody .car-no, " +
        "#inBody .bundle-qty, " +
        "#inBody .weight-mt, " +
        "#inBody .location-no, " +
        "#inBody .remark",
        function (e) {

            if (e.key !== "Enter" && e.key !== "Tab") {
                return;
            }

            e.preventDefault();
            e.stopPropagation();

            if (isConfirming || isSaving) {
                return;
            }

            const row = $(this).closest("tr");

            const inputs = row.find(
                ".car-no, " +
                ".bundle-qty, " +
                ".weight-mt, " +
                ".location-no, " +
                ".remark"
            );

            const index = inputs.index(this);

            // 마지막 칸이 아니면 다음 입력칸 이동
            if (index < inputs.length - 1) {
                inputs.eq(index + 1).focus().select();
                return;
            }

            // 마지막 비고 칸에서 저장 확인
            isConfirming = true;

            setTimeout(function () {

                const ok = confirm("입고 내용을 저장하시겠습니까?");

                if (ok) {
                    saveIn();
                } else {
                    clearInputRow();
                }

                isConfirming = false;

            }, 0);
        }
    );

    // 번들 / 톤수 입력 시 단중 자동 계산
    $(document).on(
        "input",
        "#inBody .bundle-qty, #inBody .weight-mt",
        function () {

            const row = $(this).closest("tr");
            calcInputUnit(row);
        }
    );

    // 최초 화면 로딩
    updateAll();
});


// yyyy-mm-dd 문자열을 로컬 날짜로 변환
function parseLocalDate(dateText) {

    const parts = String(dateText).split("-");

    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);

    if (!year || !month || !day) {
        return new Date();
    }

    return new Date(year, month - 1, day);
}


// 상단 표시용 날짜
function formatViewDate(date) {

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    return `${year}년 ${month}월 ${day}일`;
}


// input용 yyyy-mm-dd 날짜
function formatInputDate(date) {

    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


// 현재 선택된 주야
function getSelectedShift() {

    return $("input[name='shift']:checked").val() || "주간";
}


// 날짜, 주야 변경 시 전체 화면 갱신
function updateAll() {

    const inputDate = formatInputDate(currentDate);
    const shift = getSelectedShift();

    // 상단 날짜 표시
    $("#dateText").html(
        `${formatViewDate(currentDate)}
        <span class="${shift === "주간" ? "shift-day" : "shift-night"}">
            ${shift}
        </span>`
    );

    // datepicker 날짜 변경
    $("#datePicker").datepicker("setDate", currentDate);

    // 입력행 날짜 / 주야만 변경
    $("#inBody .in-date").text(inputDate);
    $("#inBody .in-shift").text(shift);
    $("#inBody .row-no").text("입력");

    // 날짜별 집계 선택 해제
    $("#dayBody .summary_row").removeClass("selected");

    // 선택 날짜 목록 조회
    loadInList();

    // 누적 입고 및 잔량 조회
    loadTotalSummary();
}


// 입력행 단중 계산
function calcInputUnit(row) {

    const bundle = Number(
        row.find(".bundle-qty").val()
    ) || 0;

    const weight = Number(
        row.find(".weight-mt").val()
    ) || 0;

    const unit = bundle > 0
        ? weight / bundle
        : 0;

    row.find(".unit-weight").text(
        unit.toFixed(3)
    );
}


// 입력행 초기화
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


// 저장 입력값 검사
function validateInput(data) {

    if (!data.plan_id) {
        return "계획 ID가 없습니다.";
    }

    if (!data.in_date) {
        return "입고일자를 확인하세요.";
    }

    if (!data.work_type) {
        return "주간 또는 야간을 선택하세요.";
    }

    if (!data.car_no) {
        return "차량번호를 입력하세요.";
    }

    if (!(Number(data.bundle_qty) > 0)) {
        return "입고수량을 입력하세요.";
    }

    if (!(Number(data.weight_mt) > 0)) {
        return "입고톤수를 입력하세요.";
    }

    return "";
}


// 입고 저장
function saveIn() {

    if (isSaving) {
        return;
    }

    const row = $("#inBody tr:first");

    const data = {
        plan_id: $("#plan_id").val(),

        in_date: row
            .find(".in-date")
            .text()
            .trim(),

        work_type: row
            .find(".in-shift")
            .text()
            .trim(),

        car_no: row
            .find(".car-no")
            .val()
            .trim(),

        bundle_qty: row
            .find(".bundle-qty")
            .val(),

        weight_mt: row
            .find(".weight-mt")
            .val(),

        location_no: row
            .find(".location-no")
            .val()
            .trim(),

        remark: row
            .find(".remark")
            .val()
            .trim()
    };

    const message = validateInput(data);

    if (message) {
        alert(message);
        return;
    }

    isSaving = true;

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
                loadTotalSummary();

            } else {

                alert(
                    res.message || "저장에 실패했습니다."
                );
            }
        },

        error: function (xhr) {

            alert(
                "저장 실패 : " +
                (xhr.responseText || xhr.statusText)
            );
        },

        complete: function () {
            isSaving = false;
        }
    });
}


// 선택 날짜 / 주야 입고내역 조회
function loadInList() {

    const planId = $("#plan_id").val();
    const inDate = formatInputDate(currentDate);
    const workType = getSelectedShift();

    if (!planId) {
        return;
    }

    $.ajax({
        url:
            "/out_dbar/hyundai/in/list/" +
            encodeURIComponent(planId),

        type: "GET",

        data: {
            in_date: inDate,
            work_type: workType
        },

        success: function (rows) {

            let html = "";

            rows = rows || [];

            rows.forEach(function (row, index) {

                const bundle =
                    Number(row.bundle_qty) || 0;

                const weight =
                    Number(row.weight_mt) || 0;

                const unit = bundle > 0
                    ? weight / bundle
                    : 0;
                const key = `summary_${row.in_date}_${row.work_type}`;
                html += `
                    <tr class="saved-row"
                        data-key="${key}"
                        onclick="copyToInput(this)">

                        <td>
                            ${rows.length - index}
                        </td>

                        <td class="in-date">
                            ${escapeHtml(row.in_date)}
                        </td>

                        <td class="in-shift">
                            ${escapeHtml(row.work_type)}
                        </td>

                        <td class="car-no">
                            ${escapeHtml(row.car_no)}
                        </td>

                        <td class="bundle-qty">
                            ${bundle.toLocaleString()}
                        </td>

                        <td class="weight-mt">
                            ${weight.toFixed(3)}
                        </td>

                        <td class="location-no">
                            ${escapeHtml(row.location_no || "")}
                        </td>

                        <td class="unit-weight">
                            ${unit.toFixed(3)}
                        </td>

                        <td class="created-at">
                            ${escapeHtml(row.created_time || "")}
                        </td>

                        <td class="remark">
                            ${escapeHtml(row.remark || "")}
                        </td>

                        <td>
                            <button
                                class="btn-save"
                                type="button"
                                onclick="
                                    event.stopPropagation();
                                    openEdit(${Number(row.id)});
                                ">
                                수정
                            </button>
                        </td>

                    </tr>
                `;
            });

            $("#savedBody").html(html);

            // 날짜별 집계 조회
            loadDaySummary();
        },

        error: function (xhr) {

            console.error(
                "입고목록 조회 실패:",
                xhr.responseText || xhr.statusText
            );

            $("#savedBody").html(`
                <tr>
                    <td colspan="11">
                        입고목록을 불러오지 못했습니다.
                    </td>
                </tr>
            `);
        }
    });
}


// 누적 입고현황 조회
function loadTotalSummary() {

    const planId = $("#plan_id").val();

    if (!planId) {
        return;
    }

    $.ajax({
        url:
            "/out_dbar/hyundai/in/list/" +
            encodeURIComponent(planId),

        type: "GET",

        success: function (rows) {
            calcSummary(rows || []);
        },

        error: function (xhr) {

            console.error(
                "누적 집계 조회 실패:",
                xhr.responseText || xhr.statusText
            );
        }
    });
}


// 누적 입고 및 잔량 계산
function calcSummary(rows) {

    let inBundle = 0;
    let inWeight = 0;

    rows.forEach(function (row) {

        inBundle +=
            Number(row.bundle_qty) || 0;

        inWeight +=
            Number(row.weight_mt) || 0;
    });

    const planBundle =
        Number($("#plan_bundle").val()) || 0;

    const planWeight =
        Number($("#plan_weight").val()) || 0;

    const remainBundle =
        planBundle - inBundle;

    const remainWeight =
        planWeight - inWeight;

    $("#in_bundle").text(
        inBundle.toLocaleString()
    );

    $("#in_weight").text(
        formatNumber3(inWeight)
    );

    $("#remain_bundle").text(
        remainBundle.toLocaleString()
    );

    $("#remain_weight").text(
        formatNumber3(remainWeight)
    );
}


// 소수점 3자리 표시
function formatNumber3(value) {

    return Number(value || 0).toLocaleString(
        undefined,
        {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3
        }
    );
}


// 수정 모달 열기
function openEdit(id) {

    $.ajax({
        url:
            "/out_dbar/hyundai/in/detail/" +
            encodeURIComponent(id),

        type: "GET",

        success: function (row) {

            $("#edit_id").val(row.id);

            $(
                "input[name='edit_work_type']" +
                "[value='" + row.work_type + "']"
            ).prop("checked", true);

            $("#edit_car_no").val(
                row.car_no || ""
            );

            $("#edit_bundle").val(
                row.bundle_qty || ""
            );

            $("#edit_weight").val(
                row.weight_mt || ""
            );

            $("#edit_location").val(
                row.location_no || ""
            );

            $("#edit_remark").val(
                row.remark || ""
            );

            $("#editModal").fadeIn(200);
        },

        error: function (xhr) {

            alert(
                "수정 자료 조회 실패 : " +
                (xhr.responseText || xhr.statusText)
            );
        }
    });
}


// 수정 모달 닫기
function closeModal() {

    $("#editModal").fadeOut();
}


// 수정 데이터 가져오기
function getEditData() {

    return {
        id: $("#edit_id").val(),

        work_type:
            $("input[name='edit_work_type']:checked")
                .val(),

        car_no:
            $("#edit_car_no")
                .val()
                .trim(),

        bundle_qty:
            $("#edit_bundle").val(),

        weight_mt:
            $("#edit_weight").val(),

        location_no:
            $("#edit_location")
                .val()
                .trim(),

        remark:
            $("#edit_remark")
                .val()
                .trim()
    };
}


// 현대제철 수정
function updateIn_hyundai() {

    updateIn(
        "/out_dbar/hyundai/in/update"
    );
}


// 동국제강 수정
function updateIn_dongkuk() {

    updateIn(
        "/out_dbar/dongkuk/in/update"
    );
}


// 공통 수정 처리
function updateIn(url) {

    const data = getEditData();

    if (!data.id) {

        alert("수정할 자료가 없습니다.");
        return;
    }

    if (!data.work_type) {

        alert("주간 또는 야간을 선택하세요.");
        return;
    }

    if (!data.car_no) {

        alert("차량번호를 입력하세요.");
        return;
    }

    if (!(Number(data.bundle_qty) > 0)) {

        alert("입고수량을 입력하세요.");
        return;
    }

    if (!(Number(data.weight_mt) > 0)) {

        alert("입고톤수를 입력하세요.");
        return;
    }

    $.ajax({
        url: url,
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(data),

        success: function (res) {

            if (res.result === "ok") {

                alert("수정 완료");

                closeModal();

                loadInList();
                loadTotalSummary();

            } else {

                alert(
                    res.message || "수정에 실패했습니다."
                );
            }
        },

        error: function (xhr) {

            alert(
                "수정 실패 : " +
                (xhr.responseText || xhr.statusText)
            );
        }
    });
}


// 현대제철 입고 삭제
function deleteIn() {

    const id = $("#edit_id").val();

    if (!id) {

        alert("삭제할 자료가 없습니다.");
        return;
    }

    if (!confirm("삭제하시겠습니까?")) {
        return;
    }

    $.ajax({
        url:
            "/out_dbar/hyundai/in/delete/" +
            encodeURIComponent(id),

        type: "POST",

        success: function (res) {

            if (res.result === "ok") {

                alert("삭제 완료");

                closeModal();

                loadInList();
                loadTotalSummary();

            } else {

                alert(
                    res.message || "삭제에 실패했습니다."
                );
            }
        },

        error: function (xhr) {

            alert(
                "삭제 실패 : " +
                (xhr.responseText || xhr.statusText)
            );
        }
    });
}


// 저장목록 클릭 시 입력행으로 복사
function copyToInput(row) {

    $(".saved-row").removeClass("selected");
    $(row).addClass("selected");

    const inputRow = $("#inBody tr:first");

    inputRow.find(".car-no").val(
        $(row)
            .find(".car-no")
            .text()
            .trim()
    );

    inputRow.find(".bundle-qty").val(
        $(row)
            .find(".bundle-qty")
            .text()
            .trim()
            .replaceAll(",", "")
    );

    inputRow.find(".weight-mt").val(
        $(row)
            .find(".weight-mt")
            .text()
            .trim()
    );

    inputRow.find(".location-no").val(
        $(row)
            .find(".location-no")
            .text()
            .trim()
    );

    inputRow.find(".remark").val(
        $(row)
            .find(".remark")
            .text()
            .trim()
    );

    calcInputUnit(inputRow);

    inputRow
        .find(".car-no")
        .focus()
        .select();
}


// 일자 / 주야 집계 조회
function loadDaySummary() {

    const planId = $("#plan_id").val();

    if (!planId) {
        return;
    }

    $.ajax({
        url:
            "/out_dbar/hyundai/day_summary/" +
            encodeURIComponent(planId),

        type: "GET",

        success: function (rows) {

            let html = "";

            rows = rows || [];

            rows.forEach(function (row) {

                html += `
                    <tr
                        class="summary_row"
                        id="summary_${row.in_date}_${row.work_type}"
                        data-date="${escapeHtml(row.in_date)}"
                        data-shift="${escapeHtml(row.work_type)}"
                        onclick="selectDaySummary(this)">

                        <td style="font-size:13px">
                            ${escapeHtml(row.in_date)}
                        </td>

                        <td>
                            ${escapeHtml(row.work_type)}
                        </td>

                        <td>
                            ${Number(
                    row.truck_cnt || 0
                ).toLocaleString()}
                        </td>

                        <td>
                            ${Number(
                    row.bundle_qty || 0
                ).toLocaleString()}
                        </td>

                        <td>
                            ${Number(
                    row.weight_mt || 0
                ).toFixed(3)}
                        </td>

                        <td>
                            ${Number(
                    row.remain_bundle || 0
                ).toLocaleString()}
                        </td>

                        <td>
                            ${Number(
                    row.remain_weight || 0
                ).toFixed(3)}
                        </td>

                    </tr>
                `;
            });

            $("#dayBody").html(html);
        },

        error: function (xhr) {

            console.error(
                "날짜별 집계 조회 실패:",
                xhr.responseText || xhr.statusText
            );
        }
    });
}


// 날짜별 집계 행 클릭
function selectDaySummary(row) {

    const inDate = String($(row).data("date"));
    const workType = String($(row).data("shift"));
    const key = row.id;

    currentDate = parseLocalDate(inDate);

    $("input[name='shift'][value='" + workType + "']")
        .prop("checked", true);

    $("#datePicker").datepicker("setDate", currentDate);

    $("#dateText").html(
        `${formatViewDate(currentDate)}
        <span class="${workType === "주간" ? "shift-day" : "shift-night"}">
            ${workType}
        </span>`
    );

    $("#inBody .in-date").text(inDate);
    $("#inBody .in-shift").text(workType);

    $("#dayBody .summary_row").removeClass("selected");
    $(row).addClass("selected");

    // 전체 저장행 숨김
    $("#savedBody .saved-row").hide();

    // 선택 날짜/주야만 표시
    $("#savedBody .saved-row").filter(function () {
        return $(this).attr("data-key") === key;
    }).show();

    // 현재 보이는 행 기준 순번 다시 계산
    const visibleRows = $("#savedBody .saved-row:visible");

    visibleRows.each(function (index) {
        $(this)
            .find("td:first")
            .text(visibleRows.length - index);
    });
}

// HTML 특수문자 처리
function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function goToday() {
    console.log("goToday 실행");
    // 오늘 날짜
    currentDate = new Date();

    // 오늘 날짜를 datepicker에도 적용
    $("#datePicker").datepicker("setDate", currentDate);

    // 오늘 날짜 화면 갱신
    updateAll();

    // 왼쪽 선택 해제
    $("#dayBody .summary_row").removeClass("selected");
}