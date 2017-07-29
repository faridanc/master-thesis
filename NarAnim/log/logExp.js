function getNow() 
{
	var currentdate = new Date(); 
	var datetime = currentdate.getDate() + "/"
                + (currentdate.getMonth()+1)  + "/" 
                + currentdate.getFullYear() + " @ "  
                + currentdate.getHours() + ":"  
                + currentdate.getMinutes() + ":" 
                + currentdate.getSeconds() + ":"
				+ currentdate.getMilliseconds();
				return datetime;
}

function logExp(text, pid)
{
	var filename = pid + ".txt";
	var timestamp = getNow();
	var fd = new FormData();
	fd.append('data', text);
	fd.append('logfile', filename);
	fd.append('tstamp', timestamp);
	
	var xhrForm = new XMLHttpRequest();

	var path = "http://prime.cs.vu.nl/primexp/NarAnim/log/log.php";
	
	xhrForm.open("POST", path);

	xhrForm.send(fd); 

	if(text.indexOf('ClickNode') == -1)
	     localStorage["primeCache"] = localStorage["primeCache"] +  pid + ' - ' + timestamp + ' - ' + text + '\n';
	//alert('done');
	//console.log(text);
}

