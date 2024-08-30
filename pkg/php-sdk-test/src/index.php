<?php

require __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();

use Eppo\EppoClient;
use Eppo\Exception\EppoClientException;
use Eppo\Logger\AssignmentEvent;
use Eppo\Logger\LoggerInterface;

$apiKey = $_ENV["EPPO_API_KEY"];
$port = $_ENV["EPPO_TEST_DATA_SERVER_PORT"];
$host = $_ENV["EPPO_TEST_DATA_SERVER_HOST"];

class TestLogger implements LoggerInterface
{
    public $logs = [];

    public function logAssignment(AssignmentEvent $assignmentEvent): void
    {
        $this->logs[] = $assignmentEvent;
    }
}

$assignmentLogger = new TestLogger();

$eppoClient = EppoClient::init(
    $apiKey,
    "$host:${port}",
    $assignmentLogger
);

// JSON posted data
$post = json_decode(file_get_contents('php://input'), true);

$flagKey = $post['flag'];
$default = $post['defaultValue'];

$subjects = $post['subjects'];

$results = [];

foreach ($subjects as $subject) {
    try {
        switch ($post['variationType']) {
            case 'INTEGER':
                $result = $eppoClient->getIntegerAssignment(
                    $flagKey,
                    $subject['subjectKey'],
                    $subject['subjectAttributes'],
                    $default
                );
                $results[] = [
                    "subjectKey" => $subject['subjectKey'],
                    "result" => $result,
                    "log" => array_pop($assignmentLogger->logs)
                ];
        }
    } catch (EppoClientException $e) {
        $results[] = [
            "subjectKey" => $subject['subjectKey'],
            "result" => $e->getMessage(),
            "log" => array_pop($assignmentLogger->logs)
        ];
    }
}

header("Content-Type: application/json");
print json_encode($results);
