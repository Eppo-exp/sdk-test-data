<?php

require __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->safeLoad();

use Eppo\EppoClient;
use Eppo\SDKTest\Config;

$config = new Config();

$eppoClient = EppoClient::init(
    $config->apiKey,
    $config->apiServer
);

$eppoClient->startPolling();
