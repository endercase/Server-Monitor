var forger_http = "";
var forger_ip = "";
var forger_port= "";
var g_publicKey = "";
var g_setup = "";
var g_loader = 0;
var g_forging = false;
var g_notforging = 0;
var g_totalservers = 0;
var g_checkheight = 0;
var g_topheight = 0;
var g_source = "api";

$(document).ready(function() {		
	$("#container").hide();
	$("#loading").show();
    initialize();
});    

function initialize() {
    $.getJSON("config.json", function(json){
        g_setup = json;

        forger_http = g_setup.servers.server1.http;
        forger_ip = g_setup.servers.server1.ip;
        forger_port = g_setup.servers.server1.port;

        $("#loadingData").text("Loading config..");
        var i=1;
        for (var ss in g_setup.servers) {
            var table_row="<tr>"+
                            "<td id='server"+i+"'>"+ g_setup.servers[ss].name +"</td>"+
                            "<td id='server"+i+"_height'>Height</td>"+
                            "<td id='server"+i+"_consensus'>Consensus</td>"+
                            "<td id='server"+i+"_forging'>&nbsp;&nbsp;</td>"+
                           "</tr>";
            $("#nodeTable").append(table_row);
            i++;
        }
        $("#loadingData").text("Table loaded..");
        start();
    });
}

function start(){
    $("#loadingData").text("Loading publicKey..");
    $.ajax({ 
        type: 'GET', 
        url: forger_http +'://'+ forger_ip +':'+ forger_port +'/api/accounts/getPublicKey', 
        data: { address: g_setup.address },
        dataType: 'json',
        success: function (data) {
            if(data.success){
               g_publicKey = data.publicKey;
               $("#loadingData").text("Loading servers data..");
               setInterval(monitor_process, 10000);
               setInterval(get_delegate_data, 10000);
            }else{
               alert("Error, can't retrieve data");
            }
        },
        error: function (request, status, error) {
            if(request.responseText == "Forbidden"){
                $("#loadingData").text("This ip don't have access to APIs.. trying alternative source..");
                g_source = "json";
                setInterval(monitor_process, 10000);
            }else{$("#loadingData").text(request.responseText);}
        }
    });
}

function display_data(){
    $("#container").delay(700).fadeIn(500);
    $("#loading").delay(200).fadeOut(500);
    g_loader = 1;
    notifyMe("Monitor ready!");
}

function monitor_process(){
    if(g_source == "api"){
        var i=1;
        for (var ss in g_setup.servers) {
          $("#server"+i).text(g_setup.servers[ss].name);
          get_server_data(i,g_setup.servers[ss].http,g_setup.servers[ss].ip,g_setup.servers[ss].port);
          get_forging_status(i,g_setup.servers[ss].http,g_setup.servers[ss].ip,g_setup.servers[ss].port);
          i++;
        }
        get_nextturn();
    }else{
        $("#dataMessages").delay(700).fadeIn(500);
        get_data_from_json();
    }
    are_you_forging(); //are you forging?
    g_forging=false;
}

function get_data_from_json(){
    return $.ajax({
      type: 'GET', 
      dataType: "json",
      url: '/data.json',
      async: false,
      success: function (json) {
        if(json.success){
            if(g_loader == 0) display_data();
            var i=1;
            for (var ss in json.servers) {
                if(json.servers[ss].syncing){
                    $("#server"+i+"_height").html(json.servers[ss].height + " <span><img src='resources/syncing.gif'></span>");
                }else{$("#server"+i+"_height").html(json.servers[ss].height);}
                $("#server"+i+"_consensus").text(json.servers[ss].consensus+"% ");
                if(json.servers[ss].forging){
                    $("#server"+i+"_forging").text("true");
                    g_forging=true;
                }else{$("#server"+i+"_forging").text("");}
                i++;
            }

            $("#rank").text(json.rank);
            $("#productivity").text(json.productivity);
            $("#producedBlocks").text(json.producedblocks);
            $("#missedBlocks").text(json.missedblocks);
            timeg = json.nextturn;
            time = (timeg/60);
            minutes = Math.floor(timeg / 60);
            seconds = Math.round((time - minutes) * 60);
            var v_nextturn="";
            if(minutes == 0){ v_nextturn = timeg +"sec"; }
            else{ v_nextturn = minutes + "min "+ seconds + "sec"; }
            $("#nextturn").text(v_nextturn);
        }else{
            notifyMe("Error at loading json = "+ json.data);
        }
      }
    }).responseText;
}

