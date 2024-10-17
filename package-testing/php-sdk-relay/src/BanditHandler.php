<?php

namespace Eppo\SDKTest;

use Eppo\DTO\Bandit\AttributeSet;
use Eppo\EppoClient;
use Eppo\Exception\EppoClientException;
use Psr\Log\LogLevel;
use Slim\Logger;

class BanditHandler
{
    public function __construct(
        private readonly EppoClient $eppoClient,
        private readonly RelayLogger $eppoEventLogger
    ) {
    }

    public function getBanditAction(array $payload): array
    {
        $consoleLogger = new Logger();
        $consoleLogger->log(LogLevel::INFO, "Processing Bandit");
        $consoleLogger->log(LogLevel::DEBUG, json_encode($payload, true));

        $flagKey = $payload['flag'];
        $default = $payload['defaultValue'];
        $subjectKey = $payload['subjectKey'];

        $actions = [];
        foreach ($payload['actions'] as $action) {
            $actions[$action['actionKey']] = new AttributeSet(
                $action['numericAttributes'],
                $action['categoricalAttributes']
            );
        }

        $subjectAttributes = new AttributeSet(
            $payload['subjectAttributes']['numericAttributes'],
            $payload['subjectAttributes']['categoricalAttributes']
        );

        $consoleLogger->log(
            LogLevel::INFO,
            var_export(
                [
                    $flagKey,
                    $subjectKey,
                    $subjectAttributes,
                    $actions,
                    $default
                ],
                true
            )
        );

        try {
            $result = $this->eppoClient->getBanditAction(
                $flagKey,
                $subjectKey,
                $subjectAttributes,
                $actions,
                $default
            );
            $results = [
                "subjectKey" => $subjectKey,
                "result" => $result,
                "request" => $payload,
                "assignmentLog" => $this->eppoEventLogger->assignmentLogs,
                "banditLog" => $this->eppoEventLogger->banditLogs
            ];
        } catch (EppoClientException $e) {
            $results = array(
                "subjectKey" => $subjectKey,
                "result" => $e->getMessage(),
                "assignmentLog" => $this->eppoEventLogger->assignmentLogs,
                "banditLog" => array_map('json_encode', $this->eppoEventLogger->banditLogs)
            );
        } finally {
            $this->eppoEventLogger->resetLogs();
        }
        return $results;
    }
}
