'use strict';

const AWS = require('aws-sdk');
const qs = require('querystring');

const doc = require('dynamodb-doc');
const db = new doc.DynamoDB();
const dbdoc = new AWS.DynamoDB.DocumentClient();
const SNS = new AWS.SNS({ apiVersion: '2010-03-31' });

const kmsEncryptedToken = '<kmsEncryptedToken>';
let token;


function processEvent(event, callback) {
    const params = qs.parse(event.body);
    const requestToken = params.token;
    if (requestToken !== token) {
        console.log(`Request token (${requestToken}) does not match expected`);
        return callback('Invalid request token ' + JSON.stringify(params));
    }

    const user = params.user_name;
    const command = params.command;
    const channel = params.channel_id;
    const commandText = params.text;

    const tableName = "defcon";

    switch (commandText) {
    case "name":
        getName(channel, callback);
        break;
    case "level":
        getLevel(channel, callback);
        break;
     case 'instantdeath':
        getRoomInfo(channel, function(err, data) {
            if (!err && !isEmpty(data)) {
                    var message = ":sob: Defcon raised to level INSTANT DEATH in room " + data.name;
                    updateRoomStatus(1, data.room_id, tableName, message, callback);
            }
        });        
        
        break;
       
    case 'raise':
        //newLevel, room_id, tableName, message
        console.log('Before getRoomInfo:');
        getRoomInfo(channel, function(err, data) {
            console.log('got Room Info:', JSON.stringify(data, null, 2));
            console.log('raise_defcon:', JSON.stringify(data, null, 2));
            if (!err && !isEmpty(data)) {
                
                var new_level = data.current_level;
                new_level = (new_level > 1)? new_level - 1 : new_level;
                    var message = "Defcon raised to level " + new_level + " in room " + data.name;
                    updateRoomStatus(new_level, data.room_id, tableName, message, callback);
            }
        });
        break;
        
    case 'lower':
        getRoomInfo(channel, function(err, data) {
            if (!err && !isEmpty(data)) {
                var new_level = data.current_level;
                new_level = (new_level < 5)? new_level + 1 : new_level;
                    var message = "Defcon lowered to level " + new_level + " in room " + data.name;
                    updateRoomStatus(new_level, data.room_id, tableName, message, callback);
            }
        });            
            
    break;               
   default:
        callback(null, `${user} invoked ${command} in ${channel} with the following text: ${commandText}`);
    }
}

 function isEmpty(obj) {
  return !Object.keys(obj).length > 0;
}

 function getRoomInfo(channel_id, callback){
    var params = {
        TableName: "defcon",
        ProjectionExpression: "room_id, current_level, #name",
        FilterExpression: "channel_id = :channel_id",
        ExpressionAttributeNames: {
            "#name": "name"
        },
        ExpressionAttributeValues: {
            ":channel_id": channel_id
        }
    };
    dbdoc.scan(params,
        function(err, data){
            if(err)
                callback(null, err.message); 
            else callback(null, {
                                    room_id: data.Items[0].room_id
                                    ,current_level:data.Items[0].current_level
                                    ,name:data.Items[0].name
                                 }
                         );
        });
 }
 
function getName(channel_id, callback){
    var params = {
        TableName: "defcon",
        ProjectionExpression: "#name",
        FilterExpression: "channel_id = :channel_id",
        ExpressionAttributeNames: {
            "#name": "name"
        },
        ExpressionAttributeValues: {
            ":channel_id": channel_id
        }
    };
    dbdoc.scan(params,function(err, data){if(err)callback(null, err.message); else callback(null, data.Items[0].name);});
 }
 
 function getLevel(channel_id, callback){
    var params = {
        TableName: "defcon",
        ProjectionExpression: "#level",
        FilterExpression: "channel_id = :channel_id",
        ExpressionAttributeNames: {
            "#level": "current_level"
        },
        ExpressionAttributeValues: {
            ":channel_id": channel_id
        }
    };
    dbdoc.scan(params,function(err, data){if(err)callback(null, err.message); else callback(null, data.Items[0].current_level);});
 }


function updateRoomStatus(newLevel, room_id, tableName, message, callback){
    
    var params = {
        TableName: tableName,
        Key:{
            "room_id": room_id
        },
        UpdateExpression: "set configuration_last_updated = :date, current_level=:current_level, level_last_updated=:date, level_last_updated_by=:update_by",
        ExpressionAttributeValues:{
            ":date":new Date().toISOString(),
            ":current_level":newLevel,
            ":update_by":"api"
        },
        ReturnValues:"ALL_NEW"
    };
    
    dbdoc.update(params, function(err, data){
        console.log('updateRoomStatus result:', JSON.stringify(data, null, 2));
        if (err){
            console.log('updateRoomStatus Error:', JSON.stringify(err, null, 2));
        }
        
        SNS.publish({
            Message: message,
            Subject: "Defcon Changed",
            TopicArn: "arn:aws:sns:us-west-2:867486598692:defcon_updated",
        }, function (snsErr, data2){ 
            if (snsErr){
                console.log('Update SNS Error:', JSON.stringify(snsErr, null, 2));
            }
            callback(err, `defcon has been updated!`);
        });
    });
 }
 
exports.handler = (event, context, callback) => {
    
    console.log('Received event:', JSON.stringify(event, null, 2));
    console.log('Received context:', JSON.stringify(context, null, 2));    
    
    const done = (err, res) => callback(null, {
        statusCode: err ? '400' : '200',
        body: err ? (err.message || err) : JSON.stringify({text:res}),
        headers: {
            'Content-Type': 'application/json',
        },
    });

    token = '04z9aWOK9UJR0jHFI0WLyMPx';
    if (token) {
        // Container reuse, simply process the event with the key in memory
        processEvent(event, done);
    } else if (kmsEncryptedToken && kmsEncryptedToken !== '<kmsEncryptedToken>') {
        const cipherText = { CiphertextBlob: new Buffer(kmsEncryptedToken, 'base64') };
        const kms = new AWS.KMS();
        kms.decrypt(cipherText, (err, data) => {
            if (err) {
                console.log('Decrypt error:', err);
                return done(err);
            }
            token = data.Plaintext.toString('ascii');
            processEvent(event, done);
        });
    } else {
        done('Token has not been set.');
    }
};
