var $ = require('jquery');

//--------------------------------------------------------------------------

//Prevent going back in the page. --------------------------------
//-----------------------------------------------------------------
(function ($, global) {

    var _hash = "!",
    noBackPlease = function () {
        global.location.href += "#";

        setTimeout(function () {
            global.location.href += "!";
        }, 50);
    };

    global.setInterval(function () {
        if (global.location.hash != _hash) {
            global.location.hash = _hash;
        }
    }, 100);

    global.onload = function () {
        //Farida: set participant id from localstorage
        assignPartId();
        //---------------------
        noBackPlease();

        // disables backspace on page except on input fields and textarea..
        $(document.body).keydown(function (e) {
            var elm = e.target.nodeName.toLowerCase();
            if (e.which == 8 && elm !== 'input' && elm  !== 'textarea') {
                e.preventDefault();
            }
            // stopping event bubbling up the DOM tree..
            e.stopPropagation();
        });
    }

})(jQuery, window);

//--------------------------------------------------
//Add timer to check how long the user checks the model or answer the questions
//--------------------------------------------------------------
var inSecondsT; 
$(function() {
        var cd = $('#timer');
        var a = (cd.text()).split(':');
        inSecondsT = a[0]*60 + a[1]*1;
        var interv = setInterval(function() {
            inSecondsT ++;
            var minute = Math.floor((inSecondsT) / 60);
            var seconds = inSecondsT - (minute * 60);
            if(seconds < 10){
                seconds = '0'+seconds;
            }
            var c = minute + ':' + seconds;
            cd.html(c);
            if (inSecondsT == 0) {
                //window.location.reload(false);
                clearInterval(interv);
            }
        }, 1000);
    });
//--------------------------------------------------
//Add countdown to set the minimum time user checks the model
//--------------------------------------------------------------
var inSecondsC;
$(function() {
    var cd = $('#countdown');
    var a = (cd.text()).split(':');
    inSecondsC = a[0]*60 + a[1]*1;
    var interv = setInterval(function() {
        inSecondsC --;
        var minute = Math.floor((inSecondsC) / 60);
        var seconds = inSecondsC - (minute * 60);
        if(seconds < 10){
            seconds = '0'+seconds;
        }
        var c = minute + ':' + seconds;
        cd.html(c);
        if (inSecondsC == 0) {
            clearInterval(interv);
        }
    }, 1000);
});


//--button finish in legend page    
var $button = $('#finishLegend');
$button.on('click', function(){
    var windowAction = "nar_questbg.html";
    logExp("Finish legend page", partId);
    window.location.href = windowAction;
});


//--button finish in narration page (video format)
var $button = $('#finishAnim');
$button.on('click', function(){
    var response;
    var redirectPath;
    var processName = getProcessName();

    console.log('seconds ' +parseInt(inSecondsC));
    if(parseInt(inSecondsC) > 0){
        alert("Anda masih mempunyai sisa waktu untuk melihat proses model ini. Kami sarankan untuk melanjutkan kembali hingga selesai.");
    }else{
        response = confirm("Apakah Anda yakin akan melanjutkan ke pertanyaan? \n Klik OK untuk lanjut ke pertanyaan atau Cancel untuk tetap berada pada halaman ini");
        if(response==true) {
            logExp("Finish narration model - Model: " + processName , partId);
            if(processName.indexOf('colocation')!= -1)
                redirectPath = 'nar_qcolo.html';
            else if(processName.indexOf('cm') != -1)
                redirectPath = 'nar_qcm.html';
            window.open(redirectPath,'_parent',false);
        }
    }
});




