$(function () {

    let currentDate = new Date();

    function formatToday(date) {
        const days = ["일", "월", "화", "수", "목", "금", "토"];

        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        const day = days[date.getDay()];

        return `${y}-${m}-${d} ${day}요일`;
    }

    function updateToday() {
        $("#today").text(formatToday(currentDate));
    }

    updateToday();

    // 체크박스 1개만 선택
    $(document).on("change", ".check", function () {

        $(".check").not(this).prop("checked", false);
        $("tr").removeClass("checked-row");

        if ($(this).is(":checked")) {
            $(this).closest("tr").addClass("checked-row");
        }

    });

    function getSelectedId() {

        const checked = $(".check:checked");

        if (checked.length === 0) {
            alert("항목을 선택하세요.");
            return null;
        }

        return checked.val();
    }

    // 입고 팝업
    $("#btnIn").click(function () {

        const checked = $(".check:checked");

        if (checked.length === 0) {
            alert("항목을 선택하세요.");
            return;
        }

        const id = checked.val();
        const company = checked.data("company");

        const width = Math.min(1500, screen.availWidth - 20);
        const height = Math.min(900, screen.availHeight - 60);

        const left = Math.round((screen.availWidth - width) / 2);
        const top = Math.round((screen.availHeight - height) / 2);

        window.open(
            "/out_dbar/" + company + "/in?ship_id=" + id,
            "inPopup",
            `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
        );

    });

    $("#btnShip").click(function () {

        const id = getSelectedId();
        if (!id) return;

        alert("선적 : " + id);

    });

    $("#btnReturn").click(function () {

        const id = getSelectedId();
        if (!id) return;

        alert("반품 : " + id);

    });

});

function list_up() {

    const w = screen.availWidth * 0.7;
    const h = screen.availHeight * 0.7;

    const left = (screen.availWidth - w) / 2;
    const top = (screen.availHeight - h) / 2;

    window.open(
        "/out_dbar/list_up",
        "list_up",
        `width=${w},height=${h},left=${left},top=${top}`
    );
}

function openPlan(shipId) {
    location.href = "/out_dbar/list_up?ship_id=" + shipId;
}