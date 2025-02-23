namespace EppoSDKRelay.DTO;

using System.Text.Json;

public class AttributeSet
{
    public required Dictionary<string, object?> NumericAttributes { get; set; }
    public required Dictionary<string, object?> CategoricalAttributes { get; set; }

    public Dictionary<string, string?> CategoricalAttributesAsStrings
    {
        get
        {
            return CategoricalAttributes.ToDictionary(kvp => kvp.Key, kvp => Convert.ToString(kvp.Value));
        }
    }
    public Dictionary<string, object?> NumericAttributesAsNumbers => NumericAttributes
                .Where(kvp =>
                    (kvp.Value is JsonElement jsonElement) && jsonElement.ValueKind == JsonValueKind.Number)
                .ToDictionary(kvp => kvp.Key, static kvp => kvp.Value == null ? null : (object?)((JsonElement)kvp.Value).GetDouble());
}
