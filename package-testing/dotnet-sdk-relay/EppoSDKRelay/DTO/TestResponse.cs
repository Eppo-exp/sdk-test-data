namespace EppoSDKRelay.DTO;

public class TestResponse
{
    public object Result { get; set; }
    public List<object> AssignmentLog { get; set; }
    public List<object> BanditLog { get; set; }
    public string Error { get; set; }
}