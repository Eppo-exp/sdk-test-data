<?php

namespace Eppo\SDKTest;

use Eppo\EppoClient;
use Eppo\Exception\EppoClientException;

class AssignmentHandler
{

    public function __construct(private EppoClient $eppoClient, private TestLogger $assignmentLogger)
    {
    }

    public function getAssignments(array $payload)
    {
        $flagKey = $payload['flag'];
        $default = $payload['defaultValue'];

        $subjects = $payload['subjects'];

        $results = [];

        foreach ($subjects as $subject) {
            try {
                $result = null;
                switch ($payload['variationType']) {
                    case 'INTEGER':
                        $result = $this->eppoClient->getIntegerAssignment(
                            $flagKey,
                            $subject['subjectKey'],
                            $subject['subjectAttributes'],
                            $default
                        );
                        break;
                    case 'STRING':
                        $result = $this->eppoClient->getStringAssignment(
                            $flagKey,
                            $subject['subjectKey'],
                            $subject['subjectAttributes'],
                            $default
                        );
                        break;
                    case 'BOOLEAN':
                        $result = $this->eppoClient->getBooleanAssignment(
                            $flagKey,
                            $subject['subjectKey'],
                            $subject['subjectAttributes'],
                            $default
                        );
                        break;
                    case 'NUMERIC':
                        $result = $this->eppoClient->getNumericAssignment(
                            $flagKey,
                            $subject['subjectKey'],
                            $subject['subjectAttributes'],
                            $default
                        );
                        break;
                    case 'JSON':
                        $result = $this->eppoClient->getJSONAssignment(
                            $flagKey,
                            $subject['subjectKey'],
                            $subject['subjectAttributes'],
                            $default
                        );
                        break;
                }
                $results[] = [
                    "subjectKey" => $subject['subjectKey'],
                    "result" => $result,
                    "assignmentLog" => $this->assignmentLogger->assignmentLogs
                ];
            } catch (EppoClientException $e) {
                $results[] = [
                    "subjectKey" => $subject['subjectKey'],
                    "result" => $e->getMessage(),
                    "assignmentLog" => $this->assignmentLogger->assignmentLogs
                ];
            } finally {
                $this->assignmentLogger->resetLogs();
            }
        }
        return $results;
    }
}