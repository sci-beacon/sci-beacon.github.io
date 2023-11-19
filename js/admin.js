// GLOBAL VARIABLES

var globalTemplates = {};

var globalEmbeds = [];
var globalSubtopic = "st2";

var txnid = "";
var globalProfile = {};
// #################################
/* TABULATOR */

var itemsTotal = function (values, data, calcParams) {
    var calc = values.length;
    return calc + ' total';
}

var topics_table = new Tabulator("#topics_table", {
    height: 400,
    selectable: 1,
    index: "id",
    clipboard: "copy",
    clipboardCopyRowRange: "selected", //change default selector to selected
    columnDefaults: {
        tooltip: true,
        headerTooltip: true,
    },
    layout: "fitData",
    // responsiveLayout: "collapse",
    // pagination:true,
    columns: [
        { title: "id", field: "id", headerFilter: "input", width: 30 },
        { title: "subject", field: "subject_name", headerFilter: "input", width: 100, editor:"input" },
        { title: "topic", field: "topic_name", headerFilter: "input", width: 150, editor:"input" },
        { title: "subtopic", field: "subtopic_name", headerFilter: "input", width: 200, editor:"input", bottomCalc: itemsTotal },
        { title: "subject_id", field: "subject_id", visible: true, headerFilter: "input" },
        { title: "topic_id", field: "topic_id", visible: true, headerFilter: "input" },
        { title: "subtopic_id", field: "subtopic_id", visible: true, headerFilter: "input" },
    ]
});

topics_table.on("rowSelected", function (row) {
    let h = row.getData();
    console.log('row selected',h);
    // let preview = h.preview.replace(new RegExp('IMAGEPATH', 'g'), IMGpath);

    // $('#preview').html(preview);
});

topics_table.on("cellEdited", function(cell){
    //cell - cell component
    // console.log(cell);
    let newVal = cell.getValue();
    let oldVal = cell.getOldValue();
    let id = cell.getRow().getIndex();
    let col = cell.getColumn().getField();
    // let idcol = `${col}_id`;
    if (newVal !== oldVal) {
        console.log(`${id}: Changed ${col} from ${oldVal} to ${newVal}`);
        let payload = {col, newVal, oldVal};
        // console.log(payload);
        let token = localStorage.getItem("qb_token");
        if (! token) { alert('Please login first'); return; }

        $.ajax({
            url: `${APIpath}/topics/edit`,
            type: "PUT",
            headers: { "x-access-token": token },
            data : JSON.stringify(payload),
            cache: false,
            contentType: 'application/json',
            success: function (returndata) {
                // console.log(returndata);
                loadTopicsTable();
                
            },
            error: function (jqXHR, exception) {
                console.log("error:", jqXHR.responseText);
                alert(jqXHR?.responseJSON?.detail ?? `error: ${jqXHR.responseText}`);
            },
        });
    }
    
});

// ###########################################################
// RUN ON PAGE LOAD
$(document).ready(function () {
    loggedincheck();
    loadTopicsTable();

    var input = document.querySelector('#file1');
    input.onchange = function () {
        console.log("file upload", input.files.length);
        for(let i=0; i < input.files.length; i++) {
            let file = input.files[i];
            uploadFileApi(file);
            displayAsImage(file);
            
        }
    }


    // admins list
    admins_list();

    // limit selections in admins list multi-select, from https://stackoverflow.com/a/2046277/4355695
    var last_valid_selection = null;
    $('#admins_list').change(function(event) {
      if ($(this).val().length > 1) {
        alert('You can only choose 1!');
        $(this).val(last_valid_selection);
      } else {
        last_valid_selection = $(this).val();
      }
    });

});

// ###########################################################
// TEMPLATES

function loadTemplates() {
    let token = localStorage.getItem("qb_token");
    if (! token) { alert('Please login first'); return; }
    $.ajax({
        url: `${APIpath}/questions/templates`,
        type: "GET",
        headers: { "x-access-token": token },
        // data : JSON.stringify(payload),
        cache: false,
        contentType: 'application/json',
        success: function (returndata) {
            console.log(returndata);
            globalTemplates = returndata.data;
            
            let dropdowns = `<option value="">Choose</option>`;

            globalTemplates.forEach(t => {
                dropdowns += `<option value="${t?.answer_type}">${t?.title}</option>`;
            });
            $('#question_template').html(dropdowns);

        },
        error: function (jqXHR, exception) {
            console.log("error:", jqXHR.responseText);
            alert(jqXHR?.responseJSON?.detail ?? `error: ${jqXHR.responseText}`);
        },
    });
}

