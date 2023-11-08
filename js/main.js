// main.js

// GLOBAL VARIABLES
var URLParams = {}; // for holding URL parameters
var global_qlist = [];
var globalProfile = {};

// #################################
/* TABULATOR */
var itemsTotal = function (values, data, calcParams) {
    var calc = values.length;
    return calc + ' total';
}

var table1 = new Tabulator("#table1", {
    height: 400,
    selectable: 1,
    index: "id",
    clipboard: "copy",
    clipboardCopyRowRange: "selected", //change default selector to selected
    columnDefaults: {
        tooltip: true,
        headerTooltip: true,
    },
    layout: "fitDataStretch",
    // responsiveLayout: "collapse",
    // pagination:true,
    columns: [
        { title: "id", field: "id", headerFilter: "input", width: 30, bottomCalc: itemsTotal },
        { title: "subject", field: "subject_name", headerFilter: "input", width: 100 },
        { title: "topic", field: "topic_name", headerFilter: "input", width: 100 },
        { title: "subtopic", field: "subtopic_name", headerFilter: "input", width: 100 },
        { title: "title", field: "title", headerFilter: "input", width: 300 },

        { title: "subject_id", field: "subject_id", visible: false },
        { title: "topic_id", field: "topic_id", visible: false },
        { title: "subtopic_id", field: "subtopic_id", visible: false },

    ]
});

table1.on("rowSelected", function (row) {
    let h = row.getData();
    // console.log('row selected',h);
    let preview = h.preview.replace(new RegExp('IMAGEPATH', 'g'), IMGpath);

    $('#preview').html(preview);

    if(globalProfile?.email) {
        $('#admin_actions').html(`
        <p>
            <button class="btn btn-danger" onclick="delete_question(${h.id})">Delete this Question</button>
        </p>
        `);
    }
});

// table1.on("rowDeselected", function(row){
//     let h = row.getData();
//     console.log('row de-selected',h);

// });

// ###########################################################
// RUN ON PAGE LOAD
$(document).ready(function () {
    loadURLParams(URLParams);

    // Selectize initializatons

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
                updateFilter();
            }
        },
        onClear() {
            $("#topic_id")[0].selectize.clearOptions(silent = true);
            $("#subtopic_id")[0].selectize.clearOptions(silent = true);
            updateFilter();
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
                updateFilter();
            }
        },
        onClear() {
            $("#subtopic_id")[0].selectize.clearOptions(silent = true);
            updateFilter();
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
                updateFilter();
            }
        },
        onClear() {
            updateFilter();
        }
    });

    loadTopics();
    loadQuestionBank();
    loggedincheck();
});




// ###########################################################
// FUNCTIONS

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

function loadQuestionBank(category = null, value = null) {
    let url = `${APIpath}/questions/list`;
    if (category) {
        url += `?category=${category}`;
    }
    if (value) {
        url += `&value=${value}`;
    }
    $.ajax({
        url: url,
        type: "GET",
        // data : JSON.stringify(payload),
        cache: false,
        contentType: 'application/json',
        success: function (returndata) {
            console.log(returndata);
            table1.setData(returndata.data);


        },
        error: function (jqXHR, exception) {
            console.log("error:", jqXHR.responseText);
            alert(jqXHR?.responseJSON?.detail ?? `error: ${jqXHR.responseText}`);
        },
    });

}


function updateFilter() {
    table1.clearFilter(true);
    if ($('#subject_id').val()) {
        table1.addFilter("subject_id", "=", $('#subject_id').val());
        if ($('#topic_id').val()) {
            table1.addFilter("topic_id", "=", $('#topic_id').val());
            if ($('#subtopic_id').val()) {
                table1.addFilter("subtopic_id", "=", $('#subtopic_id').val());
            }
        }
    }
}

function addQuestion() {
    var selectedData = table1.getSelectedData();
    if (!selectedData.length) {
        alert("Please select a question in the table first");
        return;
    }
    let r = selectedData[0];
    let qid = r.id;

    if (global_qlist.includes(qid)) {
        alert("Question has already been added");
        return;
    }
    console.log(`Adding question ${qid} to question paper`);

    global_qlist.push(qid);

    $('#questions_list').append(`<li>
    <button onclick="selectQuestion(${qid})" class="btn btn-sm btn-outline-secondary">${qid}</button>
    ${r.title} 
    <span class="badge bg-secondary">${r.subject_name} > ${r.topic_name} > ${r.subtopic_name}</span>
    </li>`);

}

function selectQuestion(qid) {
    table1.deselectRow(); 
    table1.selectRow(qid);
    document.getElementById("preview_pane").scrollIntoView();

}

function exportQuestionPaper() {
    if (!global_qlist.length) {
        alert("Please add questions to the question paper first");
        return;
    }
    console.log(`Exporting questions: ${global_qlist}`);

    let url = `${APIpath}/questions/export`;
    let payload = { question_ids: global_qlist };

    $.ajax({
        url: url,
        type: "POST",
        data: JSON.stringify(payload),
        cache: false,
        contentType: 'application/json',
        success: function (returndata) {
            downloadFile(returndata.filename);
        },
        error: function (jqXHR, exception) {
            console.log("error:", jqXHR.responseText);
            alert(jqXHR?.responseJSON?.detail ?? `error: ${jqXHR.responseText}`);
        },
    });
}


function downloadFile(filename) {
    // Create an anchor element
    var link = document.createElement('a');
    link.href = `${EXPORTpath}/${filename}`;

    // Specify the custom filename for the downloaded file
    link.download = `questionpaper_${getCurrentTimestamp()}.docx`;

    // Simulate a click event to trigger the download
    var clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
    });
    link.dispatchEvent(clickEvent);
}


function clearQuestionsList() {
    global_qlist = [];
    $('#questions_list').empty();
}

function clearFilters() {
    $("#subject_id")[0].selectize.clear();
    $("#topic_id")[0].selectize.clear();
    $("#subtopic_id")[0].selectize.clear();

    table1.clearFilter(true);
}

// ################################
// ADMIN related

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
            // $('#verifyOTP_status').html(`Logged in as ${globalProfile.email}`);
            // loadTemplates();
            // setup_topics();
            
        },
        error: function (jqXHR, exception) {
            if(jqXHR.status == 401) {
                // token is invalidated, reset
                localStorage.removeItem("qb_token");
                console.log("Previous session if any is invalidated.");
                return;
            }
            console.log("error:", jqXHR.responseText);
            alert(jqXHR?.responseJSON?.detail ?? `error: ${jqXHR.responseText}`);
        },
    });
}

function delete_question(id) {
    let token = localStorage.getItem("qb_token") ?? null;
    if (! token) return;

    if(!confirm(`Are you sure you want to delete this question [id:${id}] ?`)) {
        return;
    }
    
    console.log(`Okk deleting the question ${id}`);

    $.ajax({
        url: `${APIpath}/questions/delete?qid=${id}`,
        type: "DELETE",
        headers: { "x-access-token": token },
        cache: false,
        contentType: 'application/json',
        success: function (returndata) {
            console.log(returndata);
            alert(`Deleted the question successfully. The page will now reload.`);
            location.reload();
            
        },
        error: function (jqXHR, exception) {
            if(jqXHR.status == 401) {
                // token is invalidated, reset
                localStorage.removeItem("qb_token");
                console.log("Previous session if any is invalidated.");
            }
            console.log("error:", jqXHR.responseText);
            alert(jqXHR?.responseJSON?.detail ?? `error: ${jqXHR.responseText}`);
        },
    });

}