'use strict';

var AWS = require("aws-sdk");
const doc = require('dynamodb-doc');
const db = new doc.DynamoDB();
const dbdoc = new AWS.DynamoDB.DocumentClient()
const SNS = new AWS.SNS({ apiVersion: '2010-03-31' });

/**

{
    "serialNumber": "G030JF059105JAGN",
    "batteryVoltage": "xxmV",
    "clickType": "SINGLE" | "DOUBLE" | "LONG"
}

 */
 
 function readItem(id, callback){
     db.query(
    { 
        TableName: "defcon"
        ,KeyConditionExpression: "room_id = :id"
        ,ExpressionAttributeValues: {":id": id}
    }, callback);
 }
 
function updateRoomStatus(params, newLevel, callback){
    
    var message = params.Message;
    var params = {
        TableName:params.TableName,
        Key:{
            "room_id": params.Item.room_id
        },
        UpdateExpression: "set configuration_last_updated = :date, current_level=:current_level, level_last_updated=:date, level_last_updated_by=:update_by",
        ExpressionAttributeValues:{
            ":date":new Date().toISOString(),
            ":current_level":newLevel,
            ":update_by":"api"
        },
        ReturnValues:"ALL_NEW"
    };
    
    
    
   var item = params.Item;
/*     
    item.configuration_last_updated = new Date().toISOString();
    item.current_level = newLevel;
    item.level_last_updated = new Date().toISOString();
    item.level_last_updated_by = "api";
*/
    dbdoc.update(params, function(err, data){
        console.log('updateRoomStatus result:', JSON.stringify(data, null, 2));
        if (err){
            console.log('updateRoomStatus Error:', JSON.stringify(err, null, 2));
        }
        //callback(err,{message:"Success", current_level: data.Attributes.current_level})
        SNS.publish({
            Message: message,
            Subject: "Defcon Changed",
            TopicArn: "arn:aws:sns:us-west-2:867486598692:defcon_updated",
        }, function (snsErr, data2){ 
            if (snsErr){
                console.log('Update SNS Error:', JSON.stringify(snsErr, null, 2));
            }
            callback(err,{message:"Success", current_level: data.Attributes.current_level});
        });
    });
 }
 
 function isEmpty(obj) {
  return !Object.keys(obj).length > 0;
}

function postChange(message, callback){
    const params = {
            Message: message,
            Subject: `Defcon Changed`,
            TopicArn: "arn:aws:sns:us-west-2:867486598692:defcon_updated",
        };
        
    SNS.publish(params, callback);
}
 
 exports.handler = function(event, context, callback) 
{
    console.log('Received event:', JSON.stringify(event, null, 2));
    console.log('Received context:', JSON.stringify(context, null, 2));
    
    //const done = (err,res) => doneHandler(err,res,callback);
    

    const done = (err, res) => callback(null, {
        statusCode: err ? '400' : '200',
        body: err ? err.message : res,
        headers: {
            'Content-Type': 'application/json',
        },
    });        
    
    
    
    var tableName = "defcon";
    
    if (!event.hasOwnProperty('operation') && event.hasOwnProperty('serialNumber')){
        // Rewrite the event
        console.log('This is a button click');
        
        var operation = 'instant_death';
        if (event.clickType == "SINGLE")
        {
            operation = "raise_defcon";
        }
        else if (event.clickType == "DOUBLE"){
            operation = "lower_defcon";
        }
        
        var event = {
            operation: operation,
            bodyjson: {
                room_id: event.serialNumber
            }
        }
        console.log('Rewrite Event:', JSON.stringify(event, null, 2));
    }
    
    
    switch (event.operation) {
        case 'DELETE':
            db.deleteItem(JSON.parse(event.body), done);
            break;
        case 'read':
            readItem(event.id, done);
            break;
        case 'readall':
            db.scan(
                { 
                    TableName: tableName
                }, done);
            break;
            
        case 'instant_death':
            var params = {
                TableName: tableName,
                Key:{
                    "room_id": event.bodyjson.room_id
                }
            }            
            
            dbdoc.get(params, function(err, data) {
                console.log('instant_death_get:', JSON.stringify(data, null, 2));
                if (!err && !isEmpty(data)) {
                    params.Item = data.Item;
                    var message = ":sob: Defcon raised to level INSTANT DEATH in room " + data.Item.name
                    params.Message = message;
                    var data = updateRoomStatus(params, 1, callback);
                } 
            });
            break;
            
        case 'raise_defcon':
            var params = {
                TableName: tableName,
                Key:{
                    "room_id": event.bodyjson.room_id
                }
            }            
            
            dbdoc.get(params, function(err, data) {
                console.log('raise_defcon:', JSON.stringify(data, null, 2));
                if (!err && !isEmpty(data)) {
                    params.Item = data.Item;
                    var new_level = data.Item.current_level;
                    new_level = (new_level > 1)? new_level - 1 : new_level;
                        var message = "Defcon raised to level " + new_level + " in room " + data.Item.name
                        params.Message = message;
                        updateRoomStatus(params, new_level, callback);
                }
            });
            break;
            
        case 'lower_defcon':
            var params = {
                TableName: tableName,
                Key:{
                    "room_id": event.bodyjson.room_id
                }
            }            
            
            dbdoc.get(params, function(err, data) {
                console.log('lower_defcon_get:', JSON.stringify(data, null, 2));
                if (!err && !isEmpty(data)) {
                    params.Item = data.Item;
                    var new_level = data.Item.current_level;
                    new_level = (new_level < 5)? new_level + 1 : new_level;
                        var message = "Defcon lowered to level " + new_level + " in room " + data.Item.name
                        params.Message = message;
                        var data = updateRoomStatus(params, new_level, callback);
                } 
            });
            break;               
            
        case 'add_room':
            
            var params = {
                TableName: tableName,
                Key:{
                    "room_id": event.bodyjson.room_id
                }
            }
            console.log('params:', JSON.stringify(params, null, 2));
            dbdoc.get(params, function(err, data) {
                if (!err && !isEmpty(data)) {
                    done(null, data);
                }
                else{

                    var item = event.bodyjson;
                    item.configuration_last_updated = new Date().toISOString();
                    item.current_level = 5;
                    item.level_auto_lower_time = 0,
                    item.level_last_updated = new Date().toISOString();
                    item.level_last_updated_by = "auto";

                    var params = {
                        TableName:tableName,
                        Item: item
                        };
                    
                    console.log('params2:', JSON.stringify(params, null, 2));
                    dbdoc.put(params, function(err, data) {
                        if (err) {
                            done(err, data);
                        } else {
                            readItem(event.bodyjson.room_id, done);
                        }
                    });
                }
            });
            break;            
        case 'POST':
            db.putItem(JSON.parse(event.body), done);
            break;
        case 'PUT':
            db.updateItem(JSON.parse(event.body), done);
            break;
        default:
            done(new Error(`Unsupported method "${event.httpMethod}"`));
    }
};
