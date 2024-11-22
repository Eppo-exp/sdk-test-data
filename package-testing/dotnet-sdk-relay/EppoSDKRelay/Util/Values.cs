using System.Text.Json;

namespace EppoSDKRelay.util;


public class Values {
        public static Dictionary<string, object> ConvertJsonValuesToPrimitives(Dictionary<string, Object>  subjectAttributes)
    {
        return subjectAttributes.Select<KeyValuePair<string, object>, KeyValuePair<string, object>>(kvp =>
        {
            if (kvp.Value is JsonElement elementValue)
            {
                if (elementValue.ValueKind == JsonValueKind.String || elementValue.ValueKind == JsonValueKind.Null)
                {
                    return KeyValuePair.Create(kvp.Key, (object)elementValue.GetString()!);
                }
                else if (elementValue.ValueKind == JsonValueKind.True || elementValue.ValueKind == JsonValueKind.False)
                {
                    return KeyValuePair.Create(kvp.Key, (object)elementValue.GetBoolean());
                }
                else if (elementValue.ValueKind == JsonValueKind.Number)
                {
                    return KeyValuePair.Create(kvp.Key, (object)elementValue.GetDouble());
                }
            }
            return kvp;
        }).ToDictionary(kvp => kvp.Key, kvp => kvp.Value);
    }
}