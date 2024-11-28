using Microsoft.AspNetCore.Mvc;

using EppoSDKRelay.DTO;
using System.Text.Json;
using Newtonsoft.Json.Linq;
using eppo_sdk.dto;
using eppo_sdk.dto.bandit;

namespace EppoSDKRelay.controllers;

public class JsonControllerBase : ControllerBase
{

    protected static readonly JsonSerializerOptions SerializeOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true
    };

    protected static ActionResult<string> JsonTestResponse(object result)
    {
        // System.Text.Json does not play nicely with Newtonsoft types
        // Since "Objects" implement IEnumerable, System.Text will try to encode
        // the json object as an array. :(
        if (result is JObject)
        {
            result = ((JObject)result).ToObject<Dictionary<string, object>>();
        }

        var response = new TestResponse
        {
            Result = result,
            AssignmentLog = DequeueAll<AssignmentLogData>(AssignmentLogger.Instance.AssignmentLogs),
            BanditLog =  DequeueAll<BanditLogEvent>(AssignmentLogger.Instance.BanditLogs),
        };
        return JsonSerializer.Serialize(response, SerializeOptions);
    }

    protected static ActionResult<string> JsonObjectResponse(object result)
    {
        // System.Text.Json does not play nicely with Newtonsoft types
        // Since "Objects" implement IEnumerable, System.Text will try to encode
        // the json object as an array. :(
        if (result is JObject) {
            result = ((JObject)result).ToObject<Dictionary<string, object>>();
        }
        return JsonSerializer.Serialize(result, SerializeOptions);
    }
    
    protected static ActionResult<string> JsonError(String error)
    {
        return JsonSerializer.Serialize(new TestResponse
        {
            Error = error
        }, SerializeOptions);
    }


    public static List<object> DequeueAll<T>(Queue<T> queue)
    {
        List<object> items = [];

        while (queue.Count > 0)
        {
            var item = queue.Dequeue();
            if (item != null)
            {
                items.Add(item);
            }
        }

        return items;
    }
}
