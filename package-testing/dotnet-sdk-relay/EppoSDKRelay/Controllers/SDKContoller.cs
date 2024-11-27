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
        // The SDK test runner can skip some tests depending on what the SDK supports.
        var supportedFeatures = new Dictionary<string, bool> {
            ["bandits"] = true,
            ["dynamicTyping"] = true
        };

        // Sneak the SDK version and name from the AppDetails object
        var apd = new AppDetails();
        var sdkDetails = new Dictionary<string, object>
        {
            ["sdkVersion"] = apd.Version,
            ["sdkName"] = apd.Name,
            ["supports"] = supportedFeatures
        };

        return JsonObjectResponse(
            sdkDetails
        );
    }
}