function get_nextturn(){
    $("#loadingData").text("Loading NextTurn..");
    return $.ajax({ 
        type: 'GET', 
        url: forger_http +'://'+ forger_ip +':'+ forger_port +'/api/delegates/getNextForgers', 
        data: { limit: "101" },
        async: false,
        dataType: 'json',
        success: function (data) {
            if(data.success){
                for (var dd in data.delegates) {
                    if(data.delegates[dd] == g_publicKey ){
                        timeg = dd * 10;
                        time = (timeg/60);
                        minutes = Math.floor(timeg / 60);
                        seconds = Math.round((time - minutes) * 60);
                        var v_nextturn="";
                        if(minutes == 0){ v_nextturn = timeg +"sec"; }
                        else{ v_nextturn = minutes + "min "+ seconds + "sec"; }
                        $("#nextturn").text(v_nextturn);
                    }
                }
            }
        },
        error: function (request, status, error) {
            if(request.responseText == "Forbidden"){
                g_source = "json";
                $("#dataMessages").text("This ip don't have access to API.. trying alternative source..");
                $("#dataMessages").delay(700).fadeIn(500);
                setTimeout($("#dataMessages").delay(500).fadeOut(500),4000);
            }else{$("#loadingData").text(request.responseText);}
        }
    }).responseText;
}

function get_delegate_data(){
    $("#loadingData").text("Loading delegate data..");
    return $.ajax({ 
        type: 'GET', 
        url: forger_http +'://'+ forger_ip +':'+ forger_port +'/api/delegates/get', 
        data: { publicKey: g_publicKey },
        dataType: 'json',
        success: function (data) { 
                $("#rank").text(data.delegate.rate);
                $("#productivity").text(data.delegate.productivity);
                $("#producedBlocks").text(data.delegate.producedblocks);
                $("#missedBlocks").text(data.delegate.missedblocks);
                if(g_loader == 0) display_data();
        }
    }).responseText;
}

function get_server_data(server,http,ip,port){
    $("#loadingData").text("Loading Server"+ server +" data..");
    return $.ajax({ 
        type: 'GET', 
        url: http + '://'+ ip +':'+ port +'/api/loader/status/sync', 
        async: false,
        dataType: 'json',
        success: function (data) { 
            if(data.syncing){
                $("#server"+server+"_height").html(data.height + " <span><img src='resources/syncing.gif'></span>");
            }else{$("#server"+server+"_height").html(data.height);}
            $("#server"+server+"_consensus").text(data.consensus+"% ");
        }
    }).responseText;
}

function get_forging_status(server,http,ip,port){
    $("#loadingData").text("Loading forging status on Server"+ server +" data..");
    //forging status
    return $.ajax({ 
        type: 'GET', 
        url: http +'://'+ ip +':'+ port +'/api/delegates/forging/status', 
        data: { publicKey: g_publicKey },
        async: false,
        dataType: 'json',
        success: function (data) { 
            if(data.enabled){
                $("#server"+server+"_forging").html("<img src='resources/icon_4.png'>");
                forger_http=http;
                forger_ip=ip;
                forger_port=port;
                g_forging=true;
            }else{  $("#server"+server+"_forging").html(""); }
        }
    }).responseText;
}

function are_you_forging(){
    if(!g_forging){
        g_notforging++;
        if(g_notforging > 3){
            notifyMe("You are not forging!!");
            $("#dataMessages").text("You are not forging!!");
            $("#dataMessages").delay(700).fadeIn(500);
            setTimeout($("#dataMessages").delay(200).fadeOut(500),4000);            
            navigator.vibrate([500, 250, 500, 250, 500, 250, 500, 250, 500, 250, 500]);
        }
    }else g_notforging=0;
}
    
// request permission on page load
document.addEventListener('DOMContentLoaded', function () {
  if (Notification.permission !== "granted")
    Notification.requestPermission();
});

function notifyMe(s_message) {
  if (!Notification) {
    alert('Desktop notifications not available in your browser. Try Chromium.'); 
    return;
  }

  if (Notification.permission !== "granted")
    Notification.requestPermission();
  else {
      var notification = new Notification(s_message, {
          icon: 'resources/icon_3.png',
          body: 'Click here to go to the monitor',
        });

    setTimeout(notification.close.bind(notification), 5000);
    notification.onclick = function () {
        window.focus();
        this.clone();
    }; 
  }
}
