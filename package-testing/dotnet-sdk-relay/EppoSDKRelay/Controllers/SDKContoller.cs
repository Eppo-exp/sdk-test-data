using eppo_sdk;
using Microsoft.AspNetCore.Mvc;

namespace EppoSDKRelay.controllers;

[Route("/sdk/reset")]
public class SDKController : ControllerBase
{
    // POST sdk/reset
    [HttpPost]
    public ActionResult<IEnumerable<string>> Reset()
    {
        // Startup.InitEppoClient();
        EppoClient.GetInstance().RefreshConfiguration();
        return Ok();
    }

}
