// GLOBAL VARIABLES

var globalTemplates = {};

var globalEmbeds = [];
var globalSubtopic = "st2";
// #################################
/* TABULATOR */

// ###########################################################
// RUN ON PAGE LOAD
$(document).ready(function () {
    loadTemplates();

    var input = document.querySelector('#file1');
    input.onchange = function () {
        console.log("file upload", input.files.length);
        for(let i=0; i < input.files.length; i++) {
            let file = input.files[i];
            uploadFileApi(file);
            displayAsImage(file);
            
        }
    }
});

// ###########################################################
// FUNCTIONS

function loadTemplates() {
    $.ajax({
        url: `${APIpath}/questions/templates`,
        type: "GET",
        // data : JSON.stringify(payload),
        cache: false,
        contentType: 'application/json',
        success: function (returndata) {
            console.log(returndata);
            globalTemplates = returndata.data;
            
            let dropdowns = `<option value="">Choose</option>`;
            for (const key in globalTemplates) {
                if (globalTemplates.hasOwnProperty(key)) {
                    dropdowns += `<option value="${key}">${key}</option>`;
                }
            }
            $('#question_template').html(dropdowns);

            

        },
        error: function (jqXHR, exception) {
            console.log("error:", jqXHR.responseText);
            alert(jqXHR?.responseJSON?.detail ?? `error: ${jqXHR.responseText}`);
        },
    });
}

function load_template(template){
    $('#question').val(globalTemplates[template]);
}


function displayAsImage(file) {
    var imgURL = URL.createObjectURL(file),
        img = document.createElement('img');

    img.onload = function() {
      URL.revokeObjectURL(imgURL);
    };

    img.src = imgURL;
    // 432 x 768
    // img.style.height = '40%';
    // img.style.width = '40%';
    img.classList.add("imgPreview"); // from https://www.geeksforgeeks.org/how-to-dynamically-create-and-apply-css-class-in-javascript/
    // img.classList.add("card"); // from https://www.geeksforgeeks.org/how-to-dynamically-create-and-apply-css-class-in-javascript/

    var uploadTray = document.querySelector(`#uploadTray`);

    uploadTray.appendChild(img);
  }

  
function uploadFileApi(file) {
    var formData = new FormData();
    formData.append('uploadFiles', file );

    $.ajax({
        url : `${APIpath}/files/upload`,
        type : 'POST',
        data : formData,
        cache: false,
        processData: false,  // tell jQuery not to process the data
        contentType: false,  // tell jQuery not to set contentType
        // headers: { "x-access-key": getCookie('paas_auth_token') },
        success : function(data) {
            console.log(data.filename);
            let imgCounter = globalEmbeds.length + 1;
            let imgPlaceholder = `img${imgCounter}`;
            let embed = {};
            embed[imgPlaceholder] = data.filename;
            globalEmbeds.push(embed);
            console.log(globalEmbeds);
            let embedText = `{{img:${imgPlaceholder}}}`

            let question = document.getElementById("question");
            question.value += embedText;

            $('#embedInstruction').html(`Move the <span class="mono">${embedText}</span> to the appropriate place in the question.`);

        },
        error: function(jqXHR, exception) {
            console.log('FAILED.');
        }

    });

}


function addQuestion() {
    let payload = {
        subtopic_id: globalSubtopic,
        content: $('#question').val(),
        embeds: globalEmbeds
    };
    if ( payload.content.length < 10) {
        alert("Invalid question");
        return;
    }

    $.ajax({
        url: `${APIpath}/questions/add`,
        type: "POST",
        data: JSON.stringify(payload),
        cache: false,
        contentType: 'application/json',
        success: function (returndata) {
            console.log(returndata);
        },
        error: function (jqXHR, exception) {
            console.log("error:", jqXHR.responseText);
            alert(jqXHR?.responseJSON?.detail ?? `error: ${jqXHR.responseText}`);
        },
    });
}