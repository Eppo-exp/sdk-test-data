using Microsoft.AspNetCore.Mvc;

namespace EppoSDKRelay.controllers;

[Route("/")]
public class SDKContHealthControllerroller : ControllerBase
{

    [HttpGet]
    public ActionResult<IEnumerable<string>> Check()
    {
        return new string[] { "hello", "world" };
    }
}
