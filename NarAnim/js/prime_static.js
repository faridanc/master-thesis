/**
 * bpmn-js-seed - async
 *
 * This is an example script that loads a bpmn diagram <diagram.bpmn> and opens
 * it using the bpmn-js viewer.
 *
 * YOU NEED TO SERVE THIS FOLDER VIA A WEB SERVER (i.e. Apache) FOR THE EXAMPLE TO WORK.
 * The reason for this is that most modern web browsers do not allow AJAX requests ($.get and the like)
 * of file system resources.
 */
var $ = require('jquery');
var BpmnViewer = require('bpmn-js'),

    //EmbeddedComments = require('bpmn-js-embedded-comments'),
    ZoomScroll = require('diagram-js/lib/navigation/zoomscroll'),
    MoveCanvas = require('diagram-js/lib/navigation/movecanvas');
var viewer = new BpmnViewer({                
            container: '#canvas',
            width: '100%', height: '100%',
            additionalModules: [
                //EmbeddedComments,
                ZoomScroll,
                MoveCanvas
            ]
           });
var is = require('bpmn-js/lib/util/ModelUtil').is;
var modelingModule = require('bpmn-js/lib/features/modeling');

 var overlays = viewer.get('overlays');

//Global variables
var eventBus, event;
var loopCount=0;
var timerCoef=250;             //adjust the pace
var isStepAnimSelected=false;//if stepwise or cont animation selected
var isSelAnimSelected=false;
var isJustFollowNext=false;  //if only the following node needs to be clicked in stepwise anim
var nodetobeClicked=[]; //list of nodes that need to be clicked

//filters
var isRoleBasedAnimSelected=false;
var roleIdtobeAnimated;
var isCurObjInSelectedLane=false;
var isRandomFlowSelected=false;

var isPathSelected=false;
var isMultipleStartEvents=false;  //if there are multiple start events, user needs to select one
var selectedSeqFlowPathNum;
var selectedElementId;            //the id of the clicked element 
var seqFlowstobeClicked=[         //when the flow comes to an XOR diverging, the list of flows that user needs to clicj
    /*relatedXOR: id, 
    seqFlowId: id*/
];
var andGatewaysMerged=[           //list of converging parallel gateways. Keep track to wait all incoming at these points
    /*convAnd: id, 
    incSeqFlowId: id, 
    didFlowMerge: boolean*/
];
var gatewayCombination = [
    /*var divGatewayID, 
    var convGatewayID*/
];
var allObjects = [
    /*id,
    isPassed */
];

var lanes = [                       //list of lanes 
    /*laneId: element.id,
    laneSize:element.width,
    laneName: name*/
];
var startEvents=[/*element*/];
var numOfRepeats = 0;//how many times did the animation reach an end event 
var timeoutsArray=[];
var particId;
//specific variables for Exp2 (not necessary for the web page)
var processName; //name of the process used (for the experiment)
var appType; //type of the application to customize the file-web page, experiment etc. 
var numofPrcDTaskDEnabled=0;
var numofPrcDTaskEEnabled=0;
var numofPrcDTaskGEnabled=0;
var numofPrcDTaskHEnabled=0;
var numofPrcDTaskHExecuted=0;
var numofPrcDTaskFEnabled=0;
var numofPrcDTaskNEnabled=0;
var numofPrcDUpperANDHEnabled=0;
var numofPrcDLowerANDHEnabled=0;
var numofPrcDANDHEnabled=0;
var isSeqFlowClickedAfterHExecutedOnce=false;
//---------
var prcTLTaskMExecuted = false;
var prcTLTaskNExecuted = false;
var prcTLConvOrEnabled = false;
var prcTLConvOrExecuted = false;
//---------
var prcLTaskAExecuted = false;
var prcLTaskBExecuted = false;
var prcLConvOrEnabled = false;
var prcLConvOrExecuted = false;
//----------
//following part is necessary for inner OR
var prcTLOTaskJExecuted = false;
var prcTLOTaskKExecuted = false;
var prcTLOTaskLExecuted = false;
var prcTLOInnerConvOrEnabled = false;
var prcTLOInnerConvOrExecuted = false;
//the rest of all is necessary for outer big OR
var prcTLOTaskAExecuted=false;
var prcTLOTaskGExecuted=false;
var prcTLOTaskIExecuted=false;
var prcTLOTaskFExecuted=false;
var prcTLOOuterConvORLowerSeqExecuted=false;
var prcTLOdidLowerPathReachOuterConvOr=false;
//-------------
var numofPrcTLMTaskFEnabled=0;
//------------
var numofprcXTaskBEnabled = 0;
var numofprcXTaskCEnabled = 0;
var numofprcXTaskDEnabled = 0;
var numofprcXTaskEEnabled = 0;
var numofprcXTaskFEnabled = 0;
var numofprcXTaskGEnabled = 0;
var numofprcXTaskHEnabled = 0;
var numofprcXTaskIEnabled = 0;
var numofprcXTaskJEnabled = 0;
var numofprcXTaskNEnabled = 0;
//---------------
var numofPrcXFirstUpperXOREnabled = 0;
var numofPrcXTUpperRightConvXORTraced = 0;
var isSeqFlowClickedAfterDivXORExecutedOnceX = false;
//---------------
var prcR1LowerConvANDLeftPathPassed=false;
var prcR1LowerConvANDUpPathPassed=false;
var prcR1UpperConvANDLeftPathPassed=false;
var prcR1UpperConvANDUpPathPassed=false;
//----------------
var numofPrcRMTaskKEnabled = 0;
var numofPrcRMANDNEnabled = 0;
var numofPrcRMLowerANDNEnabled = 0;
var numofPrcRMUpperANDNEnabled = 0;
//OR part
var prcRMTaskLExecuted = false;
var prcRMTaskMExecuted = false;
var prcRMConvOrEnabled = false;
var prcRMConvOrExecuted = false;
//------------
var numofPrcR2TaskLEnabled = 0;
var numofPrcR2TaskMEnabled = 0;
//-----------
var prevClickedObj; //to cleanup mark object if new object selected`
var narrationObj; //return json object based in process type
var processType; //process type (colocation or cm)

// Import and open default xml diagram--------------------------------------------
//This function is called from the main code (just below the end of this function)
//-------------------------------------------------------------------------------
function openDiagram(diagram) {
    viewer.importXML(diagram, function(err) {
      if (!err) {
        resetAll();
		if(appType.indexOf('Exp2') != -1){
			$('[canvasVideoArea]').hide();
        	$('[canvasOverlayArea2]').hide();
		}

        var canvas = viewer.get('canvas');
        // zoom to fit full viewport
        canvas.zoom('fit-viewport');
        //log('File loaded!');
        //viewer.get('canvas').zoom('fit-viewport');

        //Get lanes so that we put lane names through the diagram
        elementRegistry = viewer.get('elementRegistry');
        //var lanes = [];
        lanes.length=0;
		
		if(appType.indexOf('PRIMEWeb') != -1){
			timerCoef = 800;
		}
        var elements = elementRegistry.filter(function(element) {
            if(is(element, 'bpmn:Lane')){
                var objToParse = element.businessObject;//Base
                var name = objToParse.name;
                lanes.push({
                    laneId: element.id,
                    laneSize:element.width,
                    laneName: name
                });
            }
        });
        //put overlays through a loop in every 400 px. Show each 400px on low zoom and the rest on high zoom
       
        for(var k=0; k<lanes.length;k++){
          var overlayPosition=400;
            var name = lanes[k].laneName;//.replace(/\s+/g, '');
            var numOfRepeatsinLane=0;
            while(overlayPosition < lanes[k].laneSize){
                var minZoomV=0;
                if(numOfRepeatsinLane%4==0 || numOfRepeatsinLane%4==2){
                    minZoomV=1.2;
                }else if (numOfRepeatsinLane%4==1){
                    minZoomV=0.7;
                }
                overlays.add(lanes[k].laneId, {
                  position: {
                    top: 0,
                    left: overlayPosition
                  },
                    show: {
                    minZoom: minZoomV,
                    maxZoom: 5.0
                  },
                  html: '<div style="color:gray; font-style:italic; font-size:12px; white-space: nowrap">' + name + '</div>'
                });
               
                overlayPosition = overlayPosition + 400;
                numOfRepeatsinLane++;
            }
        }
       
        //Populate role list combobox
		if(appType.indexOf('PRIMEWeb') != -1){
        	populateRoleDropdown();
		}
        } else {
        //log('something went wrong:', err);
      }
        //create an event handler to get and log zoom level when mouse scroll is used
        if(appType.indexOf('PRIMEWeb') != -1){
			particId = processId();
            logExp("Start static model - Model: "+ processType, particId);
		}
        document.getElementById("canvas").addEventListener("wheel", myFunction);
        function myFunction() {
            //mouse is scroleed
			if(appType.indexOf('Exp2') != -1){
	            //For Exp2: disable zoom, always fix at default zoom.
	            viewer.get('canvas').zoom('fit-viewport');
			}
            
            //logExp("zoomPrc1Anim "+ viewer.get('canvas').zoom(false), particId);
        }
        //event handlers for bpmn-io
        eventBus = viewer.get('eventBus');
        // you may hook into any of the following events
        events = [
          //'element.hover',
          //'element.out',
          'element.click',
          //'element.dblclick',
          //'element.mousedown',
          //'element.mouseup'
        ];
        events.forEach(function(event) {
          eventBus.on(event, function(e) {
              //we get here when there is a click on an element. We will perform relevant activities by checking the click
              console.log('clicked to item '+e.element.id);

              //Farida: log, display narration text corresponding to selected element and color it
              logExp("ClickNode "+processType+' '+e.element.businessObject.name+' '+e.element.id, particId);
              getNarrationText(e.element);
              //--end--
              
          });//end of eventBus function
        });//end of events.forEach(function(event)... function
    });//end of importXML function
}//end of openDiagram function