function load_template(template){
    let row = globalTemplates.filter(t => {return t.answer_type === template});
    if(row.length) {
        $('#question').val(row[0].template);
        updateSummary();
    }
    else {
        $('#question').val('');
        
    }
}


// ###########################################################
// Files

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
    let token = localStorage.getItem("qb_token");
    if (! token) { alert('Please login first'); return; }
    var formData = new FormData();
    formData.append('uploadFiles', file );
    
    $.ajax({
        url : `${APIpath}/files/upload`,
        type : 'POST',
        headers: { "x-access-token": token },
        data : formData,
        cache: false,
        processData: false,  // tell jQuery not to process the data
        contentType: false,  // tell jQuery not to set contentType
        // headers: { "x-access-token": getCookie('paas_auth_token') },
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

// ###########################################################
// Question Add

function addQuestion() {
    let token = localStorage.getItem("qb_token");
    if (! token) { alert('Please login first'); return; }

    let summary = $('#summary').val();
    let question = $('#question').val();
    let content = `${summary}\n${question}`;
    console.log(content);

    let payload = {
        subtopic_id: globalSubtopic,
        content: content, 
        embeds: globalEmbeds
    };
    if ( payload.content.length < 10) {
        alert("Invalid question");
        return;
    }
    $('#addQuestion_status').html(`Adding...`);
    $.ajax({
        url: `${APIpath}/questions/add`,
        type: "POST",
        headers: { "x-access-token": token },
        data: JSON.stringify(payload),
        cache: false,
        contentType: 'application/json',
        success: function (returndata) {
            console.log(returndata);
            $('#addQuestion_status').html(`Added the question successfully`)
        },
        error: function (jqXHR, exception) {
            console.log("error:", jqXHR.responseText);
            alert(jqXHR?.responseJSON?.detail ?? `error: ${jqXHR.responseText}`);
        },
    });
}


// #########################################################################
// Login related

function sendOTP(){
    let payload = {
        email: $('#email').val().trim().toLowerCase()
    };
    if (! payload?.email) { alert('Please enter email'); return; } 
    $('#sendOTP_status').html(`Sending OTP by email..`);

    $.ajax({
        url: `${APIpath}/users/emailOTP`,
        type: "POST",
        data: JSON.stringify(payload),
        cache: false,
        contentType: 'application/json',
        success: function (returndata) {
            txnid = returndata.txnid;
            console.log(txnid);
            $('#sendOTP_status').html(`Please check your email for a 4-digit OTP, check in spam folder if you don't see in inbox.`);
        },
        error: function (jqXHR, exception) {
            console.log("error:", jqXHR.responseText);
            alert(jqXHR?.responseJSON?.detail ?? `error: ${jqXHR.responseText}`);
            $('#sendOTP_status').html(`Failed to send email or some other error, please check with maintainer`);
        },
    });
}

function verifyOTP(){
    if (!txnid) { alert('Please enter email and send OTP first'); return; }

    let payload = {
        txnid: txnid,
        otp: parseInt($('#otp').val())
    };
    if (!payload?.otp) { alert('Please enter OTP received in your email inbox'); return; }
    $('#verifyOTP_status').html(`Logging in..`);
    
    $.ajax({
        url: `${APIpath}/users/verifyOTP`,
        type: "POST",
        data: JSON.stringify(payload),
        cache: false,
        contentType: 'application/json',
        success: function (returndata) {
            localStorage.setItem("qb_token", returndata.token);
            globalProfile = returndata.profile;
            $('#verifyOTP_status').html(`Logged in as ${globalProfile.email}`);
            loadTemplates();
            setup_topics();
        },
        error: function (jqXHR, exception) {
            console.log("error:", jqXHR.responseText);
            alert(jqXHR?.responseJSON?.detail ?? `error: ${jqXHR.responseText}`);
        },
    });

}

function loggedincheck(){
    let token = localStorage.getItem("qb_token") ?? null;
    if (! token) return;

    $.ajax({
        url: `${APIpath}/users/loggedincheck`,
        type: "GET",
        headers: { "x-access-token": token },
        cache: false,
        contentType: 'application/json',
        success: function (returndata) {
            globalProfile = returndata.profile;
            $('#verifyOTP_status').html(`Logged in as ${globalProfile.email}`);
            loadTemplates();
            setup_topics();
            
        },
        error: function (jqXHR, exception) {
            if(jqXHR.status == 401) {
                // token is invalidated, reset
                localStorage.removeItem("qb_token");
                console.log("Previous session is invalidated, please login again.");
                return;
            }
            console.log("error:", jqXHR.responseText);
            alert(jqXHR?.responseJSON?.detail ?? `error: ${jqXHR.responseText}`);
        },
    });
}

// #########################################################################
// subjects topics subtopics related

function clearFilters() {
    $("#subject_id")[0].selectize.clear();
    $("#topic_id")[0].selectize.clear();
    $("#subtopic_id")[0].selectize.clear();

}

function setup_topics() {
    let subjectSelectize = $('#subject_id').selectize({
        placeholder: "Choose a Subject",
        labelField: 'subject_name',
        valueField: 'subject_id',
        searchField: ['subject_name', 'subject_id'],
        maxItems: 1,
        plugins: ['remove_button'], // spotted here: https://stackoverflow.com/q/51611957/4355695
        render: {
            item: function (data, escape) {
                return `<div class="item">${escape(data.subject_name)}</div>`;
            },
            option: function (data, escape) {
                return `<div class="option">${escape(data.subject_name)}</div>`;
            },
        },
        onChange(subject_id) {
            if (subject_id) {
                console.log(`Selected subject_id: ${subject_id}`);
                loadTopics(parent_category = 'subject_id', value = subject_id);
                updateSummary();
            }
        },
        onClear() {
            $("#topic_id")[0].selectize.clearOptions(silent = true);
            $("#subtopic_id")[0].selectize.clearOptions(silent = true);
            updateSummary();
        }
    });

    let topicSelectize = $('#topic_id').selectize({
        placeholder: "Choose a Topic",
        labelField: 'topic_name',
        valueField: 'topic_id',
        searchField: ['topic_name', 'topic_id'],
        maxItems: 1,
        plugins: ['remove_button'],
        render: {
            item: function (data, escape) {
                return `<div class="item">${escape(data.topic_name)}</div>`;
            },
            option: function (data, escape) {
                return `<div class="option">${escape(data.topic_name)}</div>`;
            },
        },
        onChange(topic_id) {
            if (topic_id) {
                console.log(`Selected topic_id: ${topic_id}`);
                loadTopics(parent_category = 'topic_id', value = topic_id);
                updateSummary();
            }
        },
        onClear() {
            $("#subtopic_id")[0].selectize.clearOptions(silent = true);
            updateSummary();
        }
    });

    let subtopicSelectize = $('#subtopic_id').selectize({
        placeholder: "Choose a SubTopic",
        labelField: 'subtopic_name',
        valueField: 'subtopic_id',
        searchField: ['subtopic_name', 'subtopic_id'],
        maxItems: 1,
        plugins: ['remove_button'],
        render: {
            item: function (data, escape) {
                return `<div class="item">${escape(data.subtopic_name)}</div>`;
            },
            option: function (data, escape) {
                return `<div class="option">${escape(data.subtopic_name)}</div>`;
            },
        },
        onChange(subtopic_id) {
            if (subtopic_id) {
                console.log(`Selected subtopic_id: ${subtopic_id}`);
                updateSummary();
            }
        },
        onClear() {
            updateSummary();
        }
    });


    // new topics fields

    let new_subjectSelectize = $('#new_subject').selectize({
        placeholder: "Choose a Subject or Type a new one",
        labelField: 'subject_name',
        valueField: 'subject_id',
        searchField: ['subject_name', 'subject_id'],
        maxItems: 1,
        plugins: ['remove_button'], // spotted here: https://stackoverflow.com/q/51611957/4355695
        create: true,
        render: {
            item: function (data, escape) {
                return `<div class="item">${escape(data.subject_name)}</div>`;
            },
            option: function (data, escape) {
                return `<div class="option">${escape(data.subject_name)}</div>`;
            },
        },
        onChange(subject_id) {
            if (subject_id) {
                console.log(`Selected subject_id for new topics adding: ${subject_id}`);
                filterTopics(subject_id);
            }
        },
        onClear() {
            // $("#topic_id")[0].selectize.clearOptions(silent = true);
            // $("#subtopic_id")[0].selectize.clearOptions(silent = true);
            // updateSummary();
        }
    });

    let new_topicSelectize = $('#new_topic').selectize({
        placeholder: "Choose a Topic or Type a new one",
        labelField: 'topic_name',
        valueField: 'topic_id',
        searchField: ['topic_name', 'topic_id'],
        maxItems: 1,
        plugins: ['remove_button'],
        create: true,
        render: {
            item: function (data, escape) {
                return `<div class="item">${escape(data.topic_name)}</div>`;
            },
            option: function (data, escape) {
                return `<div class="option">${escape(data.topic_name)}</div>`;
            },
        },
        onChange(topic_id) {
            if (topic_id) {
                console.log(`Selected topic_id for new topics adding: ${topic_id}`);

            }
        },
        onClear() {

        }
    });

    loadTopics();
}


function loadTopics(parent_category = null, value = null) {
    let url = `${APIpath}/topics/dropdown`;
    if (parent_category && value) {
        url += `?parent_category=${parent_category}&value=${value}`;
    }

    $.ajax({
        url: url,
        type: "GET",
        // data : JSON.stringify(payload),
        cache: false,
        contentType: 'application/json',
        success: function (returndata) {
            if (!parent_category) {
                $("#subject_id")[0].selectize.clear();
                $("#subject_id")[0].selectize.clearOptions(silent = true);
                $("#subject_id")[0].selectize.addOption(returndata.data);

                $("#new_subject")[0].selectize.clear();
                $("#new_subject")[0].selectize.clearOptions(silent = true);
                $("#new_subject")[0].selectize.addOption(returndata.data);
            }
            else if (parent_category === 'subject_id') {
                $("#topic_id")[0].selectize.clear();
                $("#topic_id")[0].selectize.clearOptions(silent = true);
                $("#topic_id")[0].selectize.addOption(returndata.data);
            } else if (parent_category === 'topic_id') {
                $("#subtopic_id")[0].selectize.clear();
                $("#subtopic_id")[0].selectize.clearOptions(silent = true);
                $("#subtopic_id")[0].selectize.addOption(returndata.data);
            }

            // if(URLParams['S']) {
            //     $("#subject_id")[0].selectize.setValue(URLParams['S'],silent=false);
            // }

        },
        error: function (jqXHR, exception) {
            console.log("error:", jqXHR.responseText);
            alert(jqXHR?.responseJSON?.detail ?? `error: ${jqXHR.responseText}`);
        },
    });
}

function updateSummary() {
    let subject_id = $('#subject_id').val();
    let topic_id = $('#topic_id').val();
    let subtopic_id = $('#subtopic_id').val();
    let answer_type =  $('#question_template').val();

    $('#summary').val(`subject_id: ${subject_id}\ntopic_id: ${topic_id}\nsubtopic_id: ${subtopic_id}\nanswer_type: ${answer_type}`);
}

function loadTopicsTable() {
    $.ajax({
        url: `${APIpath}/topics/list`,
        type: "GET",
        // data : JSON.stringify(payload),
        cache: false,
        contentType: 'application/json',
        success: function (returndata) {
            topics_table.setData(returndata.data);

        },
        error: function (jqXHR, exception) {
            console.log("error:", jqXHR.responseText);
            alert(jqXHR?.responseJSON?.detail ?? `error: ${jqXHR.responseText}`);
        },
    });
}

function filterTopics(subject_id) {
    let url = `${APIpath}/topics/dropdown?parent_category=subject_id&value=${subject_id}`;

    $.ajax({
        url: url,
        type: "GET",
        cache: false,
        contentType: 'application/json',
        success: function (returndata) {
            $("#new_topic")[0].selectize.clear();
            $("#new_topic")[0].selectize.clearOptions(silent = true);
            $("#new_topic")[0].selectize.addOption(returndata.data);
        },
        error: function (jqXHR, exception) {
            console.log("error:", jqXHR.responseText);
            alert(jqXHR?.responseJSON?.detail ?? `error: ${jqXHR.responseText}`);
        },
    });
}

function add_subtopic() {
    let token = localStorage.getItem("qb_token");
    if (! token) { alert('Please login first'); return; }

    let payload = {
        "subject": $('#new_subject').val(),
        "topic": $('#new_topic').val(),
        "subtopic": $('#new_subtopic').val(),
    };
    console.log

    $.ajax({
        url : `${APIpath}/topics/add`,
        type : 'POST',
        headers: { "x-access-token": token },
        data: JSON.stringify(payload),
        cache: false,
        contentType: 'application/json',
        success : function(returndata) {
            console.log(returndata);
            loadTopicsTable();
            
        },
        error: function(jqXHR, exception) {
            console.log("error:", jqXHR.responseText);
            alert(jqXHR?.responseJSON?.detail ?? `error: ${jqXHR.responseText}`);
        }

    });

}

function delete_subtopic() {
    let token = localStorage.getItem("qb_token");
    if (! token) { alert('Please login first'); return; }

    let selectedData = topics_table.getSelectedData();
    if(! selectedData.length) { alert("Select a row first"); return;}
    
    if(! confirm("Are you sure you want to delete this?")) return;
    
    let subtopic_id = selectedData[0].subtopic_id;
    console.log(`Deleting subtopic_id: ${subtopic_id}`);

    $.ajax({
        url: `${APIpath}/topics/delete?subtopic_id=${subtopic_id}`,
        type: "DELETE",
        headers: { "x-access-token": token },
        cache: false,
        contentType: 'application/json',
        success: function (returndata) {
            console.log(returndata);
            loadTopicsTable();
        },
        error: function (jqXHR, exception) {
            console.log("error:", jqXHR.responseText);
            alert(jqXHR?.responseJSON?.detail ?? `error: ${jqXHR.responseText}`);
        },
    });
}

// ADMINS MANAGEMENT

function admins_list() {
    let token = localStorage.getItem("qb_token");
    if (! token) { alert('Please login first'); return; }
    $.ajax({
        url: `${APIpath}/admins/list`,
        type: "GET",
        headers: { "x-access-token": token },
        cache: false,
        contentType: 'application/json',
        success: function (returndata) {
            console.log(returndata);
            let content = '';
            returndata.admins.forEach(a => {
                content += `<option value="${a}">${a}</option>`;
            })
            $('#admins_list').html(content);
            
        },
        error: function (jqXHR, exception) {
            console.log("error:", jqXHR.responseText);
            alert(jqXHR?.responseJSON?.detail ?? `error: ${jqXHR.responseText}`);
        },
    });
}

function admin_remove() {
    let token = localStorage.getItem("qb_token");
    if (! token) { alert('Please login first'); return; }
    let email = $('#admins_list').val()[0] ?? null ;
    if(! email) {alert ("Select an admin from the list first"); return;}

    if(! confirm(`Are you SURE you want to remove ${email} from the admins??`)) return;

    $('#admin_remove_status').html(`Removing..`);
    
    $.ajax({
        url: `${APIpath}/admins/remove_admin?email=${email}`,
        type: "DELETE",
        headers: { "x-access-token": token },
        cache: false,
        contentType: 'application/json',
        success: function (returndata) {
            console.log(returndata);
            $('#admin_remove_status').html(`Removed admin ${email}`);
            admins_list();
        },
        error: function (jqXHR, exception) {
            console.log("error:", jqXHR.responseText);
            alert(jqXHR?.responseJSON?.detail ?? `error: ${jqXHR.responseText}`);
        },
    });
}

function admin_add() {
    let token = localStorage.getItem("qb_token");
    if (! token) { alert('Please login first'); return; }

    let email = $('#new_admin_email').val();
    if(! validateEmail(email)) {alert('Please put a valid email address'); return;}

    if(! confirm(`Are you SURE you want to add ${email} to the admins??`)) return;

    $('#admin_add_status').html(`Adding..`);

    $.ajax({
        url: `${APIpath}/admins/add_admin?email=${email}`,
        type: "PUT",
        headers: { "x-access-token": token },
        cache: false,
        contentType: 'application/json',
        success: function (returndata) {
            console.log(returndata);
            $('#admin_add_status').html(`Added admin ${email}`);
            admins_list();
        },
        error: function (jqXHR, exception) {
            console.log("error:", jqXHR.responseText);
            alert(jqXHR?.responseJSON?.detail ?? `error: ${jqXHR.responseText}`);
        },
    });

}