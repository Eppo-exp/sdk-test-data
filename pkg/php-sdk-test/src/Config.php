<?php

namespace Eppo\SDKTest;

class Config
{
    public readonly string $apiKey;
    public readonly int $port;
    public readonly string $host;

    public function __construct()
    {
        $this->apiKey = $_ENV["EPPO_API_KEY"] ?? "NOKEYSPECIFIED";
        $this->port = intval($_ENV["EPPO_TEST_DATA_SERVER_PORT"] ?? 5000);
        $this->host = $_ENV["EPPO_TEST_DATA_SERVER_HOST"] ?? "localhost";
    }
}