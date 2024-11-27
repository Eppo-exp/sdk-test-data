using eppo_sdk;
using eppo_sdk.helpers;
using Microsoft.AspNetCore.Mvc;


namespace EppoSDKRelay.controllers;

public class SDKController : JsonControllerBase
{
    // POST sdk/reset
    [Route("/sdk/reset")]
    [HttpPost]
    public ActionResult<IEnumerable<string>> Reset()
    {
        // Startup.InitEppoClient();
        EppoClient.GetInstance().RefreshConfiguration();
        return Ok();
    }

    // GET sdk/details
    [Route("/sdk/details")]
    [HttpGet]
    public ActionResult<String> Details()
    {
        var apd = new AppDetails();

        var sdkDetails = new Dictionary<string, object>
        {
            ["sdkVersion"] = apd.Version,
            ["sdkName"] = apd.Name,
            ["supportDynamicTypes"] = true
        };
        return JsonObjectResponse(
            sdkDetails
        );
    }
}
