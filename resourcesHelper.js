ResHelper = {};


ResHelper.getResPath = function() {
    if(window.location.hostname === "localhost") return ".";
    else return "static/musiccomposer";
}

ResHelper.getHorSUrl = function() {
    if(window.location.hostname === "localhost") return "index_HorS_local.html";
    else return "composerhitorshit";
}

ResHelper.getMainUrl = function() {
    if(window.location.hostname === "localhost") return "index_local.html";
    else return "musiccomposer";
}