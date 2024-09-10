<?php

namespace Eppo\SDKTest;

use Eppo\DTO\Bandit\AttributeSet;
use Eppo\EppoClient;
use Eppo\Exception\EppoClientException;
use Psr\Log\LogLevel;
use Slim\App;
use Slim\Logger;


class BanditHandler
{
    public function __construct(
        private readonly EppoClient $eppoClient,
        private readonly TestLogger $logger,
        private readonly App $app
    ) {
    }

    public function getBanditAction(array $payload): array
    {
        $logger = new Logger();
        $logger->log(LogLevel::INFO, "Processing Bandit");
        $logger->log(LogLevel::INFO, json_encode($payload, true));

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

        $logger->log(
            LogLevel::INFO,
            var_export(
                [
                    $flagKey,
                    $subjectKey,
                    $subjectAttributes,
                    $actions,
                    $default
                ], true
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
                "assignmentLog" => $this->logger->assignmentLogs,
                "banditLog" => $this->logger->banditLogs
            ];
        } catch (EppoClientException $e) {
            $results = array(
                "subjectKey" => $subjectKey,
                "result" => $e->getMessage(),
                "assignmentLog" => $this->logger->assignmentLogs,
                "banditLog" => array_map('json_encode', $this->logger->banditLogs)
            );
        } finally {
            $this->logger->resetLogs();
        }
        return $results;
    }
}
