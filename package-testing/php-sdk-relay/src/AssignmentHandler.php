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

    public function __construct(private EppoClient $eppoClient, private TestLogger $assignmentLogger)
    {
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
            if (isset(self::$methods[$variationType])) {

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
                    "request"=>$payload,
                    "assignmentLog" => $this->assignmentLogger->assignmentLogs
                ];
            } else {
                throw new Exception("Invalid variation type $variationType");
            }
        } catch (EppoClientException $e) {
            $resultResp = [
                "subjectKey" => $subjectKey,
                "result" => null,
                "error" => $e->getMessage(),
                "assignmentLog" => array_map('json_encode', $this->assignmentLogger->assignmentLogs)
            ];
        } finally {
            $this->assignmentLogger->resetLogs();
        }

        return $resultResp;
    }
}
