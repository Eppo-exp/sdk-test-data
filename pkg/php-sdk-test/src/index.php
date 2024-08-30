<?php

require __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();

use Eppo\EppoClient;
use Eppo\Exception\EppoClientException;
use Eppo\Logger\AssignmentEvent;
use Eppo\Logger\IBanditLogger;
use Eppo\Logger\LoggerInterface;

$apiKey = $_ENV["EPPO_API_KEY"];
$port = $_ENV["EPPO_TEST_DATA_SERVER_PORT"];
$host = $_ENV["EPPO_TEST_DATA_SERVER_HOST"];

class TestLogger implements IBanditLogger
{
    public $assignmentLogs = [];

    public $banditLogs = [];

    public function logAssignment(AssignmentEvent $assignmentEvent): void
    {
        $this->assignmentLogs[] = $assignmentEvent;
    }

    public function logBanditAction(\Eppo\Logger\BanditActionEvent $banditActionEvent): void
    {
        $this->banditLogs[] = $banditActionEvent;
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

function testFlags($post)
{
    global $eppoClient, $assignmentLogger;

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
                        "assignmentLog" => array_pop($assignmentLogger->assignmentLogs)
                    ];
            }
        } catch (EppoClientException $e) {
            $results[] = [
                "subjectKey" => $subject['subjectKey'],
                "result" => $e->getMessage(),
                "assignmentLog" => array_pop($assignmentLogger->assignmentLogs)
            ];
        }
    }
    return $results;
}

function testBandits($banditTestCases)
{
    global $eppoClient, $assignmentLogger;

    $flagKey = $banditTestCases['flag'];
    $default = $banditTestCases['defaultValue'];

    $subjects = $banditTestCases['subjects'];

    $results = [];

    foreach ($subjects as $subject) {
        $actions = [];
        foreach($subject['actions'] as $action) {
            $actions[$action['actionKey']] = new \Eppo\DTO\Bandit\AttributeSet(
                $action['numericAttributes'],
                $action['categoricalAttributes']
            );
        }

        try {
            $result = $eppoClient->getBanditAction(
                $flagKey,
                $subject['subjectKey'],
                $subject['subjectAttributes'],
                $actions,
                $default
            );
            $results[] = [
                "subjectKey" => $subject['subjectKey'],
                "result" => $result,
                "assignmentLog" => array_pop($assignmentLogger->assignmentLogs),
                "banditLog" => array_pop($assignmentLogger->banditLogs)
            ];
        } catch (EppoClientException $e) {
            $results[] = [
                "subjectKey" => $subject['subjectKey'],
                "result" => $e->getMessage(),
                "assignmentLog" => array_pop($assignmentLogger->assignmentLogs),
                "banditLog" => array_pop($assignmentLogger->banditLogs)
            ];
        }
    }
    return $results;
}

if (isset($post['variationType'])) {
    // This is a flag test
    $results = testFlags($post);
} else {
    $results = testBandits($post);
}


header("Content-Type: application/json");
print json_encode($results);