//Main actions, run when .js is first called. getAppType() and processType() functions are called from the main html.----------
//-----------------------------------------------------------------------------------------------------------------------------
appType = getAppType(); 
//Farida : get JSON object for narration text
narrationObj = getNarrationJSON();
processType = getProcessType();

var fs = require('fs');
var xmlDiagram;
if(appType.indexOf('PRIMEWeb') != -1){
    if(processType.indexOf('colocation')!=-1)
	    xmlDiagram = fs.readFileSync(__dirname + '/../resources/Experiment-Colocation (v3) Ind.bpmn', 'utf-8');
    else if(processType.indexOf('cm')!=-1)
        xmlDiagram = fs.readFileSync(__dirname + '/../resources/Experiment-Change Management (v2) Ind.bpmn', 'utf-8');
}

openDiagram(xmlDiagram);

//setTimeout(showAlertatStartUp, 500);
//End of the main code run when js is called-----------------------------------------------------------------------------------


//Show alert at the beginning--------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------------------
function showAlertatStartUp(){
    var r = alert("Please go ahead with analyzing the model with the animation now.\n\n The animation will start immediately. Select a start event to continue.\nYou can analyze as long as you like. The animation will restart when the end event is reached.");
    $('[animStep-button-click]').prop('disabled', true);
    $('[animSel-button-click]').prop('disabled', true);
    var timeStamp = Math.floor(Date.now() / 1000); 
    //Butona basildigi zaman ile ayni is yapiliyor. 
    initiateAnimation();
}

//START BUTTON CLICK functions (based on tags on the html file)----------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------------------

//When the user show filters and selects the role dropdown, this part is called (still experimental)---------------------------
//-----------------------------------------------------------------------------------------------------------------------------
function populateRoleDropdown(){
    $('[roleList-dropdown-click]').empty();
    var isRoleDropdownFilled = false;
    if(lanes.length > 0){
        for (i=0; i<lanes.length; i++){ 
           if(lanes[i].laneName.indexOf('undefined') == -1){//if the name is undefined, add it to the list. If everything is undefined, we need to disable the checkbox
               $('<option/>').val(lanes[i].laneName).html(lanes[i].laneName).appendTo('[roleList-dropdown-click]');
               isRoleDropdownFilled = true;
           }
        }
    }
    if(lanes.length == 0 || isRoleDropdownFilled == false){
        $('[roleFilter-click]').prop('disabled', true);
    }
}


//------------------------------------------------------------------

//Animate automatically but expect the user to select conditions----
//------------------------------------------------------------------
var $buttonanimSel = $('[animSel-button-click]');
$buttonanimSel.on('click', function(){
    isSelAnimSelected = true;
    initiateAnimation();
});
//-----------------------------------------------------------------

//Animate stepwise. The user needs to make a selection at every step----
//----------------------------------------------------------------------
var $buttonanimStep = $('[animStep-button-click]');
$buttonanimStep.on('click', function(){
        //log('Anim started');
    //console.log(viewer.definitions); Banu: the whole process tree
    //logExp("SelAnimRestarted ", particId);
	if(appType.indexOf('Exp2') != -1){
    	resetandInitiateAnim();//Banu: check if this is necessary in Exp2 or not. 
	}
    isStepAnimSelected = true;
    initiateAnimation();
});
//---------------------------------------------------------------------

//Reset the animation and restart with the original settings-------
//--------------------------------------------------------------------
var $buttonReset = $('[reset-button-click]');
$buttonReset.on('click', function(){
    //location.reload(); 
    //logExp("SelAnimCleared ", particId);
    resetandInitiateAnim();
});
//--------------------------------------------------------------------

//Start the animation tutorial----------------------------------------
//--------------------------------------------------------------------
var $buttonanimTutor = $('[animTutorial-button-click]');
$buttonanimTutor.on('click', function(){
    window.open('tutorial-web.html','_parent',false);
});
//-------------------------------------------------------------------


//------------------------------------------------------------------

//Finalize the animation and go to questions-----------------------
//-----------------------------------------------------------------

var $button = $('#finishAnim');
$button.on('click', function(){
    //location.reload(); 
    var response;
    var redirectPath;
    console.log('seconds ' +parseInt(inSeconds));
    //---check timespent for each model
    //colocation : mininum time 8 mins = 480secs, cm : minimum time 14 mins = 840secs
    if((processType.indexOf('colocation')!=-1 && (parseInt(inSeconds) < 480)) || (processType.indexOf('cm')!=-1 && (parseInt(inSeconds) < 840)))  
            alert("Anda masih mempunyai sisa waktu untuk melihat proses model ini. Kami sarankan untuk melanjutkan kembali hingga selesai.");    
    else{
        response = confirm("Apakah Anda yakin akan melanjutkan ke pertanyaan? \n Klik OK untuk lanjut ke pertanyaan atau Cancel untuk tetap berada pada halaman ini");
        if(response==true)
        {
            var timeSpent = $('#timer').html();
            logExp("Finish static model - Model: " + processType + ' - TimeSpent: ' + timeSpent, particId);
            if(processType.indexOf('colocation')!= -1)
                redirectPath = 'nar_qcolo.html';
            else if(processType.indexOf('cm') != -1)
                redirectPath = 'nar_qcm.html';
            window.open(redirectPath,'_parent',false);
        }
    }
});


//-----------------------------------------------------------------

//------------------------------------------------------------------
//END BUTTON CLICK functions (based on tags on the html file)----------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------------------

//START TIMEOUT FUNCTIONS------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------------------

//Highlight the given object with given color in----
//given loop count timer----------------------------
//--------------------------------------------------
function doSetTimeoutObj(highId, loopCountC, color){
    var highIdd = highId;
    timeoutsArray[timeoutsArray.length] = setTimeout(function(){
        viewer.get('canvas').addMarker(highId, color);}
               , loopCountC);
}
//Clean object before marking it with something new------
//-------------------------------------------------------
function doSetTimeoutCleanObj(highId, loopCountC, color){
    var highIdd = highId;
    timeoutsArray[timeoutsArray.length] = setTimeout(function(){
        viewer.get('canvas').removeMarker(highId, color);}
               , loopCountC);
}
//Highlight the given flow with given color in------
//given loop count timer----------------------------
//--------------------------------------------------
function doSetTimeoutFlow(seqFlow1, loopCountC, color){
    //var myTimer = setTimeout(setMarker(highIdd, canvasA), loopCountC);//nextObjectin bas
    timeoutsArray[timeoutsArray.length] = setTimeout(function(){
        //color only the first sequence flow
        var outgoingGfx = viewer.get('elementRegistry').getGraphics(seqFlow1.id);
        //Farida : modify outGoingGfx
        //outgoingGfx.select('path').attr({stroke: color});
        var outGoingPath = outgoingGfx.getElementsByTagName('path')[0];
        outGoingPath.style.stroke = color;
    }, loopCountC);
}
//alert the user at the end of the animation------
//--------------------------------------------------
function doSetTimeoutEndAlert(loopCountC){
    //var myTimer = setTimeout(setMarker(highIdd, canvasA), loopCountC);//nextObjectin bas
    timeoutsArray[timeoutsArray.length] = setTimeout(function(){
        //color only the first sequence flow
        //alert('Please Restart to play the animation again.');
    }, loopCountC);
}
function doSetTimeoutResetandInitiate(loopCountC){
    //var myTimer = setTimeout(setMarker(highIdd, canvasA), loopCountC);//nextObjectin bas
    timeoutsArray[timeoutsArray.length] = setTimeout(function(){
        //color only the first sequence flow
        resetandInitiateAnim();
    }, loopCountC);
}
//END TIMEOUT FUNCTIONS------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------------------

