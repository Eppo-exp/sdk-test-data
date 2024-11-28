using Microsoft.AspNetCore.Mvc;

using EppoSDKRelay.DTO;
using eppo_sdk;
using System.Text.Json;
using Newtonsoft.Json.Linq;
using EppoSDKRelay.util;

namespace EppoSDKRelay.controllers;

[Route("flags/v1/assignment")]
public class AssignmentController : JsonControllerBase
{
    [HttpPost]
    public ActionResult<string> Post([FromBody] AssignmentRequest data)
    {
        // If there was a parsing error, this is how it is recorded. We want to fail this test so return an error
        var errors = ModelState.Values.SelectMany(x => x.Errors);
        foreach (var err in errors)
        {
            return JsonError(err.ErrorMessage);
        }

        var eppoClient = EppoClient.GetInstance();

        var defaultValue = data.DefaultValue ?? "";
        Dictionary<string, object> convertedAttributes = Values.ConvertJsonValuesToPrimitives(data.SubjectAttributes);

        switch (data.AssignmentType)
        {
            case "STRING":
                return JsonTestResponse(eppoClient.GetStringAssignment(data.Flag, data.SubjectKey, convertedAttributes, defaultValue.ToString()!));

            case "INTEGER":
                var intResults = eppoClient.GetIntegerAssignment(data.Flag, data.SubjectKey, convertedAttributes, Convert.ToInt64(defaultValue.ToString()));
                return JsonTestResponse(intResults);

            case "BOOLEAN":
                return JsonTestResponse(eppoClient.GetBooleanAssignment(data.Flag, data.SubjectKey, convertedAttributes, Convert.ToBoolean(defaultValue.ToString())));

            case "NUMERIC":
                return JsonTestResponse(eppoClient.GetNumericAssignment(data.Flag, data.SubjectKey, convertedAttributes, Convert.ToDouble(defaultValue.ToString())));

            case "JSON":
                var jString = defaultValue.ToString();
                var defaultJson = JObject.Parse(jString);
                return JsonTestResponse(eppoClient.GetJsonAssignment(data.Flag, data.SubjectKey, convertedAttributes, defaultJson));
        }

        return JsonError("Invalid Assignment Type " + data.AssignmentType);
    }


}
