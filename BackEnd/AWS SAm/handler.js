'use strict';

const databaseManager = require('./databaseManager');
const { v4: uuidv4 } = require('uuid');

exports.hello = async (event) => {
    console.log(event);

    switch (event.httpMethod) {
        case 'DELETE':
            return deleteItem(event);
        case 'GET':
        if (event.pathParameters && event.pathParameters.itemId) {
            return getItem(event);
        } else {
            return getAllItems(event); 
        }
        case 'POST':
            return saveItem(event);
        case 'PUT':
            return updateItem(event);
        default:
            return sendResponse(404, `Unsupported method "${event.httpMethod}"`);
    }
};

function saveItem(event) {
    const item = JSON.parse(event.body);
    item.itemId = uuidv4();

    return databaseManager.saveItem(item).then(response => {
        console.log(response);
        return sendResponse(200, item.itemId);
    });
}

function getItem(event) {
    const itemId = event.pathParameters.itemId;

    return databaseManager.getItem(itemId).then(response => {
        console.log(response);
        return sendResponse(200, response);
    });
}

function getAllItems() {
    return databaseManager.getAllItems().then(response => {
        console.log(response);
        return sendResponse(200, response);
    });
}


function deleteItem(event) {
    const itemId = event.pathParameters.itemId;

    return databaseManager.deleteItem(itemId).then(response => {
        return sendResponse(200, 'DELETE ITEM');
    });
}

function updateItem(event) {
    const itemId = event.pathParameters.itemId;

    const body = JSON.parse(event.body);
    const paramName = body.paramName;
    const paramValue = body.paramValue;

    return databaseManager.updateItem(itemId, paramName, paramValue).then(response => {
        console.log(response);
        return sendResponse(200, response);
    });
}

function sendResponse(statusCode, message) {
    const response = {
        statusCode: statusCode,
        body: JSON.stringify(message)
    };
    return response;
}
