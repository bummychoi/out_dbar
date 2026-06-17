function changeCompany(){

    const company = $("#company").val();

    $("#detailTable tbody tr").each(function(){

        const colorInput = $(this).find("td:first-child input");

        if(company === "dongkuk"){

            colorInput.val("없음");
            colorInput.prop("readonly", true);

            colorInput.css({
                "background":"#efefef",
                "color":"#666",
                "font-weight":"bold"
            });

        }else{

            if(colorInput.val() === "없음"){
                colorInput.val("");
            }

            colorInput.prop("readonly", false);

            colorInput.css({
                "background":"white",
                "color":"black"
            });
        }
    });
}
function addRow(){

    let row = `
    <tr>
        <td class="color-col">
            <input type="text">
        </td>
        <td><input type="text"></td>
        <td><input type="text"></td>
        <td><input type="text"></td>
        <td><input type="text"></td>
        <td>
            <button class="del_btn">
                <span>삭제</span>
            </button>
        </td>
    </tr>
    `;

    $("#detailTable tbody").append(row);

    changeCompany();
}
// 행 삭제
function deleteRow(btn){

    $(btn).closest("tr").remove();

    calcTotal();
}

// 합계 계산
function calcTotal(){

    let totalBundle = 0;
    let totalWeight = 0;

    $("#detailTable tbody tr").each(function(){

        const bundle = Number($(this).find("td:eq(3) input").val()) || 0;
        const weight = Number($(this).find("td:eq(4) input").val()) || 0;

        totalBundle += bundle;
        totalWeight += weight;
    });

    $("#total_bundle").text(totalBundle);
    $("#total_weight").text(totalWeight.toFixed(3));
}

// 저장
function savePlan(){
    alert("저장 기능 연결 예정");
}

// 최초 실행
$(document).ready(function(){

    changeCompany();
    calcTotal();

    // 번들/톤수 입력 시 합계 자동 계산
    $(document).on("input", "#detailTable input", function(){
        calcTotal();
    });

    // 기존 삭제 버튼도 작동
    $(document).on("click", ".del_btn", function(){
        deleteRow(this);
    });

});

function closePopup(){
    window.close();
}