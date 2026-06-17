$(function () {

    $.datepicker.setDefaults({
        dateFormat: "yy-mm-dd",
        monthNames: ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"],
        monthNamesShort: ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"],
        dayNamesMin: ["일","월","화","수","목","금","토"],
        showMonthAfterYear: true,
        yearSuffix: "년"
    });

    let currentDate = new Date();

    $("#datePicker").datepicker({
        changeYear: true,
        changeMonth: true,
        yearRange: "2020:2035",
        onSelect: function (dateText) {
            currentDate = new Date(dateText);
            updateAll();
        }
    });

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

    function getShift() {
        return $("input[name='shift']:checked").val();
    }

    function updateAll() {
        const dateText = formatDate(currentDate);
        const inputDate = formatInputDate(currentDate);
        const shift = getShift();

        $("#dateText").text(`${dateText} ${shift}`);
        $("#datePicker").val(inputDate);

        $(".in-date").text(inputDate);
    }

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

    $(".save-btn").on("click", function () {
        alert("저장 기능 연결 예정");
    });

    $(".copy-btn").on("click", function () {
        alert("복사 기능 연결 예정");
    });

    updateAll();

});

function openModal(row) {
    alert("수정/삭제 모달 연결 예정");
}

function list_up(){

    let w = screen.availWidth * 0.7;
    let h = screen.availHeight * 0.7;

    let left = (screen.availWidth - w) / 2;
    let top = (screen.availHeight - h) / 2;

    window.open(
        "/out_dbar/list_up",
        "list_up",
        `width=${w},height=${h},left=${left},top=${top}`
    );
}

function closeListModal(){
    $("#listModal").hide();
}