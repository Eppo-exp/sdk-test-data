<?php

namespace Eppo\SDKTest;

class Config
{
    public readonly string $apiKey;
    public readonly string $apiServer;

    public function __construct()
    {
        $this->apiKey = $_ENV["EPPO_API_KEY"] ?? "NOKEYSPECIFIED";
        $apiHost = $_ENV["EPPO_API_HOST"] ?? "localhost";
        $apiPort = $_ENV["EPPO_API_PORT"] ?? "5000";
        $this->apiServer = "http://${apiHost}:${apiPort}";
    }
}