//Start the animation------------------------------------------------
//-------------------------------------------------------------------
function initiateAnimation(){
    //either when a button is clicked or user opens the page for the first time or returns back to start.
    if(appType.indexOf('PRIMEWeb') != -1){
		$('[animStep-button-click]').prop('disabled', true);
	}
    $('[animSel-button-click]').prop('disabled', true);
    //disable also role selection filters
    $('[roleFilter-click]').prop('disabled', true);
    $('[roleList-dropdown-click]').prop('disabled', true);
    $('[randomFlow-click]').prop('disabled', true);

    canvas = viewer.get('canvas');
    overlays = viewer.get('overlays');
    //timerCoef = 800;
    //butun elemanlarin uzerinden dolasip And diverging gateway olanlari bulup source seqlari ata
    elementRegistry = viewer.get('elementRegistry');
    var allElements = elementRegistry.getAll();
    setConvergingParallelGatewayArray(allElements);
    markSeqInOrder();
}
//-------------------------------------------------------------------

//Function to reset everything. Use at restart, when the animation reaches the end or started again. 
//-------------------------------------------------------------------
function resetAll(){
    loopCount=0;
    //timerCoef=0;             //adjust the pace
    isStepAnimSelected=false;//if stepwise or cont animation selected
 
    if(appType.indexOf('PRIMEWeb') != -1){
		isSelAnimSelected=false;
	}
    isJustFollowNext=false;  //if only the following node needs to be clicked in stepwise anim
    nodetobeClicked.length=0; //list of nodes that need to be clicked

    isPathSelected=false;
    isMultipleStartEvents=false;  //if there are multiple start events, user needs to select one
    selectedSeqFlowPathNum=0;
    selectedElementId=0;            //the id of the clicked element 
    seqFlowstobeClicked.length=0;
    andGatewaysMerged.length=0;
    gatewayCombination.length=0;
    allObjects.length=0;
    startEvents.length=0;
    lanes.length=0;
    //Initiation for Exp2
    numofPrcDTaskDEnabled = 0;
    numofPrcDTaskEEnabled = 0;
    numofPrcDTaskGEnabled=0;
    numofPrcDTaskHEnabled = 0;
    numofPrcDTaskHExecuted = 0;
    numofPrcDTaskFEnabled=0;
    numofPrcDTaskNEnabled=0;
    numofPrcDUpperANDHEnabled = 0;
    numofPrcDLowerANDHEnabled = 0;
    numofPrcDANDHEnabled = 0;
    isSeqFlowClickedAfterHExecutedOnce=false;
    //--------
    prcTLTaskMExecuted = false;
    prcTLTaskNExecuted = false;
    prcTLConvOrEnabled = false;
    prcTLConvOrExecuted = false;
    //-----------
    prcLTaskAExecuted = false;
    prcLTaskBExecuted = false;
    prcLConvOrEnabled = false;
    prcLConvOrExecuted = false;
    //-------------
    prcTLOTaskJExecuted = false;
    prcTLOTaskKExecuted = false;
    prcTLOTaskLExecuted = false;
    prcTLOTaskFExecuted = false;
    prcTLOInnerConvOrEnabled = false;
    prcTLOInnerConvOrExecuted = false;
    prcTLOTaskAExecuted=false;
    prcTLOTaskGExecuted=false;
    prcTLOTaskIExecuted=false;
    prcTLOOuterConvORLowerSeqExecuted=false;
    prcTLOdidLowerPathReachOuterConvOr=false;
    //--------------
    numofPrcTLMTaskFEnabled = 0;
    //---------------
    numofPrcXFirstUpperXOREnabled = 0;
    numofPrcXTUpperRightConvXORTraced = 0;
    isSeqFlowClickedAfterDivXORExecutedOnceX = false;
    numofprcXTaskFEnabled = 0;
    //--------------
    prcR1LowerConvANDLeftPathPassed=false;
    prcR1LowerConvANDUpPathPassed=false;
    prcR1UpperConvANDLeftPathPassed=false;
    prcR1UpperConvANDUpPathPassed=false;
    //--------------
    numofPrcRMTaskKEnabled = 0;
    numofPrcRMANDNEnabled = 0;
    numofPrcRMLowerANDNEnabled = 0;
    numofPrcRMUpperANDNEnabled = 0;
    prcRMTaskLExecuted = false;
    prcRMTaskMExecuted = false;
    prcRMConvOrEnabled = false;
    prcRMConvOrExecuted = false;
    //--------------
    numofPrcR2TaskLEnabled = 0;
    numofPrcR2TaskMEnabled = 0;
    //------------ End of initiation for Exp2
    
    isCurObjInSelectedLane=false;
    //reset all timeouts
    for(var i=0; i<timeoutsArray.length; i++){
        clearTimeout(timeoutsArray[i]);
    }
    timeoutsArray.length=0;
    //openDiagram(xmlDiagram);
    //if role based anim is not selected before, enable it
    if(isRoleBasedAnimSelected == false){
        $('[animStep-button-click]').prop('disabled', false);
    }
    $('[animSel-button-click]').prop('disabled', false);
    //enable also role selection filters
    $('[roleFilter-click]').prop('disabled', false);
    if(isRoleBasedAnimSelected == true)
        $('[roleList-dropdown-click]').prop('disabled', false);
    if(isRoleBasedAnimSelected == false){
        $('[roleList-dropdown-click]').prop('disabled', true);
        $('[randomFlow-click]').prop('disabled', false);
    }
    //removed for Exp2. No update for the pace
	if(appType.indexOf('PRIMEWeb') != -1){
    	document.getElementById("paceclick").value = "-800";
	}
}
//-------------------------------------------------------------------

//To remove all paints on all elements in case of a reset.  
//-------------------------------------------------------------------
function removeAllHighlights(){
    var regElements = viewer.get('elementRegistry').getAll();
    for(var i = 0; i < regElements.length; i++){
        //console.log
        if(regElements[i].businessObject.$type.indexOf('SequenceFlow') != -1){
            var outgoingGfx = viewer.get('elementRegistry').getGraphics(regElements[i].businessObject.id); 
            //Farida: modify outGoingGfx
            //outgoingGfx.select('path').attr({stroke: 'black'});
            var outGoingPath = outgoingGfx.getElementsByTagName('path')[0];
            outGoingPath.style.stroke = 'black';
        }else{
            viewer.get('canvas').removeMarker(regElements[i].businessObject.id, 'highlight');
            viewer.get('canvas').removeMarker(regElements[i].businessObject.id, 'highlight-light');
            viewer.get('canvas').removeMarker(regElements[i].businessObject.id, 'highlight-toselect');
        }
    }
}
//-------------------------------------------------------------------

//reset both the parameters and remove the paints.-------------------
//-------------------------------------------------------------------
function resetandInitiateAnim(){
    resetAll();
    removeAllHighlights();
    //openDiagram(xmlDiagram);
    //initiateAnimation();
}

