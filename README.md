# Server-Monitor
Tool to watch your servers status. Height, Consensus and Forging status.

<br>
#Requisites
    - You need to have Lisk installed.
    - Install this script only in one server and make sure you whitelist this server's IP in all servers.
    - You need to have [fs, http, node-cmd, path] installed in npm, for example: npm install node-cmd

#Installation
You need to edit config.json file with all your proper data. The structure is as follows:
```
{
  "name": "mrgr",
  "address": "3125853987625788223L",
  "serverip": "123.123.123.123",
  "serverport": "8001",
  "servers": {
    "server1": {
      "name": "MainServer",
      "http": "http",
      "ip": "123.123.123.123",
      "port": "8000"
    },
    "server2": {
      "name": "Backup1",
      "http": "http",
      "ip": "124.124.124.124",
      "port": "8000"
    },
    "server3": {
      "name": "Backup2",
      "http": "http",
      "ip": "125.125.125.125",
      "port": "8000"
    }
  }
}
```
All data fields are obligatory.<br>
<b>name</b>: It is the name of your delegate.<br>
<b>address</b>: It is the address of your delegate.<br>
<b>serverip</b>: It is the IP of the server where you are installing this software.<br>
<b>serverport</b>: It is the port of your server for which it will be serving the information. Must be different from the ports that Lisk uses.<br>
<b>servers</b>: Is an array of all the servers you will monitor. Make sure you insert the right format. You can add as many servers as you want, but make sure you use the correct sequence always start with "server1" following "server2" and so on.<br><br>

After you finish and save your changes from config.json, run in a background process (you can use screen): `node webserver.js`<br>
<i>node webserver.js</i> will start a web server which you can access with http://serverip:serverport/ from a web browser like Chrome.<br>
If you access from a device that you have in your servers whitelist, you will be able to obtain almost realtime data.<br>
If you access from a device that is no in your servers whitelist, you will obtain the data with a delay of 20 seconds maximum.<br><br>

Optimum method of use. If you are in your office or home computer whitelist that IP's and open chrome on your server's address, you will not need to check everytime how your servers are performing, chrome will alert you if none of your servers are forging. When the page load is complete you will recieve a first alert to test and for you to see how it works.
