namespace EppoSDKRelay;

public static class Program
{

    static readonly String host = Environment.GetEnvironmentVariable("SDK_RELAY_HOST") ?? "localhost";
    static readonly String port = Environment.GetEnvironmentVariable("SDK_RELAY_PORT") ?? "4000";
    public static void Main(string[] args) =>
        CreateHostBuilder(args).Build().Run();

    public static IHostBuilder CreateHostBuilder(string[] args) =>
        Host.CreateDefaultBuilder(args)
            .ConfigureWebHostDefaults(builder =>
            {
                builder.UseStartup<Startup>();
                builder.UseUrls("http://" + host + ":" + port);
            });
}
