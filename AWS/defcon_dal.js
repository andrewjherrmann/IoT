'use strict';

var AWS = require("aws-sdk");

console.log('Loading function');

const doc = require('dynamodb-doc');

const db = new doc.DynamoDB();

const dbdoc = new AWS.DynamoDB.DocumentClient()


/**
 * Demonstrates a simple HTTP endpoint using API Gateway. You have full
 * access to the request and response payload, including headers and
 * status code.
 *
 * To scan a DynamoDB table, make a GET request with the TableName as a
 * query string parameter. To put, update, or delete an item, make a POST,
 * PUT, or DELETE request respectively, passing in the payload to the
 * DynamoDB API as a JSON body.
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
        callback(err,{message:"Success", current_level: data.Attributes.current_level});
    });
 }
 
 function isEmpty(obj) {
  return !Object.keys(obj).length > 0;
}
 
 exports.handler = function(event, context, callback) 
{
     console.log('Received event:', JSON.stringify(event, null, 2));
    console.log(event.id);
    const done = (err, res) => callback(null, {
        statusCode: err ? '400' : '200',
        body: err ? err.message : res,
        headers: {
            'Content-Type': 'application/json',
        },
    });
    
    var tableName = "defcon";
    
    
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
                if (!err && !isEmpty(data)) {
                    params.Item = data.Item;
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
                if (!err && !isEmpty(data)) {
                    params.Item = data.Item;
                    var new_level = data.Item.current_level;
                    new_level = (new_level > 1)? new_level - 1 : new_level;
                    var data = updateRoomStatus(params, new_level, callback);
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
                if (!err && !isEmpty(data)) {
                    params.Item = data.Item;
                    var new_level = data.Item.current_level;
                    new_level = (new_level < 5)? new_level + 1 : new_level;
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