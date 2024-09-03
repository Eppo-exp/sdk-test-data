<?php

namespace Eppo\SDKTest;

use Eppo\DTO\Bandit\AttributeSet;
use Eppo\EppoClient;
use Eppo\Exception\EppoClientException;


class BanditHandler
{
    public function __construct(private readonly EppoClient $eppoClient, private readonly TestLogger $logger)
    {
    }

    public function getBanditResults(array $payload)
    {
        $flagKey = $payload['flag'];
        $default = $payload['defaultValue'];

        $subjects = $payload['subjects'];

        $results = [];

        foreach ($subjects as $subject) {
            $actions = [];
            foreach ($subject['actions'] as $action) {
                $actions[$action['actionKey']] = new AttributeSet(
                    $action['numericAttributes'],
                    $action['categoricalAttributes']
                );
            }

            try {
                $result = $this->eppoClient->getBanditAction(
                    $flagKey,
                    $subject['subjectKey'],
                    $subject['subjectAttributes'],
                    $actions,
                    $default
                );
                $results[] = [
                    "subjectKey" => $subject['subjectKey'],
                    "result" => $result,
                    "assignmentLog" => $this->logger->assignmentLogs,
                    "banditLog" => $this->logger->banditLogs
                ];
            } catch (EppoClientException $e) {
                $results[] = [
                    "subjectKey" => $subject['subjectKey'],
                    "result" => $e->getMessage(),
                    "assignmentLog" => $this->logger->assignmentLogs,
                    "banditLog" => $this->logger->banditLogs
                ];
            } finally {
                $this->logger->resetLogs();
            }
        }
        return $results;
    }
}
