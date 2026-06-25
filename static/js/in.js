function closePopup() {

    if (window.opener) {
        window.opener.location.reload();
    }

    window.close();
}

$(function(){

    const winWidth = $(window).width();

    if(winWidth < 1400){
        $("body").css("zoom", "80%");
    }

});