//Parse all converging parallel gateways at the beginning of the animation----
//----------------------------------------------------------------------------
function setConvergingParallelGatewayArray(allElements){
    for(var i=0; i<allElements.length; i++){
        if((allElements[i].businessObject.$type.indexOf('ParallelGateway') != -1  || allElements[i].businessObject.$type.indexOf('InclusiveGateway') != -1) && allElements[i].businessObject.gatewayDirection.indexOf('Converging') != -1){
            //when we find a converging paralel, we willl assign all its incomings to our array
            for(var k=0; k<allElements[i].businessObject.get('incoming').length;k++){
                //let's check if the same value exists. If not, let's add it. 
                var isThereDuplicate=false;
                for(var l=0; l<andGatewaysMerged.length;l++){
                    if(andGatewaysMerged[l].convAnd ==allElements[i].businessObject.id && 
                      andGatewaysMerged[l].incSeqFlowId ==allElements[i].businessObject.get('incoming')[k].id)
                        isThereDuplicate=true;
                }
                if(isThereDuplicate==false){
                    andGatewaysMerged.push({
                        convAnd: allElements[i].businessObject.id,
                        incSeqFlowId: allElements[i].businessObject.get('incoming')[k].id,
                        didFlowMerge: false
                    });
                }
            }
        }
    }
}
//------------------------------------------------------------------------------

//Initiate the animation by finding start events and then triggering recursion----
//--------------------------------------------------------------------------------
function markSeqInOrder(){
    elementRegistry = viewer.get('elementRegistry');
    //find all start events and mark them to let user select one
    var index = 0;//we will not push the events with odd numbers
    //because then, it pushes both the shape and its label
    var elements = elementRegistry.filter(function(element) {
      if(is(element, 'bpmn:StartEvent')){
          index++;
          if(index % 2 == 0){//sadece ilk shapei ekleyecegiz
              var startEventShape = elementRegistry.get(element.id);
              var strtEventToParse = startEventShape.businessObject;//Base 
              startEvents.push(strtEventToParse);
          }
      }
    });
    console.log('did we find sequence flow?');
    console.log(startEvents[0].get('outgoing')[0]);
    findGatewayCouples(startEvents[0].get('outgoing')[0]);
    console.log('did we find couple ANDs?');
    console.log(gatewayCombination);
    //var startEvent = startEvents[0];
    /* start event hrs diklik utk mulai proses */
    /*if(startEvents.length == 1){//if there is one start event, we start the animation and continue 
        markObjectAndSeqFlow(startEvents[0].id, 'highlight', 'lime');
        var currShape = elementRegistry.get(startEvents[0].id);
        var currShapeType = currShape.type;//bpmn:StartEvent
        var objToParse = currShape.businessObject;//Base 
        if(objToParse.get('outgoing')[0] === undefined)
            return;
        var seqFlow = objToParse.get('outgoing');
        var pathNum = seqFlow.length;
        if(pathNum == 1){
            findNextObject(seqFlow[0]);
        }
    }else{//if there is more than one start event, the user needs to select one*/
        isMultipleStartEvents = true;
        for(var i=0; i< startEvents.length;i++){
            //kullanicinin secmesi gerekenleri isaretliyoruz
            markObject(startEvents[i].id, 'highlight-toselect');
        }
   // }
}
//-----------------------------------------------------------------------------------

