using eppo_sdk;
using Microsoft.OpenApi.Models;

namespace EppoSDKRelay;

public class Startup
{
    static readonly String eppoBaseUrl = Environment.GetEnvironmentVariable("EPPO_BASE_URL") ?? "http://localhost:5000/api";
    static readonly String apiToken = Environment.GetEnvironmentVariable("EPPO_API_TOKEN") ?? "NO_TOKEN";


    public static void InitEppoClient()
    {
        Console.WriteLine("Initializating SDK pointed at" + eppoBaseUrl);

        var eppoClientConfig = new EppoClientConfig(apiToken, AssignmentLogger.Instance)
        {
            BaseUrl = eppoBaseUrl
        };

        EppoClient.Init(eppoClientConfig);
    }

    public void ConfigureServices(IServiceCollection services)
    {

        Startup.InitEppoClient();

        services.AddControllers();
        services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new OpenApiInfo
            { Title = "Eppo SDK Relay Server", Version = "v1" });
        });
    }


    // Startup.cs
    public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
    {
        if (env.IsDevelopment())
        {
            app.UseDeveloperExceptionPage();

            app.UseSwagger();
        }

        app.UseHttpsRedirection();

        app.UseRouting();

        app.UseAuthorization();

        app.UseEndpoints(endpoints =>
        {
            endpoints.MapControllers();

        });
    }
}
