<?php

require __DIR__ . '/../vendor/autoload.php';

use Eppo\SDKTest\AssignmentHandler;
use Eppo\SDKTest\BanditHandler;
use Eppo\SDKTest\TestLogger;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;
use Eppo\EppoClient;
use Slim\Http\Response;

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->safeLoad();

const API_KEY = 'EPPO_API_KEY';
const SERVER = 'EPPO_TEST_DATA_SERVER_HOST';
const SERVER_PORT = 'EPPO_TEST_DATA_SERVER_PORT';

$config[API_KEY] = $_ENV[API_KEY] ?? '';
$config[SERVER] = $_ENV[SERVER];
$config[SERVER_PORT] = $_ENV[SERVER_PORT];

$testLogger = new TestLogger();

$eppoClient = EppoClient::init(
    $config[API_KEY],
    "${config[SERVER]}:${config[SERVER_PORT]}",
    $testLogger
);

$app = AppFactory::create();

$app->post('/flags/v1/assignments', function (Request $request, Response $response, array $args) {
    global $eppoClient, $testLogger;
    $handler = new AssignmentHandler($eppoClient, $testLogger);
    $results = $handler->getAssignments(json_decode($request->getBody(), true));
    return $response->withJson($results);
});

$app->post('/bandits/v1/actions', function (Request $request, Response $response, array $args) {
    global $eppoClient, $testLogger;
    $handler = new BanditHandler($eppoClient, $testLogger);
    $results = $handler->getBanditResults(json_decode($request->getBody(), true));
    return $response->withJson($results);
});

$app->addErrorMiddleware(true, true, true);


$app->run();
