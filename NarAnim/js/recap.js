function getQueryVariable(variable){    
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
        var pair = vars[i].split("=");
        if(pair[0] == variable){return pair[1];}
    }
    return(false);
}

function assignUniqueId() {
    document.getElementById('uid').value = partId;
}

//--redirect for questions page
function redirect_quest() {
    var windowAction;
    var timeSpent = $('#timer').html();
    var answers = $('#ss-form').serialize();
    var processName = getProcessName();
    var expType = localStorage["expType"];

    if (processName.indexOf('bg')!=-1) {
        logExp("Finish personal survey - TimeSpent: " + timeSpent + ' - Answer: ' + answers, partId);
        if(expType.indexOf('narration') != -1)
            windowAction="nar_vidcolo.html"; 
        else
        windowAction="nar_statcolo.html?s=bg"; 
    }
    else if(processName.indexOf('colocation')!=-1) {
        logExp("Finish questions - Model:" + processName + ' - TimeSpent: ' + timeSpent + ' - Answer: ' + answers, partId);
         if(expType.indexOf('narration') != -1)
            windowAction="nar_vidcm.html"; 
        else
            windowAction="nar_statcm.html?s=qc"; 
    }
    else if (processName.indexOf('cm')!=-1) {
        logExp("Finish questions - Model:" + processName + ' - TimeSpent: ' + timeSpent + ' - Answer: ' + answers, partId);
        windowAction="nar_qpu.html"; 
    }
    else if(processName.indexOf('pu')!=-1) {
        logExp("Finish PU and PEU survey - TimeSpent: " + timeSpent + ' - Answer: ' + answers, partId);
        windowAction="nar_end.html"; 
    }
    
    window.location.href =windowAction;
}