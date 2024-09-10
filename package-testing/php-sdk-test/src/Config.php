<?php

namespace Eppo\SDKTest;

class Config
{
    public readonly string $apiKey;
    public readonly string $apiServer;

    public function __construct()
    {
        $this->apiKey = $_ENV["EPPO_API_KEY"] ?? "NOKEYSPECIFIED";
        $this->apiServer = $_ENV["EPPO_API_SERVER"] ?? "http://localhost:5000";
    }
}