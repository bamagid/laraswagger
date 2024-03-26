function generateResponseExample(item) {
    const method = item.method ? item.method.toUpperCase() : "GET";
    const responses = [];

    switch (method) {
        case "POST":
            responses.push({ status: 201, description: "Created successfully" });
            responses.push({ status: 400, description: "Bad Request" });
            responses.push({ status: 401, description: "Unauthorized" });
            responses.push({ status: 403, description: "Forbidden" });
            break;
        case "DELETE":
            responses.push({ status: 204, description: "Deleted successfully" });
            responses.push({ status: 404, description: "Not Found" });
            responses.push({ status: 401, description: "Unauthorized" });
            responses.push({ status: 403, description: "Forbidden" });
            break;
        default:
            responses.push({ status: 200, description: "OK" });
            responses.push({ status: 404, description: "Not Found" });
            responses.push({ status: 500, description: "Internal Server Error" });
            break;
    }

    const responseExamples = {};
    responses.forEach((response) => {
        responseExamples[response.status] = {
            description: response.description,
            content: {
                "application/json": {
                    schema: {},
                    example: "",
                },
            },
        };
    });

    return responseExamples;
}
function generateRequestBody(item) {
    if (item.body?.text || item.body?.params) {
        let json;
        if (item.body.text) {
            try {
                json = JSON.parse(item.body.text);
            } catch (error) {
                console.error("Error parsing JSON for resource:", item);
                return null;
            }
        } else if (item.body.params) {
            json = item.body.params.reduce((acc, param) => {
                acc[param.name] = param.value;
                if (param.type === "file") {
                    acc[param.name] = { type: "string", format: "binary" };
                }
                return acc;
            }, {});
        }
        const contentType =
            item.method.toUpperCase() === "PUT" ||
                item.method.toUpperCase() === "PATCH"
                ? "application/x-www-form-urlencoded"
                : "multipart/form-data";
        return {
            content: {
                [contentType]: {
                    schema: {
                        type: "object",
                        properties: Object.entries(json).reduce((ac, [k, v]) => {
                            switch (typeof v) {
                                case "number":
                                    ac[k] = { type: "integer" };
                                    break;
                                case "object":
                                    ac[k] = { type: "string", format: "binary" };
                                    break;
                                default:
                                    ac[k] = { type: typeof v };
                            }
                            return ac;
                        }, {}),
                    },
                    example: json,
                },
            },
        };
    }

    return null;
}

function isPostmanFormat(json) {
    return json.hasOwnProperty('info') && json.hasOwnProperty('item');
  }
  function convertToInsomniaFormat(inputJson) {
    if (!isPostmanFormat(inputJson)) {
      return inputJson;
    }
    const insomniaJson = {
      "_type": "export",
      "__export_format": 4,
      "__export_date": new Date().toISOString(),
      "__export_source": "insomnia.desktop.app:v8.6.1",
      "resources": []
    };
  
    const workspaceId = `wrk_${inputJson.info._postman_id}`;
    insomniaJson.resources.push({
      "_id": workspaceId,
      "parentId": null,
      "modified": Date.now(),
      "created": Date.now(),
      "name": inputJson.info.name,
      "description": "",
      "scope": "collection",
      "_type": "workspace"
    });
  
    inputJson.item.forEach(item => {
      const folderId = Array.isArray(item.item) ? `fld_${Math.random().toString(36).substring(7)}` : null;
      if (folderId) {
        insomniaJson.resources.push({
          "_id": folderId,
          "parentId": workspaceId,
          "modified": Date.now(),
          "created": Date.now(),
          "name": item.name,
          "description": "",
          "environment": {},
          "environmentPropertyOrder": null,
          "metaSortKey": -Date.now(),
          "_type": "request_group"
        });
      }
  
      const requests = Array.isArray(item.item) ? item.item : [item];
  
      requests.forEach(subItem => {
        const requestId = `req_${Math.random().toString(36).substring(7)}`;
        const requestBody = {
          "params": [],
          "mimeType": "multipart/form-data"
        };
  
        if (subItem.request.body) {
          Object.entries(subItem.request.body).forEach(([key, value]) => {
            if (key === 'formdata') {
              value.forEach(param => {
                requestBody.params.push({
                  "type": param.type,
                  "name": param.key,
                  "disabled": true,
                  "value": param.value || ''
                });
              });
            }
          });
        }
  
        const requestParams = (subItem.request.url.query || []).map(param => ({
          "name": param.key,
          "value": param.value || '',
          "disabled": false
        }));
        let url = subItem.request.url.raw || "";
        const regex = /(\?[\w\d]+=[\w\d]+)/;
        if (regex.test(url)) {
          url = url.replace(regex, "");
        }
        insomniaJson.resources.push({
          "_id": requestId,
          "parentId": folderId || workspaceId,
          "modified": Date.now(),
          "created": Date.now(),
          "url": url,
          "name": subItem.name,
          "description": "",
          "method": subItem.request.method,
          "body": requestBody,
          "parameters": requestParams,
          "headers": subItem.request.header || [],
          "authentication": subItem.request.auth || {},
          "metaSortKey": -Date.now(),
          "isPrivate": false,
          "pathParameters": [],
          "settingStoreCookies": true,
          "settingSendCookies": true,
          "settingDisableRenderRequestBody": false,
          "settingEncodeUrl": true,
          "settingRebuildPath": true,
          "settingFollowRedirects": "global",
          "_type": "request"
        });
      });
    });
  
    return insomniaJson;
  }
  
module.exports = { generateRequestBody, generateResponseExample,convertToInsomniaFormat,isPostmanFormat };