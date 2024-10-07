<?php

namespace Eppo\SDKTest;

use Eppo\EppoClient;
use Eppo\Exception\EppoClientException;
use Exception;

class AssignmentHandler
{
    private static array $methods = [
        'INTEGER' => 'getIntegerAssignment',
        'STRING' => 'getStringAssignment',
        'BOOLEAN' => 'getBooleanAssignment',
        'NUMERIC' => 'getNumericAssignment',
        'JSON' => 'getJSONAssignment',
    ];

    public function __construct(
        private readonly EppoClient $eppoClient,
        private readonly RelayLogger $eppoEventLogger
    ) {
    }

    /**
     * @throws Exception
     */
    public function getAssignment(array $payload): array
    {
        $variationType = $payload['variationType'];
        $flagKey = $payload['flag'];
        $default = $payload['defaultValue'];
        $subjectKey = $payload['subjectKey'];
        $subjectAttributes = $payload['subjectAttributes'];

        try {
            if (!isset(self::$methods[$variationType])) {
                throw new Exception("Invalid variation type $variationType");
            }
            // Use `self::$methods` to map from variation type to the name of the function to call on `EppoClient`
            $result = $this->eppoClient->{self::$methods[$variationType]}(
                $flagKey,
                $subjectKey,
                $subjectAttributes,
                $default
            );
            $resultResp = [
                "subjectKey" => $subjectKey,
                "result" => $result,
                "request" => $payload,
                "assignmentLog" => $this->eppoEventLogger->assignmentLogs
            ];
        } catch (EppoClientException $e) {
            $resultResp = [
                "subjectKey" => $subjectKey,
                "result" => null,
                "error" => $e->getMessage(),
                "assignmentLog" => array_map('json_encode', $this->eppoEventLogger->assignmentLogs)
            ];
        } finally {
            $this->eppoEventLogger->resetLogs();
        }

        return $resultResp;
    }
}
