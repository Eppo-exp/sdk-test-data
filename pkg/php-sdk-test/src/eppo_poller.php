<?php

require __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();

use Eppo\EppoClient;

$apiKey = $_ENV["EPPO_API_KEY"];
$port = $_ENV["EPPO_TEST_DATA_SERVER_PORT"];
$host = $_ENV["EPPO_TEST_DATA_SERVER_HOST"];

$eppoClient = EppoClient::init(
    $apiKey,
    "$host:${port}"
);

$eppoClient->startPolling();