//Recursive animation basically doing all the stuff for both stepwise and regular----
//-----------------------------------------------------------------------------------
function findNextObject(seqFlowToParse){
    var nextObject = seqFlowToParse.targetRef;
    var nextObjectType = nextObject.$type;
    if(nextObjectType.indexOf('EndEvent') != -1){
        loopCount+=2;
        markObject(nextObject.id, 'highlight');
        loopCount+=10;
        numOfRepeats++;
        //logExp("endEventPrc1Anim "+numOfRepeats, particId);
		if(appType.indexOf('Exp2') != -1){
        	logExp("endEventReached "+processName+' repno '+numOfRepeats, particId);
        }else if(appType.indexOf('PRIMEWeb') != -1){
			logExp(particId+" endEventPrc1Anim "+numOfRepeats, "WebLogger");
        }
		//Alert user that the animation will start again.
        //Removed for Experiment 2
		if(appType.indexOf('PRIMEWeb') != -1){
        	doSetTimeoutEndAlert(timerCoef*(loopCount+1));
		}
        loopCount+=1;
        //resetAll();
        //Below four lines removed for Experiment 2
		if(appType.indexOf('PRIMEWeb') != -1){
	        var tempLoopCount = loopCount;
	        doSetTimeoutResetandInitiate(timerCoef*(tempLoopCount));
	        //It does the same when the button is pressed.  
	        loopCount = tempLoopCount;
		}
    }
    else if(nextObjectType.indexOf('Task') != -1 || nextObjectType.indexOf('Event') != -1
           || nextObjectType.indexOf('SubProcess') != -1){
        var seqFlow = nextObject.get('outgoing');
        //identify if role based selected, in current lane
        isCurObjInSelectedLane = false;
        if(lanes.length >0){
            var curLaneId = nextObject.lanes[0].id;
        }
        if(isRoleBasedAnimSelected == true && roleIdtobeAnimated.indexOf(curLaneId) != -1){
            isCurObjInSelectedLane = true;
        }
        
        if(isStepAnimSelected == true){
            markCleanObject(nextObject.id, 'highlight');
            markCleanObject(nextObject.id, 'highlight-light');
            loopCount++;
            markObject(nextObject.id, 'highlight-light');
            loopCount++;
            isJustFollowNext=true;
            nodetobeClicked.push(nextObject.id);
            return;
        }
        //check if role filtering is active
        if(isRoleBasedAnimSelected == false || (isRoleBasedAnimSelected == true && isCurObjInSelectedLane == true)){
            markCleanObject(nextObject.id, 'highlight');
            markObjectAndSeqFlow(nextObject.id, 'highlight', 'lime');
            loopCount++;
            isCurObjInSelectedLane = false;
            findNextObject(seqFlow[0]);
        }else{//if role based anim selected but the object is not in the selected lane
            //markCleanObject(nextObject.id, 'highlight');
            //markObjectAndSeqFlow(nextObject.id, 'highlight', 'lime');
            //loopCount++;
            findNextObject(seqFlow[0]);
        }
    }else if((nextObjectType.indexOf('ExclusiveGateway') !=-1) 
             && nextObject.gatewayDirection == "Diverging"){
        var seqFlow = nextObject.get('outgoing');
        var pathNum = seqFlow.length;
        //check if role based anim is selected and if the object is in the selected lane
        isCurObjInSelectedLane = false;
        if(lanes.length >0){
            var curLaneId = nextObject.lanes[0].id;
        }
        if(isRoleBasedAnimSelected == true && roleIdtobeAnimated.indexOf(curLaneId) != -1){
            isCurObjInSelectedLane = true;
        }
        
        if(isRoleBasedAnimSelected == false || isCurObjInSelectedLane == true){
            markCleanObject(nextObject.id, 'highlight');
            loopCount++;
            markObject(nextObject.id, 'highlight');
        }
        for(var i=0; i<pathNum;i++){
            seqFlowstobeClicked.push({
                relatedXOR: nextObject.id, 
                seqFlowId: seqFlow[i].id});
            if(isRandomFlowSelected == false && ((isRoleBasedAnimSelected == false) || (isRoleBasedAnimSelected == true && isCurObjInSelectedLane == true))){
                loopCount++;
                markSeqFlowwithGivenId(seqFlow[i].id, 'Magenta');
            }
        }
        console.log('which ones to click: ');
        console.log(seqFlowstobeClicked);
        
        if(isRandomFlowSelected == true || (isRoleBasedAnimSelected == true && isCurObjInSelectedLane == false)){//if obj in another lane, assign selection randomly
            var randomSelectedPath = Math.floor((Math.random() * pathNum)+1)-1;
            //findNextObject(seqFlow[(randomSelectedPath)]);
            //TODO: Check this following conditions. Can be wrong.
            if(isRandomFlowSelected == true || (isRoleBasedAnimSelected == false || (isRoleBasedAnimSelected == true && isCurObjInSelectedLane == true))){
                markSeqFlowwithGivenId(seqFlow[randomSelectedPath].id, 'Magenta');
                loopCount++;
                markSeqFlowwithGivenId(seqFlow[randomSelectedPath].id, 'lime');
            }
            var shape1 = elementRegistry.get(seqFlow[randomSelectedPath].id);
            eventBus.fire('element.click', { element: shape1 });
        }
        return;
        
    }else if((nextObjectType.indexOf('ExclusiveGateway') !=-1) && nextObject.gatewayDirection == "Converging"){
        //check if role based anim is selected and if the object is in the selected lane
        isCurObjInSelectedLane = false;
        if(lanes.length >0){
            var curLaneId = nextObject.lanes[0].id;
        }
        if(isRoleBasedAnimSelected == true && roleIdtobeAnimated.indexOf(curLaneId) != -1){
            isCurObjInSelectedLane = true;
        }
        //We remove the following part so that in stepAnim, it automatically flows through converging XOR. There is no need for the user to select the gateway. If we prefer it to be clicked by the user as well, we need to enable this. 
        /*if(isStepAnimSelected == true){
            markCleanObject(nextObject.id, 'highlight');
            loopCount++;
            markObject(nextObject.id, 'highlight-light');
            isJustFollowNext=true;
            nodetobeClicked.push(nextObject.id);
            return;
        }*/
		if(appType.indexOf('Exp2') != -1){
	        //Specific to Exp2 ProcessD-Similar. If XOR before D, E and G is traversed twice, set the parameter. 
	        if(nextObject.id.indexOf('sid-3A5661A0-3267-4EDC-B98F-EDD80290D10E') != -1 && processName.indexOf('ProcessD-Similar') != -1){
	            numofPrcDTaskDEnabled++;
	        }else if(nextObject.id.indexOf('sid-940B7FE8-962D-4925-9872-FC566EB65609') != -1 && processName.indexOf('ProcessD-Similar') != -1){
	            numofPrcDTaskEEnabled++;//convergin XOR before E
	        }else if(nextObject.id.indexOf('sid-E2AC263C-7EDB-47BE-BC88-86E7C484A833') != -1 && processName.indexOf('ProcessD-Similar') != -1){
	            numofPrcDTaskGEnabled++;
	        }else if(nextObject.id.indexOf('sid-F0C72DE7-CF23-4695-B219-61A477D9145D') != -1 && processName.indexOf('ProcessD-Similar') != -1){
	            numofPrcDLowerANDHEnabled++;     //Conv XOR before H is enabled
	        }
	        //Specific to Exp2 TwoLevel-Mismatch. If XOR before D is traversed twice, set the parameter
	        else if(nextObject.id.indexOf('sid-ACF5969B-0BF1-4602-BFE9-9F91FE5AC2F4') != -1 && processName.indexOf('TwoLevel-Mismatch') != -1){
	            numofPrcTLMTaskFEnabled++;     //Conv XOR before F is enabled
	        }
	        //Specific to Exp2 ProcessX-Similar. If upper first XOR is reached now, decrease the number of enable
	        else if(nextObject.id.indexOf('sid-8EC6FCBE-50B3-42A2-A228-45E0C727D803') != -1 && processName.indexOf('ProcessX-Similar') != -1){
	            numofPrcXFirstUpperXOREnabled--;  
	            //if(numofPrcXFirstUpperXOREnabled > 0){
	                loopCount++;
	                markCleanObject(nextObject.id, 'highlight');
	                markCleanObject(nextObject.id, 'highlight-light');
	                loopCount++;
	                markObject(nextObject.id, 'highlight');
	            //}
	        }//if upper right conv XOR is reached now, increase the number of trace on it. 
	        else if(nextObject.id.indexOf('sid-778708D4-C8F4-4C3D-9C31-60024132FB63') != -1 && processName.indexOf('ProcessX-Similar') != -1){
	            numofPrcXTUpperRightConvXORTraced++;  
	            if(isSeqFlowClickedAfterDivXORExecutedOnceX == true){
	                //no need to take care of double seq flow selection any more. 
	                numofPrcXTUpperRightConvXORTraced = 0;
	            }
	        }else if(nextObject.id.indexOf('sid-F6D76510-1E47-4425-84CC-4F129DF25A7F') != -1 && processName.indexOf('ProcessX-Similar') != -1){
	            numofprcXTaskFEnabled++;//convergin XOR before F
	        }
	        //for Exp2 PrcRM. If XOR before E is traversed twice, set the parameter. 
	        else if(nextObject.id.indexOf('sid-70C3355A-9E32-41FE-B682-AE841D1D23F9') != -1 && processName.indexOf('ReworkMismatch') != -1){
	            numofPrcRMTaskKEnabled++;//convergin XOR before K
	        }
	        //The following is for Rigid2. L and M is enabled twice
	        else if(nextObject.id.indexOf('sid-B9874E20-F6E2-4772-B35C-59992AC58E76') != -1 && processName.indexOf('Rigid2') != -1){
	            numofPrcR2TaskLEnabled++;//convergin XOR before E
	        }
	        //end of Exp2 specific. 
		}//end of check appType=Exp2
        
        if(isRoleBasedAnimSelected == false || isCurObjInSelectedLane == true){
            markCleanObject(nextObject.id, 'highlight');
            markObjectAndSeqFlow(nextObject.id, 'highlight', 'lime');
            isCurObjInSelectedLane = false;
        }
        var seqFlow = nextObject.get('outgoing');
        findNextObject(seqFlow[0]);
    }
    else if((nextObjectType.indexOf('ParallelGateway') !=-1  || nextObjectType.indexOf('InclusiveGateway') !=-1) 
             && nextObject.gatewayDirection == "Converging"){
		if(appType.indexOf('Exp2') != -1){
        //Only for Exp2 ProcessD-Similar. Before H, we will check the number of visits to upper and lower seq flows. 
        if(nextObject.id.indexOf('sid-C9870141-F3CA-413D-BFE3-DDB21B3D6362') != -1 && processName.indexOf('ProcessD-Similar') != -1){
            //if we have reached the correct AND, let's see the seq flows
            var isFlowAfterANDEnabled = false;
            if(numofPrcDLowerANDHEnabled >0 && numofPrcDUpperANDHEnabled >0){
                //the flow can continue to next.
                markCleanObject(nextObject.id, 'highlight');
                loopCount++;
                markObject(nextObject.id, 'highlight');
                isFlowAfterANDEnabled = true;
                numofPrcDLowerANDHEnabled--;
                numofPrcDUpperANDHEnabled--;
                numofPrcDANDHEnabled++; 
                numofPrcDTaskHEnabled++;
            }
            //Before we continue, mark the seq flow with missing exec 
            var upperSeqFlowID = 'sid-DF2D6D3F-A69F-4B84-BE6C-398950E96C14';
            var lowerSeqFlowID = 'sid-EF7A2AAF-7EE6-4904-9523-4890F4928EE4';
            if((numofPrcDLowerANDHEnabled > numofPrcDUpperANDHEnabled) && numofPrcDANDHEnabled > 0){
                markSeqFlowwithGivenId(upperSeqFlowID, 'black');
            }else if((numofPrcDUpperANDHEnabled > numofPrcDLowerANDHEnabled) && numofPrcDANDHEnabled > 0){
                markSeqFlowwithGivenId(lowerSeqFlowID, 'black');
            }//if they are both 0, don't do anything. 
            
            //continue with routine flow to the next item
            if(isFlowAfterANDEnabled == true){
                var seqFlow = nextObject.get('outgoing');
                var pathNum = seqFlow.length;
                for(var i=0; i<pathNum;i++){
                    if(isRoleBasedAnimSelected == false || isCurObjInSelectedLane == true){
                        loopCount++;
                        markSeqFlowwithGivenId(seqFlow[i].id, 'lime');
                    }
                    findNextObject(seqFlow[i]);
                }
            }
            return; //return so that regular stuff is not executed specific to this AND.
        }//for Exp2 PrcTL. When it comes to converging OR, wait for M or N. 
        else if(nextObject.id.indexOf('sid-B9FCF1BF-2060-48F4-8667-E6BB8B0C2870') != -1 && processName.indexOf('ThreeLevel') != -1){
            if(prcTLTaskMExecuted == true && prcTLTaskNExecuted == true){
                //we want it to continue like regular conv AND. Do nothing special, just continue. Only remove from the node to be clicked so that it can continue. 
                for(var n=0; n<nodetobeClicked.length;n++){
                    if(nodetobeClicked[n].indexOf(nextObject.id) != -1){ 
                        nodetobeClicked.splice(n, 1);
                    }
                }
                isJustFollowNext=false;
                prcTLTaskMExecuted = false;
                prcTLTaskNExecuted = false;
            }else{
                markCleanObject(nextObject.id, 'highlight');
                loopCount++;
                markObject(nextObject.id, 'highlight-light');
                isJustFollowNext=true;
                nodetobeClicked.push(nextObject.id);
            }
        }
        //for Exp2 PrcL-Similar. When it comes to first converging OR, wait for A or B. 
        else if(nextObject.id.indexOf('sid-D4CD6B85-92DA-45F6-BCCB-F9289102B5AA') != -1 && processName.indexOf('ProcessL-Similar') != -1){
            if(prcLTaskAExecuted == true && prcLTaskBExecuted == true){
                //we want it to continue like regular conv AND. Do nothing special, just continue. Only remove from the node to be clicked so that it can continue. 
                for(var n=0; n<nodetobeClicked.length;n++){
                    if(nodetobeClicked[n].indexOf(nextObject.id) != -1){ 
                        nodetobeClicked.splice(n, 1);
                    }
                }
                isJustFollowNext=false;
                prcLTaskAExecuted = false;
                prcLTaskBExecuted = false;
            }else{
                //then color conv OR regularly
                markCleanObject(nextObject.id, 'highlight');
                loopCount++;
                markObject(nextObject.id, 'highlight-light');
                isJustFollowNext=true;
                nodetobeClicked.push(nextObject.id);
            }
        }
        //for Exp2 PrcL-Similar. When it comes to last converging OR, behave exactly like XOR
        else if(nextObject.id.indexOf('sid-7C6432B3-1582-43C3-AB0B-2E8C25312353') != -1 && processName.indexOf('ProcessL-Similar') != -1){
            markCleanObject(nextObject.id, 'highlight');
            markObjectAndSeqFlow(nextObject.id, 'highlight', 'lime');
            isCurObjInSelectedLane = false;
            var seqFlow = nextObject.get('outgoing');
            findNextObject(seqFlow[0]);
            //this is all the same as whan an XOR does. Then, we return so that AND behavior is not performed. 
            return;
        }
        //for Exp2 PrcTLO (TwoLevel-OR). When it comes to converging OR, wait for J, K or L. 
        else if(nextObject.id.indexOf('sid-84238CE5-A20F-4E5B-A6C8-B286CEABE731') != -1 && processName.indexOf('TwoLevel-OR') != -1){
            if(prcTLOTaskJExecuted == true && prcTLOTaskKExecuted == true && prcTLOTaskLExecuted == true){
                //we want it to continue like regular conv AND. Do nothing special, just continue. Only remove from the node to be clicked so that it can continue. 
                for(var n=0; n<nodetobeClicked.length;n++){
                    if(nodetobeClicked[n].indexOf(nextObject.id) != -1){ 
                        nodetobeClicked.splice(n, 1);
                    }
                }
                isJustFollowNext=false;
                prcTLOTaskJExecuted = false;
                prcTLOTaskKExecuted = false;
                prcTLOTaskLExecuted = false;
            }else{
                markCleanObject(nextObject.id, 'highlight');
                loopCount++;
                markObject(nextObject.id, 'highlight-light');
                isJustFollowNext=true;
                
                var isInnerConvORInNodetoClickList=false;
                for(var n=0; n<nodetobeClicked.length;n++){
                    if(nodetobeClicked[n].indexOf(nextObject.id) != -1){ 
                        isInnerConvORInNodetoClickList=true;
                    }
                }
                if(isInnerConvORInNodetoClickList == false){
                    nodetobeClicked.push(nextObject.id);
                }
            }
        }
        //Prc TLO outer OR converging. When it arrives here automatically, expect F or lower path to be executed to automatically move forward. 
        else if(nextObject.id.indexOf('sid-BDF017DE-8C00-4CE1-9A3F-C254D51AF719') != -1 && processName.indexOf('TwoLevel-OR') != -1){
            if(prcTLOTaskFExecuted == true && prcTLOOuterConvORLowerSeqExecuted == true){
                //we want it to continue like regular conv AND. Do nothing special, just continue. Only remove from the node to be clicked so that it can continue. 
                for(var n=0; n<nodetobeClicked.length;n++){
                    if(nodetobeClicked[n].indexOf(nextObject.id) != -1){ 
                        nodetobeClicked.splice(n, 1);
                    }
                }
                isJustFollowNext=false;
                prcTLOTaskFExecuted = false;
                prcTLOOuterConvORLowerSeqExecuted = false;  
            }else{
                //we can't just move on. We either wait for paths to be completed, or the user to specifically click
                //but before, mark which side approached OR so that we can check the other one. 
                if(prcTLOTaskFExecuted == true){
                    prcTLOdidLowerPathReachOuterConvOr = false;
                }
                if(prcTLOOuterConvORLowerSeqExecuted == true){
                    prcTLOdidLowerPathReachOuterConvOr = true;
                }
                markCleanObject(nextObject.id, 'highlight');
                loopCount++;
                markObject(nextObject.id, 'highlight-light');
                isJustFollowNext=false;
                nodetobeClicked.push(nextObject.id);
            }
        }
        //for Exp2 PrcX-Similar. When it comes to small converging OR, behave exactly like XOR
        else if(nextObject.id.indexOf('sid-CE9387DC-4E4B-4A7E-802A-C6501A5FAE0B') != -1 && processName.indexOf('ProcessX-Similar') != -1){
            markCleanObject(nextObject.id, 'highlight');
            markObjectAndSeqFlow(nextObject.id, 'highlight', 'lime');
            isCurObjInSelectedLane = false;
            var seqFlow = nextObject.get('outgoing');
            findNextObject(seqFlow[0]);
            //this is all the same as whan an XOR does. Then, we return so that AND behavior is not performed. 
            return;
        }
        //for Exp2 PrcRM. Before N, we will check the number of visits to upper and lower seq flows. 
        else if(nextObject.id.indexOf('sid-59C381B7-D2E1-4DE2-8332-7EA882CF7311') != -1 && processName.indexOf('ReworkMismatch') != -1){
            //if we have reached the correct AND, let's see the seq flows
            var isFlowAfterANDEnabledprcRM = false;
            if(numofPrcRMLowerANDNEnabled >0 && numofPrcRMUpperANDNEnabled >0){
                //the flow can continue to next.
                markCleanObject(nextObject.id, 'highlight');
                loopCount++;
                markObject(nextObject.id, 'highlight');
                isFlowAfterANDEnabledprcRM = true;
                numofPrcRMLowerANDNEnabled--;
                numofPrcRMUpperANDNEnabled--;
                numofPrcRMANDNEnabled++; 
                //numofPrcRMTaskKEnabled++;
            }
            //Before we continue, mark the seq flow with missing exec 
            var upperSeqFlowID = 'sid-A2A96D21-BF89-4684-91DA-91BA05C97D5C';
            var lowerSeqFlowID = 'sid-0BDCEA15-EF07-4776-8A70-65065F52D118';
            if((numofPrcRMLowerANDNEnabled > numofPrcRMUpperANDNEnabled) && numofPrcRMANDNEnabled > 0){
                markSeqFlowwithGivenId(upperSeqFlowID, 'black');
            }else if((numofPrcRMUpperANDNEnabled > numofPrcRMLowerANDNEnabled) && numofPrcRMANDNEnabled > 0){
                markSeqFlowwithGivenId(lowerSeqFlowID, 'black');
            }//if they are both 0, don't do anything. 
            
            //continue with routine flow to the next item
            if(isFlowAfterANDEnabledprcRM == true){
                var seqFlow = nextObject.get('outgoing');
                var pathNum = seqFlow.length;
                for(var i=0; i<pathNum;i++){
                    if(isRoleBasedAnimSelected == false || isCurObjInSelectedLane == true){
                        loopCount++;
                        markSeqFlowwithGivenId(seqFlow[i].id, 'lime');
                    }
                    findNextObject(seqFlow[i]);
                }
            }
            return; //return so that regular stuff is not executed specific to this AND.
        }
        //for Exp2 PrcRM. When it comes to converging OR, wait for L or M. 
        else if(nextObject.id.indexOf('sid-B81EBBF3-9866-4EC9-9B02-B3555F51CC6F') != -1 && processName.indexOf('ReworkMismatch') != -1){
            if(prcRMTaskLExecuted == true && prcRMTaskMExecuted == true){
                //we want it to continue like regular conv AND. Do nothing special, just continue. Only remove from the node to be clicked so that it can continue. 
                for(var n=0; n<nodetobeClicked.length;n++){
                    if(nodetobeClicked[n].indexOf(nextObject.id) != -1){ 
                        nodetobeClicked.splice(n, 1);
                    }
                }
                isJustFollowNext=false;
                prcRMTaskLExecuted = false;
                prcRMTaskMExecuted = false;
            }else{
                markCleanObject(nextObject.id, 'highlight');
                loopCount++;
                markObject(nextObject.id, 'highlight-light');
                isJustFollowNext=true;
                nodetobeClicked.push(nextObject.id);
            }
        }
        //for Exp2 Prc Rigid3. When it comes to converging OR, behave exactly like XOR
        else if(nextObject.id.indexOf('sid-D228B2B1-440C-4808-9CE0-54DE3F22F92E') != -1 && processName.indexOf('Rigid3') != -1){
            markCleanObject(nextObject.id, 'highlight');
            markObjectAndSeqFlow(nextObject.id, 'highlight', 'lime');
            isCurObjInSelectedLane = false;
            var seqFlow = nextObject.get('outgoing');
            findNextObject(seqFlow[0]);
            //this is all the same as whan an XOR does. Then, we return so that AND behavior is not performed. 
            return;
        }
        ////////End of Exp2 specific part
        }//end of appType=Exp2 check. 

        //check if role based anim is selected and if the object is in the selected lane
        isCurObjInSelectedLane = false;
        if(lanes.length >0){
            var curLaneId = nextObject.lanes[0].id;
        }
        if(isRoleBasedAnimSelected == true && roleIdtobeAnimated.indexOf(curLaneId) != -1){
            isCurObjInSelectedLane = true;
        }
        
        //Before we continue with this converging, we should make sure that flow has come from all paths. 
        for(var i=0; i<andGatewaysMerged.length;i++){
            //let's find seq flow to parse and mark it
            if(andGatewaysMerged[i].convAnd== nextObject.id && andGatewaysMerged[i].incSeqFlowId== seqFlowToParse.id){
               //we found the right path, let's mark it. 
                andGatewaysMerged[i].didFlowMerge = true;
               }
        }
		if(appType.indexOf('Exp2') != -1){
	        //specific to Exp2 Process Rigid1. Manually set converging AND connections so that they are not reset at Diverging ANDs (because it is rigid)
	        if(seqFlowToParse.id.indexOf('sid-7FF192BC-979D-43D7-8908-92FD18A2C91C') != -1){
	            prcR1LowerConvANDLeftPathPassed = true;
	        }else if(seqFlowToParse.id.indexOf('sid-16CD2757-3CAC-4E22-8817-3BC8D17E7972') != -1){
	            prcR1LowerConvANDUpPathPassed = true;
	        }else if(seqFlowToParse.id.indexOf('sid-5F0FB445-C145-4BD6-842C-D3D0BAB05172') != -1){
	            prcR1UpperConvANDLeftPathPassed = true;
	        }else if(seqFlowToParse.id.indexOf('sid-57E90426-C41D-47ED-8E37-325C5F18D03E') != -1){
	            prcR1UpperConvANDUpPathPassed = true;
	        }
		}//end of appType=Exp2 check. 
        //------------
        
        //again, we will look at all andGatewayMerged array and check if all are marked. 
        var didAllIncomingPathsPassed=true;
        for(var j=0; j<andGatewaysMerged.length;j++){
            if(andGatewaysMerged[j].convAnd == nextObject.id){
                if(andGatewaysMerged[j].didFlowMerge == false){

                    didAllIncomingPathsPassed = false;//no, not all is finished, we cannot continue. 
                }
            }
        }
		if(appType.indexOf('Exp2') != -1){
	        //Specific to Exp2. We check for two Conv ANDs after the rigid structure manually and set the parameter manually
	        if(nextObject.id.indexOf('sid-12E98634-DE72-4316-985B-46348CFF56AB') != -1 && prcR1LowerConvANDLeftPathPassed == true && prcR1LowerConvANDUpPathPassed == true){
	            didAllIncomingPathsPassed = true;
	        }else if(nextObject.id.indexOf('sid-B9874E20-F6E2-4772-B35C-59992AC58E76') != -1 && prcR1UpperConvANDLeftPathPassed == true && prcR1UpperConvANDUpPathPassed == true){
	            didAllIncomingPathsPassed = true;
	        }
        
	        console.log('can we find the correct flow in OR?' + didAllIncomingPathsPassed);
		}//end of appType=Exp2 check
        if(didAllIncomingPathsPassed == true){
            if(isRoleBasedAnimSelected == false || isCurObjInSelectedLane == true){
                markCleanObject(nextObject.id, 'highlight');
                markCleanObject(nextObject.id, 'highlight-light');
                loopCount++;
                markObject(nextObject.id, 'highlight');
            }
            var seqFlow = nextObject.get('outgoing');
            var pathNum = seqFlow.length;
            for(var i=0; i<pathNum;i++){
                if(isRoleBasedAnimSelected == false || isCurObjInSelectedLane == true){
                    loopCount++;
                    markSeqFlowwithGivenId(seqFlow[i].id, 'lime');
                }
                findNextObject(seqFlow[i]);
            }
        }
        isCurObjInSelectedLane = false;
    }
    else if((nextObjectType.indexOf('ParallelGateway') !=-1 || nextObjectType.indexOf('InclusiveGateway') !=-1)
            && nextObject.gatewayDirection == "Diverging"){
        
        //check if role based anim is selected and if the object is in the selected lane
        isCurObjInSelectedLane = false;
        if(lanes.length >0){
            var curLaneId = nextObject.lanes[0].id;
        }
        if(isRoleBasedAnimSelected == true && roleIdtobeAnimated.indexOf(curLaneId) != -1){
            isCurObjInSelectedLane = true;
        }
        
        //Before we continue the parallel path, we need to reset this fragment's marking information. 
        //Normally, this is not needed, but if the user selected Rework from an XOR option, this part
        //is required to reset and "repaint" the elements. 
        var convAndId = findConvAndofGivenDivAnd(nextObject.id);//buna karsilik gelen converging ne
        //for this converging, we will reset all andGatewaysMerged information (for all seq flows)
        for(var m=0; m < andGatewaysMerged.length; m++){
            if(andGatewaysMerged[m].convAnd.indexOf(convAndId) != -1){
                andGatewaysMerged[m].didFlowMerge = false;
            }
        }
        if(isRoleBasedAnimSelected == false || isCurObjInSelectedLane == true){
            markCleanObject(nextObject.id, 'highlight');
            loopCount++;
            markObject(nextObject.id, 'highlight');
        }
        var seqFlow = nextObject.get('outgoing');
        var pathNum = seqFlow.length;
        if(isRoleBasedAnimSelected == false || isCurObjInSelectedLane == true){
            for(var i=0; i<pathNum;i++){
                markSeqFlowwithGivenId(seqFlow[i].id, 'Lime');
                //we want to paint parallel paths concurrently so that the user understands paralellism
                //we will find the next object and follow in the next loop
                //Open the following line if you want to paint the first elements instantly. 
                //markObject(seqFlow[i].targetRef.id, 'highlight');
            }
        }
        isCurObjInSelectedLane = false;
        for(var k=0; k<pathNum;k++){
            findNextObject(seqFlow[k]);
        }
        //loopCount++;
    }
}
//----------------------------------------------------------------------------

