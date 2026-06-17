// 회사 변경
function changeCompany(){

    const company = document.getElementById("company").value;

    document.querySelectorAll("#detailTable tbody tr").forEach(function(row){

        const colorInput = row.querySelector("td:first-child input");

        if(company === "dongkuk"){
            colorInput.value = "없음";
            colorInput.readOnly = true;
            colorInput.style.background = "#efefef";
            colorInput.style.color = "#666";
            colorInput.style.fontWeight = "bold";
        }else{
            if(colorInput.value === "없음"){
                colorInput.value = "";
            }

            colorInput.readOnly = false;
            colorInput.style.background = "white";
            colorInput.style.color = "black";
            colorInput.style.fontWeight = "normal";
        }
    });
}

// 행 추가
function addRow(){

    const tbody = document.querySelector("#detailTable tbody");

    const row = document.createElement("tr");

    row.innerHTML = `
        <td class="color-col">
            <input type="text">
        </td>
        <td><input type="text"></td>
        <td><input type="text"></td>
        <td><input type="number"></td>
        <td><input type="number" step="0.001"></td>
        <td>
            <button class="del_btn">
                <span>삭제</span>
            </button>
        </td>
    `;

    tbody.appendChild(row);

    changeCompany();
    calcTotal();
}

// 행 삭제
function deleteRow(btn){

    btn.closest("tr").remove();

    calcTotal();
}

// 합계 계산
function calcTotal(){

    let totalBundle = 0;
    let totalWeight = 0;

    document.querySelectorAll("#detailTable tbody tr").forEach(function(row){

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
function savePlan(){
    alert("저장 기능 연결 예정");
}

// 취소
function closePopup(){
    window.close();
}

// 최초 실행
document.addEventListener("DOMContentLoaded", function(){

    changeCompany();
    calcTotal();

    document.addEventListener("input", function(e){
        if(e.target.closest("#detailTable")){
            calcTotal();
        }
    });

    document.addEventListener("click", function(e){
        const delBtn = e.target.closest(".del_btn");

        if(delBtn){
            deleteRow(delBtn);
        }
    });

});


document.addEventListener("DOMContentLoaded", function(){

    // 현재월 설정
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");

    document.getElementById("ship_month").value =
        `${year}-${month}`;

    changeCompany();
    calcTotal();

});