namespace EppoSDKRelay.DTO;

public class AssignmentRequest
{
    public string Flag { get; set; }
    public string SubjectKey { get; set; }
    public string AssignmentType { get; set; }
    public object DefaultValue { get; set; }
    public Dictionary<string, Object> SubjectAttributes { get; set; }
}
