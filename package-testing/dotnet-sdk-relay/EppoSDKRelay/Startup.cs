using eppo_sdk;
using Microsoft.OpenApi.Models;

namespace EppoSDKRelay;

public class Startup
{
    static readonly String apiHost = Environment.GetEnvironmentVariable("EPPO_API_HOST") ?? "localhost";
    static readonly String apiPort = Environment.GetEnvironmentVariable("EPPO_API_PORT") ?? "5000";
    static readonly String apiToken = Environment.GetEnvironmentVariable("EPPO_API_TOKEN") ?? "NO_TOKEN";


    public static void InitEppoClient()
    {
        var url = "http://" + apiHost + ":" + apiPort + "/api";
        Console.WriteLine("Initializating SDK pointed at" + url);

        var eppoClientConfig = new EppoClientConfig(apiToken, new AssignmentLogger())
        {
            BaseUrl = url
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
            app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "My REST Server v1"));
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
