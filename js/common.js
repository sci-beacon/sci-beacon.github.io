// common.js

// CONSTANTS


// GLOBAL VARIABLES

var APIpath = 'https://server.nikhilvj.co.in/questionbank/API';
var IMGpath = 'https://server.nikhilvj.co.in/questionbank/images';
var EXPORTpath = 'https://server.nikhilvj.co.in/questionbank/exports';

if (window.location.host == "localhost:8000") {
    APIpath = 'http://localhost:5501/api';
    IMGpath = 'http://localhost:5501/images';
    EXPORTpath = 'http://localhost:5501/exports';
}

// ###########################################################
// RUN ON PAGE LOAD
$(document).ready(function () {

});


// ###########################################################
// FUNCTIONS


function loadURLParams(URLParams) {
    // URL parameters. from https://stackoverflow.com/a/2405540/4355695
    var query = window.location.search.substring(1).split("&");
    for (var i = 0, max = query.length; i < max; i++) {
        if (query[i] === "") // check for trailing & with no param
            continue;
        var param = query[i].split("=");
        URLParams[decodeURIComponent(param[0])] = decodeURIComponent(param[1] || "");
        // this gets stored to global json variable URLParams
    }

}


function getCurrentTimestamp() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
}