//Paint the given object and the seq flow following it------------------------
//----------------------------------------------------------------------------
function markObjectAndSeqFlow(actID, colorO, colorS){
    loopCount++;
    var loopF = timerCoef*(loopCount+1);
    doSetTimeoutObj(actID, loopF, colorO);
    var currShape = elementRegistry.get(actID);
    var currShapeType = currShape.type;//bpmn:StartEvent
    var currObject = currShape.businessObject;//Base 
    var seqFlow = currObject.get('outgoing');
    if(seqFlow[0] !== undefined){
        loopCount++;
        loopF = timerCoef*(loopCount+1);
        doSetTimeoutFlow(seqFlow[0], loopF, colorS);
    }
}
//--------------------------------------------------------------------------

//Paint only the given object-----------------------------------------------
function markObject(objID, color){
    var loopF = timerCoef*(loopCount+1);
    doSetTimeoutObj(objID, loopF, color);
}
//--------------------------------------------------------------------------

//Clean the marking of the given object-------------------------------------
//--------------------------------------------------------------------------
function markCleanObject(objID, color){
    var loopF = timerCoef*(loopCount+1);
    doSetTimeoutCleanObj(objID, loopF, color);
}
//--------------------------------------------------------------------------

//Paint the sequence flow given with the object id and its order------------
//--------------------------------------------------------------------------
function markSeqFlow(objID, seqFlowOrder, color){
    var loopF = timerCoef*(loopCount+1);
    var currShape = elementRegistry.get(objID);
    var currShapeType = currShape.type;//bpmn:StartEvent
    var currObject = currShape.businessObject;//Base 
    var seqFlow = currObject.get('outgoing');
    if(seqFlow[seqFlowOrder] !== undefined){
        loopF = timerCoef*(loopCount+1);
        doSetTimeoutFlow(seqFlow[seqFlowOrder], loopF, color);
    }
}
//--------------------------------------------------------------------------

