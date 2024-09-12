<?php

namespace Eppo\SDKTest;

use Eppo\Logger\AssignmentEvent;
use Eppo\Logger\BanditActionEvent;
use Eppo\Logger\IBanditLogger;

class TestLogger implements IBanditLogger
{
    /**
     * @var AssignmentEvent[]
     */
    public array $assignmentLogs = [];

    /**
     * @var BanditActionEvent[]
     */
    public array $banditLogs = [];

    public function logAssignment(AssignmentEvent $assignmentEvent): void
    {
        $this->assignmentLogs[] = $assignmentEvent;
    }

    public function logBanditAction(BanditActionEvent $banditActionEvent): void
    {
        $this->banditLogs[] = $banditActionEvent;
    }

    public function resetLogs()
    {
        $this->assignmentLogs = [];
        $this->banditLogs = [];
    }
}
