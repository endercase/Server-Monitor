#!/bin/bash

CONFIG=config.json

if ! [ -f "$CONFIG" ]; then
        echo '{ "sucess": "Error", "data": "Create first config.json file in your server" }' > data.json
        exit 0
fi

v1=$(cat $CONFIG | jq '.name')
DELEGATE_NAME="${v1//\"/}"
v1=$(cat $CONFIG | jq '.address')
DELEGATE_ADDRESS="${v1//\"/}"
PUBLICKEY="null"

jsondata=data.json

i=1
echo "{ \"success\": \"OK\", \"servers\": {" > $jsondata
jq -r '.servers|keys[]' $CONFIG | while read key ; do
    if [ "$i" -ne "1" ]; then
        echo "," >> $jsondata
    fi
    echo "\"server$i\": {" >> $jsondata
    v1=$(jq ".servers.$key.http" $CONFIG)
    HTTP="${v1//\"/}"
    v1=$(jq ".servers.$key.ip" $CONFIG)
    IP="${v1//\"/}"
    v1=$(jq ".servers.$key.port" $CONFIG)
    PORT="${v1//\"/}"

    RESPONSE=$(curl -s $HTTP://$IP:$PORT/api/loader/status/sync)
    HEIGHT=$(echo $RESPONSE | jq '.height')
    SYNCING=$(echo $RESPONSE | jq '.syncing')
    CONSENSUS=$(echo $RESPONSE | jq '.consensus')
    ROUND=$(printf %.0f $CONSENSUS)
    
    if [ "$PUBLICKEY" == "null" ]; then
        v1=$(curl -s -k $HTTP://$IP:$PORT/api/accounts/getPublicKey?address=$DELEGATE_ADDRESS | jq '.publicKey')
        PUBLICKEY="${v1//\"/}"
    fi
    
    FORGING=$(curl -s -k $HTTP://$IP:$PORT/api/delegates/forging/status?publicKey=$PUBLICKEY | jq '.enabled')
    if [ "$FORGING" == "true" ]; then
        RESPONSE=$(curl -s -k $HTTP://$IP:$PORT/api/delegates/get?publicKey=$PUBLICKEY)
        RANK=$(echo $RESPONSE | jq '.delegate.rate')
        PRODUCTIVITY=$(echo $RESPONSE | jq '.delegate.productivity')
        PRODUCEDBLOCKS=$(echo $RESPONSE | jq '.delegate.producedblocks')
        MISSEDBLOCKS=$(echo $RESPONSE | jq '.delegate.missedblocks')
        echo "  \"rank\": \"$RANK\"," > tmp.file
        echo "  \"productivity\": \"$PRODUCTIVITY\"," >> tmp.file
        echo "  \"producedblocks\": \"$PRODUCEDBLOCKS\"," >> tmp.file
        echo "  \"missedblocks\": \"$MISSEDBLOCKS\"," >> tmp.file
      
        RESPONSE=$(curl -s $HTTP://$IP:$PORT/api/delegates/getNextForgers?limit=101 | jq '.delegates')
        n="0"
        while [ "$n" -lt "101" ]; do
           v1=$(echo $RESPONSE | jq '.['$n']')
           PK="${v1//\"/}"
           if [ "$PK" == "$PUBLICKEY" ]; then
                NEXTTURN=$(( $n * 10 ))
                break
           fi
           ((n+=1))
        done
        echo "  \"nextturn\": \"$NEXTTURN\"" >> tmp.file
    fi
    
    if [ -z "$HEIGHT" ]; then
        HEIGHT="0"
    fi
    if [ -z "$SYNCING" ]; then
        SYNCING="true"
    fi
    
    echo "  \"height\": $HEIGHT", >> $jsondata
    echo "  \"syncing\": $SYNCING", >> $jsondata
    echo "  \"consensus\": $ROUND", >> $jsondata
    echo "  \"forging\": $FORGING" >> $jsondata
    echo "}" >> $jsondata
    ((i++))
done

echo "}," >> $jsondata

cat tmp.file >> $jsondata
rm tmp.file

echo "}" >> $jsondata
