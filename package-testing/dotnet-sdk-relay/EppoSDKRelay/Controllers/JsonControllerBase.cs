using Microsoft.AspNetCore.Mvc;

using EppoSDKRelay.DTO;
using System.Text.Json;
using Newtonsoft.Json.Linq;

namespace EppoSDKRelay.controllers;

public class JsonControllerBase : ControllerBase {

    protected static readonly JsonSerializerOptions SerializeOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true
    };

    protected static ActionResult<string> JsonResult(object result)
    {
        // System.Text.Json does not play nicely with Newtonsoft types
        // Since "Objects" implement IEnumerable, System.Text will try to encode
        // the json object as an array. :(
        if (result is JObject) {
            result = ((JObject)result).ToObject<Dictionary<string, object>>();
        }

        var response = new TestResponse
        {
            Result = result
        };
        return JsonSerializer.Serialize(response, SerializeOptions);
    }
    
    protected static ActionResult<string> JsonError(String error)
    {
        return JsonSerializer.Serialize(new TestResponse
        {
            Error = error
        }, SerializeOptions);
    }
    
}
