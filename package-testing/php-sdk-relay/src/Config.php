<?php

namespace Eppo\SDKTest;

class Config
{
    public readonly string $apiKey;
    public readonly string $apiServer;

    public function __construct()
    {
        $this->apiKey = $_ENV["EPPO_API_KEY"] ?? "NOKEYSPECIFIED";
        $apiServer = $_ENV["EPPO_BASE_URL"] ?? "localhost:5000";
        $this->apiServer = "http://${apiServer}/api";
    }
}
