<?php

require __DIR__ . '/../vendor/autoload.php';

use Composer\InstalledVersions;
use Eppo\Cache\DefaultCacheFactory;
use Eppo\EppoClient;
use Eppo\SDKTest\AssignmentHandler;
use Eppo\SDKTest\BanditHandler;
use Eppo\SDKTest\Config;
use Eppo\SDKTest\RelayLogger;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;
use Slim\Http\Response;

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->safeLoad();

$config = new Config();

$eppoEventLogger = new RelayLogger();

$eppoClient = EppoClient::init(
    $config->apiKey,
    $config->apiServer,
    $eppoEventLogger
);

$app = AppFactory::create();

$app->get('/', function (Request $request, Response $response, array $args) {
    return $response->write('hello, world');
});

$app->post('/sdk/reset', function (Request $request, Response $response, array $args) {
    DefaultCacheFactory::clearCache();
    return $response->withStatus(200);
});

$app->post('/flags/v1/assignment', function (Request $request, Response $response) {
    global $eppoClient, $eppoEventLogger;
    try {
        $handler = new AssignmentHandler($eppoClient, $eppoEventLogger);
    } catch (Exception $exception) {
        return $response->withJson(["error" => $exception->getMessage()]);
    }

    $results = $handler->getAssignment(json_decode($request->getBody(), true));
    return $response->withJson($results);
});

$app->post('/bandits/v1/action', function (Request $request, Response $response) {
    global $eppoClient, $eppoEventLogger, $app;
    $handler = new BanditHandler($eppoClient, $eppoEventLogger, $app);
    $results = $handler->getBanditAction(json_decode($request->getBody(), true));
    return $response->withJson($results);
});

$app->get('/sdk/details', function (Request $request, Response $response) {
    $sdkVersion = InstalledVersions::getPrettyVersion('eppo/php-sdk');
    $details = [
        'sdkName' => 'eppo/php-sdk',
        'sdkVersion' => $sdkVersion,
        'supportsBandits' => true,
        'supportsDynamicTyping' => true
    ];
    return $response->withJson($details);
});

$app->addErrorMiddleware(true, true, true);

$app->run();
