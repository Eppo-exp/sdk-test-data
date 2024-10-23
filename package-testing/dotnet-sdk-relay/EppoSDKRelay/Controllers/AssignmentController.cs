using Microsoft.AspNetCore.Mvc;

using EppoSDKRelay.DTO;
using eppo_sdk;
using System.Text.Json;
using Newtonsoft.Json.Linq;

namespace EppoSDKRelay.controllers;


[Route("flags/v1/assignment")]
public class AssignmentController : JsonControllerBase
{
    [HttpPost]
    public ActionResult<string> Post([FromBody] AssignmentRequest data)
    {
        // If there was a parsing error, this is how it is recorded. We want to fail this tast so return an error
        var errors = ModelState.Values.SelectMany(x => x.Errors);
        foreach (var err in errors)
        {
            return JsonError(err.ErrorMessage);
        }



        var eppoClient = EppoClient.GetInstance();

        var defaultValue = data.DefaultValue ?? "";

        Console.WriteLine(defaultValue);
        // Console.WriteLine(data.SubjectAttributes["one_of_flag"]);
        Console.WriteLine(string.Join(";", [.. data.SubjectAttributes.Keys]));
        Console.WriteLine(string.Join(";", [.. data.SubjectAttributes.Values]));
        Console.WriteLine(data.SubjectKey);
        Console.WriteLine(data.Flag);
        Console.WriteLine(data.AssignmentType);

        var covertedAttributes = data.SubjectAttributes.Select<KeyValuePair<string, object>, KeyValuePair<string, object>>(kvp => {
            if (kvp.Value is JsonElement elementValue)
            {
                if (elementValue.ValueKind == JsonValueKind.String || elementValue.ValueKind == JsonValueKind.Null)
                {
                    return KeyValuePair.Create(kvp.Key, (object)elementValue.GetString()!);
                }
                else if (elementValue.ValueKind == JsonValueKind.True || elementValue.ValueKind == JsonValueKind.False)
                {
                    return KeyValuePair.Create(kvp.Key, (object)elementValue.GetBoolean());
                }
                else if (elementValue.ValueKind == JsonValueKind.Number)
                {
                    return KeyValuePair.Create(kvp.Key, (object)elementValue.GetDouble());
                }
            }
            return kvp;
        }).ToDictionary(kvp=> kvp.Key, kvp=> kvp.Value);

        switch (data.AssignmentType)
        {
            case "STRING":
                return JsonResult(eppoClient.GetStringAssignment(data.Flag, data.SubjectKey, covertedAttributes, defaultValue.ToString()!));

            case "INTEGER":
                var intResults = eppoClient.GetIntegerAssignment(data.Flag, data.SubjectKey, covertedAttributes, Convert.ToInt64(defaultValue.ToString()));
                Console.WriteLine("Result");
                Console.WriteLine(intResults);
                return JsonResult(intResults);

            case "BOOLEAN":
                return JsonResult(eppoClient.GetBooleanAssignment(data.Flag, data.SubjectKey, covertedAttributes, Convert.ToBoolean(defaultValue.ToString())));

            case "NUMERIC":
                return JsonResult(eppoClient.GetNumericAssignment(data.Flag, data.SubjectKey, covertedAttributes, Convert.ToDouble(defaultValue.ToString())));

            case "JSON":
            var jString = defaultValue.ToString();
                var defaultJson = JObject.Parse(jString);
                return JsonResult(eppoClient.GetJsonAssignment(data.Flag, data.SubjectKey, covertedAttributes, defaultJson));
        }


        return JsonError("Invalid Assignment Type " + data.AssignmentType);
    }
}
