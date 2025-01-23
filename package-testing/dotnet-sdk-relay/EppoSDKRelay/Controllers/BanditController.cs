using Microsoft.AspNetCore.Mvc;
using EppoSDKRelay.DTO;

using eppo_sdk;

namespace EppoSDKRelay.controllers;

[Route("bandits/v1/action")]
public class BanditController : JsonControllerBase
{
    [HttpPost]
    public ActionResult<string> Post([FromBody] BanditActionRequest data)
    {
        // If there was a parsing error, this is how it is recorded. We want to fail this tast so return an error
        var errors = ModelState.Values.SelectMany(x => x.Errors);
        foreach (var err in errors)
        {
            return JsonError(err.ErrorMessage);
        }

        var eppoClient = EppoClient.GetInstance();

        if (data == null)
        {
            return JsonError("Data was not parsable");
        }

        var subject = data.GetSubjectContext();
        var actions = data.GetActionContextDict();
        var defaultVal = Convert.ToString(data.DefaultValue) ?? "";

        var result = eppoClient.GetBanditAction(data.Flag,
                                                subject,
                                                actions,
                                                defaultVal);
        return JsonTestResponse(result);
    }
}