//Paint the sequence flow with the given id---------------------------------
//--------------------------------------------------------------------------
function markSeqFlowwithGivenId(seqID, color){
    var loopF = timerCoef*(loopCount+1);
    var currSeq = elementRegistry.get(seqID);
    var currObject = currSeq.businessObject;//Base 
    doSetTimeoutFlow(currObject, loopF, color);
}
//--------------------------------------------------------------------------

//Get the seq flow id of the given object and the order---------------------
//--------------------------------------------------------------------------
function getSeqFlowId(objID, seqFlowOrder){
    var currShape = elementRegistry.get(objID);
    var currShapeType = currShape.type;//bpmn:StartEvent
    var currObject = currShape.businessObject;//Base 
    var seqFlow = currObject.get('outgoing');
    if(seqFlow[seqFlowOrder] !== undefined){
        return seqFlow[seqFlowOrder].id;
    }
}
//--------------------------------------------------------------------------

//Check if the expected sequence flow is clicked-----------------------------
//--------------------------------------------------------------------------
function checkSelectedSeq(){
    /*if(isPathSelectionPointArrived == true){
        //there is a new click and a new control point, check if the correct place is clicked
        for(var k=0;k<seqFlowstobeClicked.length;k++){
            if(selectedElementId == seqFlowstobeClicked[k]){
                selectedElementId = seqFlowstobeClicked[k];
                isPathSelected = true;
                selectedSeqFlowPathNum = k;
            }
        }
        if(isPathSelected == true){
            markSeqFlowwithGivenId(selectedElementId);
        }
    }*/
    //markSeqFlowwithGivenId(selectedElementId);
    var outgoingGfx = viewer.get('elementRegistry').getGraphics(selectedElementId);
    //Farida: modify outGoingGfx
    //outgoingGfx.select('path').attr({stroke: 'lime'});
    var outGoingPath = outgoingGfx.getElementsByTagName('path')[0];
    outGoingPath.style.stroke = 'lime';
}
//--------------------------------------------------------------------------

