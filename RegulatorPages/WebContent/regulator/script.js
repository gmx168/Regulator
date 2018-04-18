

function onLoad(cmd) {
  var xhr = new XMLHttpRequest();
  xhr.onerror = function(e) {
    alert(xhr.status + " " + xhr.statusText);
  }
  xhr.onload = function(e) {
    if (cmd == "events") {
      showEvents(xhr.responseText);
    } else if (cmd == "alarm") {
      showAlarm(xhr.responseText);
      //{"a":2,"t":1501962011,"v1":262,"v2":200,"c":1}
    } else {
      showValues(xhr.responseText);
    }
  };
  var host = location.hostname;
  if (host == "") {
    host = "192.168.1.6";
  }
  xhr.open("GET", "http://" + host + ":81/" + cmd +".json", true);
  xhr.send();
}

var valueLabels = {"mr" : "Manual run", "st" : "State", "r" : "Relays", "h" : "Heating", "m" : "Meter", "b" : "Battery", "a" : "Available", "i" : "Inverter", "soc" : "SoC", "ec" : "Events", "ts" : "Temp.sens.", "v" : "Version"};
var stateLabels = {"N" : "rest", "M" : "monitoring", "R" : "regulating", "O" : "OVERHEAT", "H" : "manual run", "A" : "ALARM"};
var alarmLabels = {"-" : "No alarm", "W" : "WiFi", "P" : "Pump", "M" : "MODBUS"};

function showValues(jsonData) {
  var data = JSON.parse(jsonData);
  var contentDiv = document.getElementById("contentDiv");
  for (var key in valueLabels) {
    var val = data[key];
    if (val == null)
      continue;
    var unit = "";
    if (key == "r" || key == "ec"  || key == "ts" || key == "v") {
    } else if (key == "st") {
      val = stateLabels[val];
    } else if (key == "soc") {
      unit = "%";
    } else if (key == "mr") {
      unit = " min.";
    } else {
      unit = " W";
    }
    var boxDiv = document.createElement("DIV");
    if (key == "ec" || (key == "st" && val == "ALARM")) {
      boxDiv.className = "value-box value-box-clickable";
    } else {
      boxDiv.className = "value-box";
    }
    boxDiv.appendChild(createTextDiv("value-label", valueLabels[key]));
    boxDiv.appendChild(createTextDiv("value-value", val + unit));
    if (key == 'ec') {
      boxDiv.onclick = function() {
        location = "events.html";
      }
    } else if (key == "st" && val == "ALARM") {
      boxDiv.onclick = function() {
        location = "alarm.html";
      }
    }
    contentDiv.appendChild(boxDiv);
  }
  var state = data["st"];
  if (state != "A") {
    if (state != "H") {
      contentDiv.appendChild(createCommandBox("Manual run", "Start", "manualRun"));
    } else {
      contentDiv.insertBefore(createCommandBox("Manual run", "Stop", "manualRunStop"), contentDiv.firstElementChild);
    }
  }
  var s = data["r"];
  if (s.charAt(0) == "0" && s.charAt(6) == "0") {
    contentDiv.appendChild(createCommandBox("Valves", "Back", "valvesBack"));
  }
}

var eventHeaders = ["event", "timestamp", "value 1", "value 2", "count"];
var eventLabels = ["EEPROM", "Restart", "Watchdog", "Wifi NC", "Pump problem", "MODBUS error", "Overheat", "Balboa pause", "Manual run", "Valves back", "Suspend calibration"];

function showEvents(jsonData) {
  var data = JSON.parse(jsonData);
  var contentDiv = document.getElementById("contentDiv");
  var eventsHeaderDiv = document.createElement("DIV");
  eventsHeaderDiv.className = "table-header";
  for (var i in eventHeaders) {
    eventsHeaderDiv.appendChild(createTextDiv("table-header-cell", eventHeaders[i]));
  }
  contentDiv.appendChild(eventsHeaderDiv);
  var events = data.e;
  for (var i = 0; i < events.length; i++) {
    var event = events[i];
    var tmpstmp = "";
    if (event.t != 0) {
      tmpstmp = t2s(event.t);
    }
    var v1 = "";
    if (event.v1 != 0) {
      v1 = "" + event.v1;
    }
    var v2 = "";
    if (event.v2 != 0) {
      v2 = event.v2;
    }
    var eventDiv = document.createElement("DIV");
    eventDiv.className = "table-row";
    eventDiv.appendChild(createTextDiv("table-cell", eventLabels[event.i]));
    eventDiv.appendChild(createTextDiv("table-cell", tmpstmp));
    eventDiv.appendChild(createTextDiv("table-cell table-cell-number", v1));
    eventDiv.appendChild(createTextDiv("table-cell table-cell-number", v2));
    eventDiv.appendChild(createTextDiv("table-cell table-cell-number", "" + event.c));
    contentDiv.appendChild(eventDiv);
  }
  if (data["s"] == 0) {
    contentDiv.appendChild(createButton("Save", "saveEvents"));
  }
}

function showAlarm(jsonData) {
  var data = JSON.parse(jsonData);
  var contentDiv = document.getElementById("contentDiv");
  var label = alarmLabels[data.a];
  contentDiv.appendChild(createTextDiv("message-label", label));
  if (data.a == 0) 
    return;
  contentDiv.appendChild(createTextDiv("message-timestamp", t2s(data.e.t)));
  if (label == "Pump") {
    contentDiv.appendChild(createTextDiv("message-text", "Current sensor value is " + data.e.v1 + ". Expected value is " + data.e.v2 + "."));
    contentDiv.appendChild(createButton("Reset", "pumpAlarmReset"));
  }
}

function createTextDiv(className, value) {
  var div = document.createElement("DIV");
  div.className = className;
  div.appendChild(document.createTextNode("" + value));
  return div;
}

function createButton(text, command) {
  var button = document.createElement("BUTTON");
  button.className = "button";
  button.onclick = function() {
    if (!confirm("Are you sure?"))
      return;
    var xhr = new XMLHttpRequest();
    xhr.onerror = function(e) {
      alert(xhr.status + " " + xhr.statusText);
    }
    xhr.onload = function(e) {
      location.reload();
    };
    var host = location.hostname;
    if (host == "") {
      host = "192.168.1.6";
    }
    xhr.open("GET", "http://" + host + ":81/" + command, true);
    xhr.send();
  }
  button.appendChild(document.createTextNode(text));
  return button;
}

function createCommandBox(title, label, command) {
  var boxDiv = document.createElement("DIV");
  boxDiv.className = "value-box";
  boxDiv.appendChild(createTextDiv("value-label", title));
  var div = document.createElement("DIV");
  div.className = "value-value";
  div.appendChild(createButton(label, command));
  boxDiv.appendChild(div);
  return boxDiv;
}

function t2s(t) {
  var date = new Date(t * 1000);
  var tmpstmp = date.toISOString();
  return tmpstmp.substring(0, tmpstmp.indexOf('.')).replace('T', ' ');
}
