using eppo_sdk.dto;
using eppo_sdk.dto.bandit;
using eppo_sdk.logger;

internal class AssignmentLogger : IAssignmentLogger
{
    public static AssignmentLogger Instance = new();

    public Queue<AssignmentLogData> AssignmentLogs = new();
    public Queue<BanditLogEvent> BanditLogs = new();

    public void LogAssignment(AssignmentLogData assignmentLogData)
    {
        Console.WriteLine("Assignment Log");
        Console.WriteLine(assignmentLogData);
        AssignmentLogs.Enqueue(assignmentLogData);
    }

    public void LogBanditAction(BanditLogEvent banditLogEvent)
    {
        Console.WriteLine("Bandit Action Log");
        Console.WriteLine(banditLogEvent);
        BanditLogs.Enqueue(banditLogEvent);
    }
}