//Parse all objects and make an array of matching gateway couples-----------
//For the moment just works for AND gateways--------------------------------
//--------------------------------------------------------------------------
function findGatewayCouples(seqFlowToParse){
    var nextObject = seqFlowToParse.targetRef;
    var nextObjectType = nextObject.$type;
    
    for(var k = 0; k <allObjects.length; k++){
        if(allObjects[k].id == nextObject.id && allObjects[k].isPassed == true){ 
            return;
        }
    }
    allObjects.push({
    id: nextObject.id,
    isPassed: true
    });
    
    if(nextObjectType.indexOf('endEvent') != -1){
        return;
    }
    if((nextObjectType.indexOf('ParallelGateway') !=-1  || nextObjectType.indexOf('InclusiveGateway') !=-1)
            && (nextObject.gatewayDirection == "Diverging")){
        gatewayCombination.push({
            divGatewayID: nextObject.id,
            convGatewayID: 0
        });
        var seqFlow = nextObject.get('outgoing');
        for(var j = 0; j < seqFlow.length; j++){
            findGatewayCouples(seqFlow[j]);
        }
        
    }else if((nextObjectType.indexOf('ParallelGateway') !=-1  || nextObjectType.indexOf('InclusiveGateway') !=-1)
            && (nextObject.gatewayDirection == "Converging")){
        //gatewayi sondan donup en son convergenti bos olana ata
        for(var i = gatewayCombination.length - 1; i >= 0; i--){
            if(gatewayCombination[i].convGatewayID == 0){
                gatewayCombination[i].convGatewayID = nextObject.id;
            }
        }
        var seqFlow = nextObject.get('outgoing');
        findGatewayCouples(seqFlow[0]);
    }else{
        var seqFlow = nextObject.get('outgoing');
        for(var j = 0; j < seqFlow.length; j++){
            findGatewayCouples(seqFlow[j]);
        }
    }
}
//--------------------------------------------------------------------------

//Get the converging and of a given diverging gateway-----------------------
//--------------------------------------------------------------------------
function findConvAndofGivenDivAnd(divAndID){
    //bir diverginge geldigimizde onun bagli oldugu convergingi don
    for(var i = 0; i < gatewayCombination.length; i++){
        if(gatewayCombination[i].divGatewayID == divAndID){
            return gatewayCombination[i].convGatewayID;
        }
    }
}
//--------------------------------------------------------------------------

//Add timer to check how long the user checks the model---------
//--------------------------------------------------------------
var inSeconds; 
$(function() {
        var cd = $('#timer');
        var a = (cd.text()).split(':');
        inSeconds = a[0]*60 + a[1]*1;
        var interv = setInterval(function() {
            inSeconds ++;
            var minute = Math.floor((inSeconds) / 60);
            var seconds = inSeconds - (minute * 60);
            if(seconds < 10){
                seconds = '0'+seconds;
            }
            var c = minute + ':' + seconds;
            cd.html(c);
            if (inSeconds == 0) {
                //window.location.reload(false);
                clearInterval(interv);
            }
        }, 1000);
    });

//--- Cek apakah page dibuka dr halaman questions atau dr halaman obseravsi model

function getQueryVariable(variable)
{
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
            var pair = vars[i].split("=");
            if(pair[0] == variable){return pair[1];}
    }
    return(false);
}

function checkSource()
{
    var source = getQueryVariable("s");
    if(source.indexOf('q1') != -1)
    {
        $('#finishAnim').hide();
        $('#footer').hide();
        $("#direction1").hide();
        $("#direction2").hide();
        $('#countdown').hide();
    }
}
//-----------------------------------------------------------------------

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
        //Farida: cek apakah page dibuka dr halaman questions atau dr halaman observsi model
        checkSource();
        //-----------
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


//------------------------------------------------
// select text from json object based on selected item
//-----------------------------------------------
function getNarrationText(element)
{
    var narrItem = $(narrationObj).filter(function (i,n){return n.sid===element.id});
    if(narrItem.length > 0){
     if(narrItem[0].nar_text != ''){
            $('#narrationLabel').html( narrItem[0].nar_text);
            if(prevClickedObj)
            {
                markCleanObject(prevClickedObj.id,'highlight');
                removeOverlay(prevClickedObj);
            }
            markObject(element.id, 'highlight');  
            setTextOverlay(element,narrItem[0].nar_text);
            prevClickedObj = element;
       }
    }
}

function setTextOverlay(element,ntext)
{
    overlays.add(element,  'badge',{
            position: {
            top:0,
            left: element.width + 20,
            },
            show: {
                minZoom: 0,
                maxZoom: 5.0
        },
        html: '<div class="callout">' + ntext + '<b class="notch"></div>'
    });
}

function removeOverlay(element)
{
    overlays.remove({ element: element });

}

var $buttonZoomIn = $('#btnZoomIn');
$buttonZoomIn.on('click', function(){
     var canvas = viewer.get('canvas');
     var currentZoom = canvas.zoom();
     var center = { x: 0, y: 0 };
     canvas.zoom(currentZoom+0.1,center);
});

var $buttonZoomOut = $('#btnZoomOut');
$buttonZoomOut.on('click', function(){
    var canvas = viewer.get('canvas');
     var currentZoom = canvas.zoom();
     var center = { x: 0, y: 0 };
     if(currentZoom>0.1)
        canvas.zoom(currentZoom-0.1,center);
});

var $buttonReset = $('#btnReset');
$buttonReset.on('click', function(){
    var canvas = viewer.get('canvas');
     canvas.zoom('fit-viewport');
     
});

